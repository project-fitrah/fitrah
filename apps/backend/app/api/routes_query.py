from fastapi import APIRouter, HTTPException

from app.schemas.query import QueryRequest, QueryResponse
from app.services.rag import answer_question
from app.services.exceptions import EmbeddingError, RetrievalError, GenerationError

router = APIRouter()

@router.post("/query", response_model=QueryResponse, tags=["rag"])
async def query_rag(req: QueryRequest) -> QueryResponse:
	if not req.question.strip():
		raise HTTPException(status_code=400, detail="Vraag mag niet leeg zijn.")

	try:
		result = await answer_question(req.question, req.conversation_id)
	except EmbeddingError as exc:
		raise HTTPException(status_code=503, detail=str(exc)) from exc
	except RetrievalError as exc:
		raise HTTPException(status_code=503, detail=str(exc)) from exc
	except GenerationError as exc:
		raise HTTPException(status_code=503, detail=str(exc)) from exc

	return QueryResponse(**result)