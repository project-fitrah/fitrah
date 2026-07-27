import time

from app.clients import supabase
from app.services.embedding import embed_text

_cache: dict = {}
_cache_timestamp: float = 0
_CACHE_TTL_SECONDS = 60


async def get_all_phases() -> list[dict]:
	global _cache, _cache_timestamp

	if _cache and (time.time() - _cache_timestamp) < _CACHE_TTL_SECONDS:
		return _cache["phases"]

	phases_result = supabase.table("phases").select("*").order("order_index").execute()
	phases = phases_result.data

	for phase in phases:
		req_result = (
			supabase.table("phase_requirements")
			.select("criterion")
			.eq("phase_id", phase["id"])
			.order("order_index")
			.execute()
		)
		phase["criteria"] = [r["criterion"] for r in req_result.data]

	_cache = {"phases": phases}
	_cache_timestamp = time.time()
	return phases


async def get_phase_by_name(name: str) -> dict:
	phases = await get_all_phases()
	for phase in phases:
		if phase["name"] == name:
			return phase
	raise ValueError(f"Fase '{name}' niet gevonden.")


async def get_next_phase(current_name: str) -> dict | None:
	phases = await get_all_phases()
	current = next(p for p in phases if p["name"] == current_name)
	next_candidates = [p for p in phases if p["order_index"] > current["order_index"]]
	return min(next_candidates, key=lambda p: p["order_index"]) if next_candidates else None


async def get_relevant_examples(
	phase_id: str,
	user_message: str,
	threshold: float = 0.5,
	count: int = 3,
) -> list[dict]:
	query_embedding = await embed_text(user_message)

	result = supabase.rpc("match_behavior_examples", {
		"query_embedding": query_embedding,
		"target_phase_id": phase_id,
		"match_threshold": threshold,
		"match_count": count,
	}).execute()

	return result.data


def invalidate_cache() -> None:
	global _cache, _cache_timestamp
	_cache = {}
	_cache_timestamp = 0