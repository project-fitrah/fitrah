"""Ollama provider (OpenAI-compatible local endpoint)."""

from __future__ import annotations
from typing import AsyncIterator
from openai import AsyncOpenAI
from app.llm.base import BaseLLMProvider, LLMResponse, Message


class OllamaProvider(BaseLLMProvider):
    def __init__(self, base_url: str = "http://localhost:11434/v1", default_model: str = "llama3.2") -> None:
        self._client = AsyncOpenAI(base_url=base_url, api_key="ollama")
        self._default_model = default_model

    @property
    def provider_name(self) -> str:
        return "ollama"

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

