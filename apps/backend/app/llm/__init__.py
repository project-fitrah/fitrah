from app.config import settings
from app.llm.exceptions import LLMError, LLMGenerationError, LLMRateLimitError, LLMTimeoutError
from app.llm.providers.groq import GroqProvider


def get_llm_provider():
    provider_name = settings.llm_provider.lower()
    model = settings.llm_model or None

    if provider_name == "groq":
        return GroqProvider(
            api_key=settings.groq_api_key,
            model=model or "llama-3.3-70b-versatile",
        )
    else:
        raise ValueError(
            f"Onbekende LLM provider: {provider_name}. Kies 'groq'."
        )


__all__ = [
    "get_llm_provider",
    "LLMError",
    "LLMGenerationError",
    "LLMRateLimitError",
    "LLMTimeoutError",
]
