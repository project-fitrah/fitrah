"""
Shared types and the abstract interface every LLM provider must implement.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import AsyncIterator


# ---------------------------------------------------------------------------
# Shared data types
# ---------------------------------------------------------------------------


@dataclass
class Message:
    """A single chat turn."""

    role: str  # "system" | "user" | "assistant"
    content: str

    def to_dict(self) -> dict[str, str]:
        return {"role": self.role, "content": self.content}


@dataclass
class LLMResponse:
    """Normalised response returned by every provider after a full completion."""

    content: str
    model: str
    provider: str
    usage: dict[str, int] | None = None  # prompt_tokens, completion_tokens, total_tokens


# ---------------------------------------------------------------------------
# Abstract provider
# ---------------------------------------------------------------------------


class BaseLLMProvider(ABC):
    """
    Every concrete provider must implement *complete* and *stream*.

    Both methods accept an optional *model* override; when omitted the
    provider falls back to its configured default.
    """

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Human-readable provider identifier, e.g. ``"openai"``."""

    @abstractmethod
    async def complete(
        self,
        messages: list[Message],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> LLMResponse:
        """Return the full assistant reply as an :class:`LLMResponse`."""

    @abstractmethod
    async def stream(
        self,
        messages: list[Message],
        *,
        model: str | None = None,
        temperature: float = 0.7,
        max_tokens: int | None = None,
        **kwargs,
    ) -> AsyncIterator[str]:
        """Yield text chunks as they arrive from the provider."""

