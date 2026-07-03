"""Groq provider.

Groq's Python SDK mirrors the OpenAI SDK interface closely, so the
implementation is intentionally similar to :mod:`app.llm.openai_provider`.
"""

from __future__ import annotations

from typing import AsyncIterator

from groq import AsyncGroq

from app.llm.base import BaseLLMProvider, LLMResponse, Message


class GroqProvider(BaseLLMProvider):
    """Wraps the official ``groq`` async client."""

    def __init__(
        self,
        api_key: str,
        default_model: str = "llama-3.3-70b-versatile",
    ) -> None:
        self._client = AsyncGroq(api_key=api_key)
        self._default_model = default_model

    @property
    def provider_name(self) -> str:
        return "groq"

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

