import { NextResponse } from "next/server";
import { createSupabaseAuthClient, createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ErrorPayload = {
  error: string;
  code: string;
  details?: unknown;
};

type RecordingRow = {
  id: string;
  user_id: string;
  raw_text: string;
  structured_text: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type AnthropicResponse = {
  content?: Array<{
    type: string;
    text?: string;
  }>;
};

const SYSTEM_PROMPT = `Je krijgt een ruwe gesproken transcriptie in het Nederlands, mogelijk gemengd met Arabische en Engelse woorden. Voer de volgende taken uit:

1. Verwijder tussenwoorden zoals ehm, uh, dus, eigenlijk, zeg maar, weet je wel
2. Herstel zinnen die halverwege stoppen of worden herhaald
3. Voeg één hoofdtitel toe bovenaan
4. Voeg tussentitels toe op plaatsen waar van onderwerp gewisseld wordt
5. Behoud de originele betekenis volledig
6. Behoud Arabische termen exact zoals ze zijn (inshallah, mashallah, dawah, deen, ummah, etc.)
7. Geef de output terug als Markdown, niets anders`;

function jsonError(status: number, message: string, code: string, details?: unknown) {
  const payload: ErrorPayload = {
    error: message,
    code,
    ...(details !== undefined ? { details } : {}),
  };

  return NextResponse.json(payload, { status });
}

function getAccessToken(request: Request) {
  const authorizationHeader = request.headers.get("authorization") ?? "";
  if (!authorizationHeader.startsWith("Bearer ")) {
    return "";
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

async function getAuthenticatedUserId(request: Request) {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return { errorResponse: jsonError(401, "Missing bearer token", "unauthorized"), userId: "" };
  }

  const authClient = createSupabaseAuthClient(accessToken);
  const userResult = await authClient.auth.getUser();

  if (userResult.error || !userResult.data.user) {
    return {
      errorResponse: jsonError(
        401,
        "Invalid session token",
        "invalid_session",
        userResult.error?.message
      ),
      userId: "",
    };
  }

  return { errorResponse: null, userId: userResult.data.user.id };
}

async function structureWithAI(rawText: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      errorResponse: jsonError(503, "AI API key is not configured", "provider_not_configured"),
      structuredText: "",
    };
  }

  const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-4-6-sonnet-latest", // per 10 min aan opname / 1500 woorden is ongeveer € 0.1
      max_tokens: 4000,
      thinking: {
        type: "enabled",
        budget_tokens: 1024, // Claude denkt eerst na over welke woorden weg moeten (stopwoorden vs Arabisch)
      },
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          cache_control: { type: "ephemeral" }, // Dit activeert Prompt Caching (bespaart geld)
        },
      ],
      messages: [
        {
          role: "user",
          content: rawText,
        },
      ],
    }),
  });

  const responseText = await anthropicResponse.text();

  if (!anthropicResponse.ok) {
    return {
      errorResponse: jsonError(502, "AI structuring request failed", "upstream_request_failed", {
        upstreamStatus: anthropicResponse.status,
        upstreamBodySnippet: responseText.slice(0, 500),
      }),
      structuredText: "",
    };
  }

  let parsed: AnthropicResponse;
  try {
    parsed = JSON.parse(responseText) as AnthropicResponse;
  } catch {
    return {
      errorResponse: jsonError(502, "AI returned invalid JSON", "invalid_upstream_response", {
        upstreamStatus: anthropicResponse.status,
        upstreamBodySnippet: responseText.slice(0, 500),
      }),
      structuredText: "",
    };
  }

  const structuredText = parsed.content
    ?.filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text ?? "")
    .join("\n")
    .trim();

  if (!structuredText) {
    return {
      errorResponse: jsonError(
        502,
        "AI response did not include structured text",
        "invalid_upstream_response"
      ),
      structuredText: "",
    };
  }

  return {
    errorResponse: null,
    structuredText,
  };
}

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const auth = await getAuthenticatedUserId(request);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const { id } = await context.params;
  if (!id) {
    return jsonError(400, "Missing recording id", "validation_failed");
  }

  const serviceClient = createSupabaseServiceClient();

  const queryResult = await serviceClient
    .from("recordings")
    .select("id, user_id, raw_text, structured_text, status, created_at, updated_at")
    .eq("id", id)
    .eq("user_id", auth.userId)
    .maybeSingle();

  if (queryResult.error) {
    return jsonError(
      500,
      "Failed to load recording",
      "database_query_failed",
      queryResult.error.message
    );
  }

  if (!queryResult.data) {
    return jsonError(404, "Recording not found", "not_found");
  }

  const recording = queryResult.data as RecordingRow;
  if (!recording.raw_text.trim()) {
    return jsonError(400, "Recording raw_text is empty", "validation_failed");
  }

  const aiResult = await structureWithAI(recording.raw_text);
  if (aiResult.errorResponse) {
    return aiResult.errorResponse;
  }

  const updateResult = await serviceClient
    .from("recordings")
    .update({
      structured_text: aiResult.structuredText,
      status: "done",
      updated_at: new Date().toISOString(),
    })
    .eq("id", recording.id)
    .eq("user_id", auth.userId)
    .select("id, user_id, raw_text, structured_text, status, created_at, updated_at")
    .single();

  if (updateResult.error) {
    return jsonError(
      500,
      "Failed to update recording",
      "database_update_failed",
      updateResult.error.message
    );
  }

  return NextResponse.json(updateResult.data as RecordingRow);
}
