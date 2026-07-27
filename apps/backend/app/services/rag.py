from anthropic import APIError, APITimeoutError, RateLimitError

from app.clients import anthropic_client
from app.services.embedding import embed_text
from app.services.retrieval import retrieve_matches
from app.services.phase import evaluate_phase_gate
from app.services.phase_config import get_phase_by_name, get_relevant_examples
from app.services.conversation import (
	get_or_create_conversation,
	get_history,
	save_message,
	update_phase_and_turns,
)
from app.services.exceptions import GenerationError


def build_examples_block(examples: list[dict]) -> str:
	if not examples:
		return ""

	blocks = []
	for ex in examples:
		block = f"Gebruiker: {ex['user_message']}\nGoed antwoord: {ex['goed_antwoord']}"
		if ex.get("fout_antwoord"):
			block += f"\nVermijd dit soort antwoord: {ex['fout_antwoord']} (reden: {ex['reden']})"
		blocks.append(block)

	return "VOORBEELDEN VAN GEWENST GEDRAG IN DEZE FASE:\n" + "\n\n".join(blocks)


async def answer_question(question: str, conversation_id) -> dict:
	conversation = await get_or_create_conversation(conversation_id)
	conv_id = conversation["id"]
	current_phase_name = conversation["current_phase"]
	turns_in_phase = conversation["turns_in_current_phase"]

	history = await get_history(conv_id)

	gate_result = await evaluate_phase_gate(history, question, current_phase_name, turns_in_phase)
	new_phase_name = gate_result["phase"]
	phase_changed = new_phase_name != current_phase_name
	new_turns = 0 if phase_changed else turns_in_phase + 1

	query_embedding = await embed_text(question)
	matches = await retrieve_matches(query_embedding)
	knowledge_context = "\n".join(row["content"] for row in matches)

	phase_config = await get_phase_by_name(new_phase_name)
	examples = await get_relevant_examples(phase_config["id"], question)
	examples_block = build_examples_block(examples)

	system_prompt = (
		f"FASE: {new_phase_name}\n"
		f"DOEL VAN DEZE FASE: {phase_config['description']}\n"
		f"INSTRUCTIE: {phase_config['system_instruction']}\n\n"
		f"{examples_block}\n\n"
		f"RELEVANTE KENNISBANK-CONTEXT (gebruik dit voor feitelijke inhoud, niet voor toon):\n"
		f"{knowledge_context}"
	)

	try:
		response = await anthropic_client.messages.create(
			model="claude-sonnet-4-6",
			max_tokens=500,
			system=system_prompt,
			messages=history + [{"role": "user", "content": question}],
		)
	except (RateLimitError, APITimeoutError, APIError) as exc:
		raise GenerationError("LLM service faalde.") from exc

	answer_text = response.content[0].text

	await save_message(conv_id, "user", question, new_phase_name)
	await save_message(conv_id, "assistant", answer_text, new_phase_name)
	await update_phase_and_turns(conv_id, new_phase_name, new_turns)

	return {
		"answer": answer_text,
		"sources": matches,
		"conversation_id": conv_id,
		"current_phase": new_phase_name,
	}