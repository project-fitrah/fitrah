from fastapi import FastAPI

from app.config import settings


def create_app() -> FastAPI:
	app = FastAPI(
		title=settings.app_name,
		version=settings.app_version,
		debug=settings.debug,
	)

	@app.get("/health", tags=["meta"])
	def health_check() -> dict[str, str]:
		return {
			"status": "ok",
			"service": settings.app_name,
			"version": settings.app_version,
		}
	
	@app.get("/health")
	def health() -> dict[str, str]:
		return {
			"status": "ok",
			"service": settings.app_name,
			"version": settings.app_version,
		}

	return app


app = create_app()

