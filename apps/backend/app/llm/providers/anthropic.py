from anthropic import AsyncAnthropic
from anthropic import (
    APIError as AnthropicAPIError,
    APITimeoutError as AnthropicTimeoutError,
    RateLimitError as AnthropicRateLimitError,
)

from app.llm.exceptions import LLMGenerationError, LLMRateLimitError, LLMTimeoutError
from app.llm.providers.base import AbstractLLMProvider


class AnthropicProvider(AbstractLLMProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        self._client = AsyncAnthropic(api_key=api_key)
        self._default_model = model

    async def generate(
        self,
        system_prompt: str,
        messages: list[dict],
        max_tokens: int = 500,
        model: str | None = None,
    ) -> str:
        try:
            response = await self._client.messages.create(
                model=model or self._default_model,
                max_tokens=max_tokens,
                system=system_prompt,
                messages=messages,
            )
        except AnthropicRateLimitError as exc:
            raise LLMRateLimitError("Anthropic rate limit bereikt.") from exc
        except AnthropicTimeoutError as exc:
            raise LLMTimeoutError("Anthropic time-out.") from exc
        except AnthropicAPIError as exc:
            raise LLMGenerationError(f"Anthropic API fout: {exc}") from exc

        return response.content[0].text
