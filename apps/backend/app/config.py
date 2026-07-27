from pydantic_settings import BaseSettings, SettingsConfigDict

import os

class Settings(BaseSettings):
	app_name: str = "fitrah-backend"
	app_version: str = "0.1.0"
	debug: bool = False
	host: str = "0.0.0.0"
	port: int = int(os.getenv("PORT", "8000"))

	supabase_url: str = os.getenv("SUPABASE_URL")
	supabase_service_key: str = os.getenv("SUPABASE_SERVICE_KEY")
	openai_api_key: str = os.getenv("OPENAI_API_KEY")
	anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY")


	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		extra="ignore",
	)


settings = Settings()

