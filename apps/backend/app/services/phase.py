import json

from app.clients import anthropic_client
from app.services.phase_config import get_phase_by_name, get_next_phase


async def evaluate_phase_gate(
	conversation_history: list[dict],
	latest_message: str,
	current_phase_name: str,
	turns_in_phase: int,
) -> dict:
	current_phase = await get_phase_by_name(current_phase_name)
	history_text = "\n".join(f"{m['role']}: {m['content']}" for m in conversation_history[-8:])

	response = await anthropic_client.messages.create(
		model="claude-sonnet-4-6",
		max_tokens=150,
		system=(
			f"Je beoordeelt of een gesprek klaar is om van fase '{current_phase_name}' naar de volgende te gaan.\n"
			f"Vereisten voor deze fase: {current_phase['criteria']}\n"
			f"Aantal beurten al in deze fase: {turns_in_phase}\n"
			f"Antwoord uitsluitend met geldige JSON, exact dit formaat:\n"
			f'{{"requirement_behaald": true/false, "reden": "korte uitleg"}}'
		),
		messages=[{"role": "user", "content": f"{history_text}\nuser: {latest_message}"}],
	)

	result = json.loads(response.content[0].text.strip())
	next_phase_name = current_phase_name

	if result["requirement_behaald"]:
		next_phase = await get_next_phase(current_phase_name)
		if next_phase:
			next_phase_name = next_phase["name"]

	if turns_in_phase >= 6 and not result["requirement_behaald"]:
		next_phase = await get_next_phase(current_phase_name)
		if next_phase:
			next_phase_name = next_phase["name"]
			result["reden"] += " (geforceerd na te veel beurten zonder voortgang)"

	return {
		"phase": next_phase_name,
		"requirement_behaald": result["requirement_behaald"],
		"reden": result["reden"],
	}