import asyncio

from app.clients import supabase
from app.services.embedding import embed_text

PHASES_SEED = [
	{
		"name": "opening",
		"order_index": 0,
		"description": "Gebruiker deelt waar die nu staat.",
		"system_instruction": "Stel open, uitnodigende vragen. Geef nog geen duiding of advies.",
		"criteria": ["Gebruiker heeft minstens één concreet gevoel of situatie benoemd."],
	},
	{
		"name": "verkenning",
		"order_index": 1,
		"description": "Diepere achtergrond van de situatie wordt verkend.",
		"system_instruction": "Blijf nieuwsgierig, vraag door naar patroon of oorzaak, nog geen oordeel.",
		"criteria": [
			"Gebruiker heeft een oorzaak of patroon benoemd.",
			"Er zijn minstens 2 uitwisselingen geweest in deze fase.",
		],
	},
	{
		"name": "duiding",
		"order_index": 2,
		"description": "Relevante spirituele kennis wordt aangereikt.",
		"system_instruction": "Reik een relevant concept aan uit de kennisbank, leg uit zonder te overtuigen.",
		"criteria": ["AI heeft minstens één relevant concept aangereikt."],
	},
	{
		"name": "reflectie",
		"order_index": 3,
		"description": "Gebruiker verbindt zelf het aangereikte kader met de eigen situatie.",
		"system_instruction": "Nodig uit tot eigen reflectie, leg geen conclusie op.",
		"criteria": ["Gebruiker heeft in eigen woorden een connectie gelegd."],
	},
	{
		"name": "afronding",
		"order_index": 4,
		"description": "Gesprek wordt afgesloten.",
		"system_instruction": "Vat samen, sluit professioneel en warm af.",
		"criteria": ["Gebruiker geeft signalen van rust of afronding."],
	},
]


async def seed():
	for phase in PHASES_SEED:
		result = supabase.table("phases").insert({
			"name": phase["name"],
			"order_index": phase["order_index"],
			"description": phase["description"],
			"system_instruction": phase["system_instruction"],
		}).execute()
		phase_id = result.data[0]["id"]

		for idx, criterion in enumerate(phase["criteria"]):
			supabase.table("phase_requirements").insert({
				"phase_id": phase_id,
				"criterion": criterion,
				"order_index": idx,
			}).execute()

		print(f"Seeded phase: {phase['name']}")


async def seed_example():
	verkenning = supabase.table("phases").select("id").eq("name", "verkenning").execute()
	phase_id = verkenning.data[0]["id"]

	user_message = "Ik voel me leeg, alsof niets nog betekenis heeft."
	embedding = await embed_text(user_message)

	supabase.table("behavior_examples").insert({
		"phase_id": phase_id,
		"user_message": user_message,
		"goed_antwoord": "Dat klinkt zwaar. Wanneer merk je die leegte het meest, wat gebeurt er net voor dat gevoel opkomt?",
		"fout_antwoord": "Je moet gewoon meer bidden, dan verdwijnt dat gevoel wel.",
		"reden": "Het foute antwoord oordeelt en lost te snel op, in plaats van te verkennen.",
		"embedding": embedding,
	}).execute()
	print("Seeded 1 example.")


if __name__ == "__main__":
	asyncio.run(seed())
	asyncio.run(seed_example())