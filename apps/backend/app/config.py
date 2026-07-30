from pydantic_settings import BaseSettings, SettingsConfigDict

import os

class Settings(BaseSettings):
	app_name: str = "fitrah-backend"
	app_version: str = "0.1.0"
	debug: bool = False
	host: str = "0.0.0.0"
	port: int = int(os.getenv("PORT", "8000"))

	supabase_url: str
	supabase_service_key: str
	openai_api_key: str
	anthropic_api_key: str = ""
	groq_api_key: str = ""
	admin_api_key: str

	llm_provider: str = "anthropic"
	llm_model: str = ""

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		extra="ignore",
	)


settings = Settings()