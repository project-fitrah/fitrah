"""LLM facade.

Provides a single ``LLMFacade`` class that hides provider-specific
details behind a uniform interface, plus a ready-to-use ``llm`` singleton
configured from environment settings.

Usage
-----
```python
from app.llm import llm, Message

# Use the default provider (from LLM_PROVIDER env var)
response = await llm.complete([Message("user", "Hello!")])

# Override the provider for a single call
response = await llm.with_provider("groq").complete(messages)

# Stream from a specific provider
async for chunk in await llm.with_provider("anthropic").stream(messages):
    print(chunk, end="", flush=True)

# Obtain a bare provider instance
groq_provider = llm.get_provider("groq")
```
"""

from __future__ import annotations

from typing import AsyncIterator

from app.config import settings
from app.llm.base import BaseLLMProvider, LLMResponse, Message

# Provider names understood by this factory
PROVIDER_OPENAI = "openai"
PROVIDER_ANTHROPIC = "anthropic"
PROVIDER_GROQ = "groq"
PROVIDER_OLLAMA = "ollama"
PROVIDER_MISTRAL = "mistral"
PROVIDER_OTHER = "other"

_VALID_PROVIDERS = {PROVIDER_OPENAI, PROVIDER_ANTHROPIC, PROVIDER_GROQ, PROVIDER_OLLAMA, PROVIDER_MISTRAL, PROVIDER_OTHER}


def _build_provider(name: str) -> BaseLLMProvider:
    """Instantiate a fresh provider by name, reading credentials from settings."""
    name = name.lower()

    if name == PROVIDER_OPENAI:
        from app.llm.openai_provider import OpenAIProvider

        if not settings.openai_api_key:
            raise ValueError("OPENAI_API_KEY is not configured.")
        return OpenAIProvider(
            api_key=settings.openai_api_key,
            default_model=settings.openai_default_model,
        )

    if name == PROVIDER_ANTHROPIC:
        from app.llm.anthropic_provider import AnthropicProvider

        if not settings.anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured.")
        return AnthropicProvider(
            api_key=settings.anthropic_api_key,
            default_model=settings.anthropic_default_model,
        )

    if name == PROVIDER_GROQ:
        from app.llm.groq_provider import GroqProvider

        if not settings.groq_api_key:
            raise ValueError("GROQ_API_KEY is not configured.")
        return GroqProvider(
            api_key=settings.groq_api_key,
            default_model=settings.groq_default_model,
        )

    if name == PROVIDER_OLLAMA:
        from app.llm.ollama_provider import OllamaProvider

        return OllamaProvider(
            base_url=settings.ollama_base_url,
            default_model=settings.ollama_default_model,
        )

    if name == PROVIDER_MISTRAL:
        from app.llm.mistral_provider import MistralProvider

        if not settings.mistral_api_key:
            raise ValueError("MISTRAL_API_KEY is not configured.")
        return MistralProvider(
            api_key=settings.mistral_api_key,
            default_model=settings.mistral_default_model,
        )

    if name == PROVIDER_OTHER:
        from app.llm.other_provider import OtherProvider

        if not settings.other_base_url:
            raise ValueError("OTHER_BASE_URL is not configured for the 'other' provider.")
        return OtherProvider(
            base_url=settings.other_base_url,
            api_key=settings.other_api_key or "not-required",
            default_model=settings.other_default_model or "default",
        )

    raise ValueError(
        f"Unknown LLM provider '{name}'. "
        f"Valid options are: {', '.join(sorted(_VALID_PROVIDERS))}"
    )


class LLMFacade:
    """
    Provider-agnostic façade for language model calls.

    The façade lazily instantiates and caches provider objects so clients pay
    no construction cost until the first actual API call.
    """

    def __init__(self, default_provider: str | None = None) -> None:
        self._default_provider: str = (default_provider or settings.llm_provider).lower()
        self._cache: dict[str, BaseLLMProvider] = {}

    # ------------------------------------------------------------------
    # Provider access
    # ------------------------------------------------------------------

    def get_provider(self, name: str | None = None) -> BaseLLMProvider:
        """Return a (cached) provider instance by name."""
        key = (name or self._default_provider).lower()
        if key not in self._cache:
            self._cache[key] = _build_provider(key)
        return self._cache[key]

    def with_provider(self, name: str) -> "_BoundFacade":
        """
        Return a thin wrapper that routes calls to *name* instead of the
        default provider.  The original façade is unchanged.

        Example::

            await llm.with_provider("groq").complete(messages)
        """
        return _BoundFacade(facade=self, provider_name=name)

    # ------------------------------------------------------------------
    # Convenience pass-through to the default provider
    # ------------------------------------------------------------------

    async def complete(
        self,
        messages: list[Message],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> LLMResponse:
        """Delegate to the default provider's :meth:`complete`."""
        return await self.get_provider().complete(
            messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

    async def stream(
        self,
        messages: list[Message],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> AsyncIterator[str]:
        """Delegate to the default provider's :meth:`stream`."""
        return await self.get_provider().stream(
            messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )


class _BoundFacade:
    """Internal helper returned by :meth:`LLMFacade.with_provider`."""

    def __init__(self, facade: LLMFacade, provider_name: str) -> None:
        self._facade = facade
        self._provider_name = provider_name

    async def complete(
        self,
        messages: list[Message],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> LLMResponse:
        return await self._facade.get_provider(self._provider_name).complete(
            messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )

    async def stream(
        self,
        messages: list[Message],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> AsyncIterator[str]:
        return await self._facade.get_provider(self._provider_name).stream(
            messages,
            model=model,
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )


# ---------------------------------------------------------------------------
# Module-level singleton — import and use directly
# ---------------------------------------------------------------------------

llm = LLMFacade()

