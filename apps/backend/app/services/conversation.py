from uuid import UUID

from app.clients import supabase


async def get_or_create_conversation(conversation_id: UUID | None) -> dict:
	if conversation_id is not None:
		result = supabase.table("conversations").select("*").eq("id", str(conversation_id)).execute()
		if result.data:
			return result.data[0]

	payload = {"id": str(conversation_id)} if conversation_id is not None else {}
	result = supabase.table("conversations").insert(payload).execute()
	return result.data[0]


async def get_history(conversation_id: UUID, limit: int = 10) -> list[dict]:
	result = (
		supabase.table("messages")
		.select("role, content")
		.eq("conversation_id", str(conversation_id))
		.order("created_at", desc=False)
		.limit(limit)
		.execute()
	)
	return result.data


async def save_message(conversation_id: UUID, role: str, content: str, phase: str) -> None:
	supabase.table("messages").insert({
		"conversation_id": str(conversation_id),
		"role": role,
		"content": content,
		"phase_at_time": phase,
	}).execute()


async def update_phase_and_turns(conversation_id: UUID, new_phase: str, turns: int) -> None:
	supabase.table("conversations").update({
		"current_phase": new_phase,
		"turns_in_current_phase": turns,
	}).eq("id", str(conversation_id)).execute()