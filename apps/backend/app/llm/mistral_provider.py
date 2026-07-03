"""Mistral provider (OpenAI-compatible endpoint)."""

from __future__ import annotations
from typing import AsyncIterator
from openai import AsyncOpenAI
from app.llm.base import BaseLLMProvider, LLMResponse, Message

_MISTRAL_BASE_URL = "https://api.mistral.ai/v1"


class MistralProvider(BaseLLMProvider):
    def __init__(self, api_key: str, default_model: str = "mistral-small-latest") -> None:
        self._client = AsyncOpenAI(base_url=_MISTRAL_BASE_URL, api_key=api_key)
        self._default_model = default_model

    @property
    def provider_name(self) -> str:
        return "mistral"

    async def complete(self, messages: list[Message], *, model: str | None = None, temperature: float = 0.7, max_tokens: int | None = None, **kwargs) -> LLMResponse:
        response = await self._client.chat.completions.create(
            model=model or self._default_model,
            messages=[m.to_dict() for m in messages],  # type: ignore[arg-type]
            temperature=temperature, max_tokens=max_tokens, **kwargs,
        )
        return LLMResponse(content=response.choices[0].message.content or "", model=response.model, provider=self.provider_name)

    async def stream(self, messages: list[Message], *, model: str | None = None, temperature: float = 0.7, max_tokens: int | None = None, **kwargs) -> AsyncIterator[str]:
        stream = await self._client.chat.completions.create(
            model=model or self._default_model,
            messages=[m.to_dict() for m in messages],  # type: ignore[arg-type]
            temperature=temperature, max_tokens=max_tokens, stream=True, **kwargs,
        )
        async for chunk in stream:
            if (delta := chunk.choices[0].delta.content):
                yield delta

