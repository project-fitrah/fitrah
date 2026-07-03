"""Other / OpenAI-compatible provider.

Many third-party services (Ollama, Together AI, Mistral, Fireworks, …) expose
an OpenAI-compatible ``/v1/chat/completions`` endpoint.  This provider lets
you point to any such endpoint by configuring ``OTHER_BASE_URL``.
"""

from __future__ import annotations

from typing import AsyncIterator

from openai import AsyncOpenAI

from app.llm.base import BaseLLMProvider, LLMResponse, Message


class OtherProvider(BaseLLMProvider):
    """
    Generic OpenAI-compatible provider.

    Parameters
    ----------
    base_url:
        Root URL of the compatible API, e.g. ``"http://localhost:11434/v1"``
        for Ollama.
    api_key:
        API key (use any non-empty string for local endpoints that don't
        require authentication).
    default_model:
        Model identifier understood by the remote endpoint.
    """

    def __init__(
        self,
        base_url: str,
        api_key: str = "not-required",
        default_model: str = "default",
    ) -> None:
        self._client = AsyncOpenAI(base_url=base_url, api_key=api_key)
        self._default_model = default_model

    @property
    def provider_name(self) -> str:
        return "other"

    async def complete(
        self,
        messages: list[Message],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> LLMResponse:
        response = await self._client.chat.completions.create(
            model=model or self._default_model,
            messages=[m.to_dict() for m in messages],  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens,
            **kwargs,
        )
        choice = response.choices[0]
        usage = None
        if response.usage:
            usage = {
                "prompt_tokens": response.usage.prompt_tokens,
                "completion_tokens": response.usage.completion_tokens,
                "total_tokens": response.usage.total_tokens,
            }
        return LLMResponse(
            content=choice.message.content or "",
            model=response.model,
            provider=self.provider_name,
            usage=usage,
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
        stream = await self._client.chat.completions.create(
            model=model or self._default_model,
            messages=[m.to_dict() for m in messages],  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
            **kwargs,
        )
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if delta:
                yield delta

