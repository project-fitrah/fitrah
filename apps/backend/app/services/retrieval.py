import logging

from app.clients import supabase
from app.services.exceptions import RetrievalError

logger = logging.getLogger(__name__)


async def retrieve_matches(
	query_embedding: list[float],
	threshold: float = 0.75,
	count: int = 3,
) -> list[dict]:
	try:
		result = supabase.rpc(
			"match_documents",
			{
				"query_embedding": query_embedding,
				"match_threshold": threshold,
				"match_count": count,
			},
		).execute()
		return result.data
	except Exception as exc:
		logger.error("Supabase retrieval faalde: %s", exc)
		raise RetrievalError("Kon geen documenten ophalen uit de kennisbank.") from exc