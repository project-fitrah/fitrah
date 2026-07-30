from openai import AsyncOpenAI
from openai import (
    APIError as OpenAIAPIError,
    APITimeoutError as OpenAITimeoutError,
    RateLimitError as OpenAIRateLimitError,
)

from app.llm.exceptions import LLMGenerationError, LLMRateLimitError, LLMTimeoutError
from app.llm.providers.base import AbstractLLMProvider


class GroqProvider(AbstractLLMProvider):
    def __init__(self, api_key: str, model: str = "llama-3.3-70b-versatile"):
        self._client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1",
        )
        self._default_model = model

    async def generate(
        self,
        system_prompt: str,
        messages: list[dict],
        max_tokens: int = 500,
        model: str | None = None,
    ) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=model or self._default_model,
                max_tokens=max_tokens,
                messages=[{"role": "system", "content": system_prompt}, *messages],
            )
        except OpenAIRateLimitError as exc:
            raise LLMRateLimitError("Groq rate limit bereikt.") from exc
        except OpenAITimeoutError as exc:
            raise LLMTimeoutError("Groq time-out.") from exc
        except OpenAIAPIError as exc:
            raise LLMGenerationError(f"Groq API fout: {exc}") from exc

        return response.choices[0].message.content
