import logging

from openai import APIError, APITimeoutError, RateLimitError

from app.clients import openai_client
from app.services.exceptions import EmbeddingError

logger = logging.getLogger(__name__)


async def embed_text(text: str) -> list[float]:
	try:
		response = await openai_client.embeddings.create(
			model="text-embedding-3-small",
			input=text,
		)
		return response.data[0].embedding
	except RateLimitError as exc:
		logger.error("OpenAI rate limit bereikt tijdens embedding: %s", exc)
		raise EmbeddingError("Rate limit bereikt, probeer later opnieuw.") from exc
	except APITimeoutError as exc:
		logger.error("OpenAI timeout tijdens embedding: %s", exc)
		raise EmbeddingError("Embedding service reageerde niet op tijd.") from exc
	except APIError as exc:
		logger.error("OpenAI API-fout tijdens embedding: %s", exc)
		raise EmbeddingError("Embedding service faalde.") from exc