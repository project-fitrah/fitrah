import { NextResponse } from "next/server";
import { createSupabaseAuthClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type ErrorPayload = {
  error: string;
  code: string;
  details?: unknown;
};

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

export async function GET(request: Request) {
  const accessToken = getAccessToken(request);
  if (!accessToken) {
    return jsonError(401, "Missing bearer token", "unauthorized");
  }

  const authClient = createSupabaseAuthClient(accessToken);
  const userResult = await authClient.auth.getUser();

  if (userResult.error || !userResult.data.user) {
    return jsonError(401, "Invalid session token", "invalid_session", userResult.error?.message);
  }

  const deepgramApiKey = process.env.DEEPGRAM_API_KEY;
  if (!deepgramApiKey) {
    return jsonError(503, "Deepgram API key is not configured", "provider_not_configured");
  }

  const url =
    "wss://api.deepgram.com/v1/listen?model=nova-3&language=multi&punctuate=true&interim_results=true&smart_format=true";

  return NextResponse.json({ url, token: deepgramApiKey });
}
