import logging

from anthropic import APIError, APITimeoutError, RateLimitError

from app.clients import anthropic_client
from app.services.embedding import embed_text
from app.services.retrieval import retrieve_matches
from app.services.exceptions import GenerationError

logger = logging.getLogger(__name__)


async def answer_question(question: str) -> dict:
	query_embedding = await embed_text(question)
	matches = await retrieve_matches(query_embedding)
	context = "\n".join(row["content"] for row in matches)

	try:
		response = await anthropic_client.messages.create(
			model="claude-sonnet-4-6",
			max_tokens=500,
			system=f"Beantwoord uitsluitend op basis van deze context:\n{context}",
			messages=[{"role": "user", "content": question}],
		)
	except RateLimitError as exc:
		logger.error("Anthropic rate limit bereikt: %s", exc)
		raise GenerationError("Rate limit bereikt, probeer later opnieuw.") from exc
	except APITimeoutError as exc:
		logger.error("Anthropic timeout: %s", exc)
		raise GenerationError("LLM service reageerde niet op tijd.") from exc
	except APIError as exc:
		logger.error("Anthropic API-fout: %s", exc)
		raise GenerationError("LLM service faalde.") from exc

	return {"answer": response.content[0].text, "sources": matches}