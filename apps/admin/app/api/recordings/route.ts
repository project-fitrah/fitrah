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

type CreateRecordingRequest = {
  rawText: string;
};

type GetRecordingsResponse = {
  recordings: RecordingRow[];
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

async function getAuthenticatedUser(request: Request) {
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

function isCreateRecordingRequest(body: unknown): body is CreateRecordingRequest {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const value = body as Partial<CreateRecordingRequest>;
  return typeof value.rawText === "string";
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    const details = error instanceof Error ? error.message : String(error);
    return jsonError(400, "Request body must be valid JSON", "invalid_json", details);
  }

  if (!isCreateRecordingRequest(body)) {
    return jsonError(400, "Invalid request payload", "validation_failed", {
      rawText: "Expected a string",
    });
  }

  const rawText = body.rawText.trim();
  if (!rawText) {
    return jsonError(400, "rawText must be a non-empty string", "validation_failed", {
      rawText: "Cannot be empty",
    });
  }

  const serviceClient = createSupabaseServiceClient();
  const insertResult = await serviceClient
    .from("recordings")
    .insert({
      user_id: auth.userId,
      raw_text: rawText,
      status: "raw",
    })
    .select("id, user_id, raw_text, structured_text, status, created_at, updated_at")
    .single();

  if (insertResult.error) {
    return jsonError(
      500,
      "Failed to create recording",
      "database_insert_failed",
      insertResult.error.message
    );
  }

  return NextResponse.json(insertResult.data as RecordingRow, { status: 201 });
}

export async function GET(request: Request) {
  const auth = await getAuthenticatedUser(request);
  if (auth.errorResponse) {
    return auth.errorResponse;
  }

  const serviceClient = createSupabaseServiceClient();
  const queryResult = await serviceClient
    .from("recordings")
    .select("id, user_id, raw_text, structured_text, status, created_at, updated_at")
    .eq("user_id", auth.userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (queryResult.error) {
    return jsonError(
      500,
      "Failed to load recordings",
      "database_query_failed",
      queryResult.error.message
    );
  }

  const payload: GetRecordingsResponse = {
    recordings: (queryResult.data ?? []) as RecordingRow[],
  };

  return NextResponse.json(payload);
}
