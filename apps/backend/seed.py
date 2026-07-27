import asyncio

from app.services.embedding import embed_text
from app.clients import supabase

FAKE_DOCS = [
	"Het hoofdkantoor van Acme Corp staat in Gent, België.",
	"Acme Corp werd opgericht in 2015 door Jan Peeters.",
	"De omzet van Acme Corp in 2024 was 4.2 miljoen euro.",
	"Acme Corp heeft 37 medewerkers verspreid over 3 kantoren.",
	"Het populairste product van Acme Corp is de SmartWidget 3000.",
]


async def seed() -> None:
	for doc in FAKE_DOCS:
		embedding = await embed_text(doc)
		supabase.table("documents").insert(
			{"content": doc, "embedding": embedding}
		).execute()
		print(f"Inserted: {doc}")


if __name__ == "__main__":
	asyncio.run(seed())