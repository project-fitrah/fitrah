from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
	app_name: str = "fitrah-backend"
	app_version: str = "0.1.0"
	debug: bool = False
	host: str = "0.0.0.0"
	port: int = 8000

	# --- LLM ---
	llm_provider: str = "openai"  # openai | anthropic | groq | other

	# OpenAI
	openai_api_key: str | None = None
	openai_default_model: str = "gpt-4o-mini"

	# Anthropic
	anthropic_api_key: str | None = None
	anthropic_default_model: str = "claude-3-5-haiku-20241022"

	# Groq
	groq_api_key: str | None = None
	groq_default_model: str = "llama-3.3-70b-versatile"

	# Ollama (local)
	ollama_base_url: str = "http://localhost:11434/v1"
	ollama_default_model: str = "llama3.2"

	# Mistral
	mistral_api_key: str | None = None
	mistral_default_model: str = "mistral-small-latest"

	# Other (OpenAI-compatible endpoint, e.g. Together, Fireworks…)
	other_base_url: str | None = None
	other_api_key: str | None = None
	other_default_model: str | None = None

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		extra="ignore",
	)


settings = Settings()

