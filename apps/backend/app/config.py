from pydantic_settings import BaseSettings, SettingsConfigDict

import os

class Settings(BaseSettings):
	app_name: str = "fitrah-backend"
	app_version: str = "0.1.0"
	debug: bool = False
	host: str = "0.0.0.0"
	port: int = int(os.getenv("PORT", "8000"))

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		extra="ignore",
	)


settings = Settings()

