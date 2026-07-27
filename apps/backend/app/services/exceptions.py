class RAGError(Exception):
	"""Basis exceptie voor alle RAG-pipeline fouten."""
	pass


class EmbeddingError(RAGError):
	"""Fout tijdens het genereren van een embedding."""
	pass


class RetrievalError(RAGError):
	"""Fout tijdens het ophalen van gerelateerde documenten."""
	pass


class GenerationError(RAGError):
	"""Fout tijdens het genereren van het antwoord door de LLM."""
	pass