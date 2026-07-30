from abc import ABC, abstractmethod


class AbstractLLMProvider(ABC):
    @abstractmethod
    async def generate(
        self,
        system_prompt: str,
        messages: list[dict],
        max_tokens: int = 500,
        model: str | None = None,
    ) -> str:
        ...
