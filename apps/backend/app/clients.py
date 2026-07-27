from supabase import create_client, Client
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic
from app.config import settings

supabase: Client = create_client(
    settings.supabase_url,
    settings.supabase_service_key
)
openai_client = AsyncOpenAI(api_key=settings.openai_api_key)
anthropic_client = AsyncAnthropic(api_key=settings.anthropic_api_key)