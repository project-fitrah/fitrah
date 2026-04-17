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

type AnthropicStreamEvent = {
  type?: string;
  delta?: {
    type?: string;
    text?: string;
  };
  content_block?: {
    type?: string;
    text?: string;
  };
  error?: {
    message?: string;
  };
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

async function openAnthropicStream(rawText: string) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      errorResponse: jsonError(503, "AI API key is not configured", "provider_not_configured"),
      streamReader: null,
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
      stream: true,
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

  if (!anthropicResponse.ok) {
    const responseText = await anthropicResponse.text();
    return {
      errorResponse: jsonError(502, "AI structuring request failed", "upstream_request_failed", {
        upstreamStatus: anthropicResponse.status,
        upstreamBodySnippet: responseText.slice(0, 500),
      }),
      streamReader: null,
    };
  }

  if (!anthropicResponse.body) {
    return {
      errorResponse: jsonError(502, "AI returned an empty stream", "invalid_upstream_response", {
        upstreamStatus: anthropicResponse.status,
      }),
      streamReader: null,
    };
  }

  return {
    errorResponse: null,
    streamReader: anthropicResponse.body.getReader(),
  };
}

async function streamAnthropicText(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  onChunk: (chunk: string) => Promise<void>
) {
  const decoder = new TextDecoder();
  let buffer = "";
  const chunks: string[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.startsWith("data:")) {
        continue;
      }

      const payload = trimmedLine.slice("data:".length).trim();
      if (!payload || payload === "[DONE]") {
        continue;
      }

      let event: AnthropicStreamEvent;
      try {
        event = JSON.parse(payload) as AnthropicStreamEvent;
      } catch {
        continue;
      }

      if (event.type === "error") {
        const upstreamMessage = event.error?.message?.trim() || "Unknown Anthropic stream error";
        throw new Error(upstreamMessage);
      }

      const deltaText =
        typeof event.delta?.text === "string"
          ? event.delta.text
          : typeof event.content_block?.text === "string"
            ? event.content_block.text
            : "";

      if (!deltaText) {
        continue;
      }

      chunks.push(deltaText);
      await onChunk(deltaText);
    }
  }

  const remaining = buffer.trim();
  if (remaining.startsWith("data:")) {
    const payload = remaining.slice("data:".length).trim();
    if (payload && payload !== "[DONE]") {
      try {
        const event = JSON.parse(payload) as AnthropicStreamEvent;
        const deltaText =
          typeof event.delta?.text === "string"
            ? event.delta.text
            : typeof event.content_block?.text === "string"
              ? event.content_block.text
              : "";

        if (deltaText) {
          chunks.push(deltaText);
          await onChunk(deltaText);
        }
      } catch {
        // Ignore malformed trailing payload.
      }
    }
  }

  const structuredText = chunks.join("").trim();

  if (!structuredText) {
    throw new Error("AI response did not include structured text");
  }

  return structuredText;
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

  const anthropic = await openAnthropicStream(recording.raw_text);
  if (anthropic.errorResponse || !anthropic.streamReader) {
    return (
      anthropic.errorResponse ??
      jsonError(502, "AI stream unavailable", "invalid_upstream_response")
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const structuredText = await streamAnthropicText(anthropic.streamReader, async (chunk) => {
          controller.enqueue(encoder.encode(chunk));
        });

        const updateResult = await serviceClient
          .from("recordings")
          .update({
            structured_text: structuredText,
            status: "done",
            updated_at: new Date().toISOString(),
          })
          .eq("id", recording.id)
          .eq("user_id", auth.userId)
          .select("id")
          .single();

        if (updateResult.error) {
          throw new Error("Failed to persist structured recording");
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Structuring stream failed";
        controller.enqueue(encoder.encode(`\n\n[ERROR] ${message}`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
