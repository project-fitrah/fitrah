from supabase import create_client, Client
from openai import AsyncOpenAI

from app.config import settings
from app.llm import get_llm_provider

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
)

# Dedicated OpenAI client for embeddings only (not part of the generic LLM
# adapter, since embeddings are a separate capability from chat generation).
embedding_client = AsyncOpenAI(api_key=settings.openai_api_key)

llm = get_llm_provider()