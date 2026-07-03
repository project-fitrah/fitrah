"""
app.llm
~~~~~~~

Provider-agnostic LLM access for the Fitrah backend.

Quick start::

    from app.llm import llm, Message

    response = await llm.complete([Message("user", "Assalamu alaykum!")])

    # Or pick a provider explicitly:
    response = await llm.with_provider("anthropic").complete(messages)

    # Or stream:
    async for chunk in await llm.stream(messages):
        ...
"""

from app.llm.base import BaseLLMProvider, LLMResponse, Message
from app.llm.factory import (
    LLMFacade,
    PROVIDER_ANTHROPIC,
    PROVIDER_GROQ,
    PROVIDER_OLLAMA,
    PROVIDER_MISTRAL,
    PROVIDER_OPENAI,
    PROVIDER_OTHER,
    llm,
)

__all__ = [
    # Types
    "BaseLLMProvider",
    "LLMResponse",
    "Message",
    # Facade class + singleton
    "LLMFacade",
    "llm",
    # Provider name constants
    "PROVIDER_OPENAI",
    "PROVIDER_ANTHROPIC",
    "PROVIDER_GROQ",
    "PROVIDER_OLLAMA",
    "PROVIDER_MISTRAL",
    "PROVIDER_OTHER",
]

