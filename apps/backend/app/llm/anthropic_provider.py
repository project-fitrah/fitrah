"""Anthropic provider."""

from __future__ import annotations

from typing import AsyncIterator

import anthropic

from app.llm.base import BaseLLMProvider, LLMResponse, Message

_DEFAULT_MAX_TOKENS = 1024  # Anthropic requires an explicit max_tokens value


class AnthropicProvider(BaseLLMProvider):
    """Wraps the official ``anthropic`` async client."""

    def __init__(
        self,
        api_key: str,
        default_model: str = "claude-3-5-haiku-20241022",
    ) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._default_model = default_model

    @property
    def provider_name(self) -> str:
        return "anthropic"

    # ------------------------------------------------------------------
    # Helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _split_messages(
        messages: list[Message],
    ) -> tuple[str | None, list[dict[str, str]]]:
        """
        Anthropic separates the system prompt from the message list.
        Extract the first ``system`` message (if any) and return the rest.
        """
        system: str | None = None
        chat: list[dict[str, str]] = []
        for m in messages:
            if m.role == "system" and system is None:
                system = m.content
            else:
                chat.append(m.to_dict())
        return system, chat

    # ------------------------------------------------------------------
    # Interface
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
        system, chat = self._split_messages(messages)
        response = await self._client.messages.create(
            model=model or self._default_model,
            system=system or anthropic.NOT_GIVEN,
            messages=chat,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens or _DEFAULT_MAX_TOKENS,
            **kwargs,
        )
        content = "".join(
            block.text for block in response.content if hasattr(block, "text")
        )
        usage = {
            "prompt_tokens": response.usage.input_tokens,
            "completion_tokens": response.usage.output_tokens,
            "total_tokens": response.usage.input_tokens + response.usage.output_tokens,
        }
        return LLMResponse(
            content=content,
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
        system, chat = self._split_messages(messages)
        async with self._client.messages.stream(
            model=model or self._default_model,
            system=system or anthropic.NOT_GIVEN,
            messages=chat,  # type: ignore[arg-type]
            temperature=temperature,
            max_tokens=max_tokens or _DEFAULT_MAX_TOKENS,
            **kwargs,
        ) as stream:
            async for text in stream.text_stream:
                yield text

