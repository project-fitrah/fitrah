class LLMError(Exception):
    pass


class LLMRateLimitError(LLMError):
    pass


class LLMTimeoutError(LLMError):
    pass


class LLMGenerationError(LLMError):
    pass
