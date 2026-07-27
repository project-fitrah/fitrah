from pydantic import BaseModel, Field
from uuid import UUID

class QueryRequest(BaseModel):
	question: str
	conversation_id: UUID | None = Field(
		default=None,
		description="Laat leeg bij het eerste bericht; gebruik daarna de conversation_id uit de response.",
	)

class QueryResponse(BaseModel):
	answer: str
	sources: list[dict]
	conversation_id: UUID
	current_phase: str