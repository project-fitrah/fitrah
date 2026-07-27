import logging

from fastapi import FastAPI

from app.config import settings
from app.api.routes_query import router as query_router

logging.basicConfig(
	level=logging.INFO if not settings.debug else logging.DEBUG,
	format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)

def create_app() -> FastAPI:
	app = FastAPI(
		title=settings.app_name,
		version=settings.app_version,
		debug=settings.debug,
	)

	app.include_router(query_router)

	@app.get("/health", tags=["meta"])
	def health_check() -> dict[str, str]:
		return {
			"status": "ok",
			"service": settings.app_name,
			"version": settings.app_version,
		}

	return app


app = create_app()