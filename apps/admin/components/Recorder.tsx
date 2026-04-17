"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, LoaderCircle, Mic, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ensureSupabaseSession } from "@/lib/supabase/client";

type RecorderPhase = "idle" | "recording";
type NoticeKind = "success" | "error";

type Notice = {
  kind: NoticeKind;
  message: string;
};

type ApiError = {
  error: string;
  code: string;
  details?: unknown;
};

type TokenResponse = {
  url: string;
  token: string;
};

type DeepgramMessage = {
  is_final?: boolean;
  channel?: {
    alternatives?: Array<{
      transcript?: string;
    }>;
  };
};

type Recording = {
  id: string;
  user_id: string;
  raw_text: string;
  structured_text: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

function isRecording(payload: unknown): payload is Recording {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const value = payload as Partial<Recording>;
  return (
    typeof value.id === "string" &&
    typeof value.user_id === "string" &&
    typeof value.raw_text === "string" &&
    (typeof value.structured_text === "string" || value.structured_text === null) &&
    typeof value.status === "string" &&
    typeof value.created_at === "string" &&
    typeof value.updated_at === "string"
  );
}

function extractApiError(payload: unknown): ApiError | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const value = payload as Partial<ApiError>;
  if (typeof value.error !== "string" || typeof value.code !== "string") {
    return null;
  }

  return {
    error: value.error,
    code: value.code,
    ...(value.details !== undefined ? { details: value.details } : {}),
  };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderSimpleMarkdown(markdown: string) {
  const escaped = escapeHtml(markdown);
  const lines = escaped.split(/\r?\n/);
  const htmlParts: string[] = [];
  let inUnorderedList = false;
  let inOrderedList = false;

  const closeLists = () => {
    if (inUnorderedList) {
      htmlParts.push("</ul>");
      inUnorderedList = false;
    }

    if (inOrderedList) {
      htmlParts.push("</ol>");
      inOrderedList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    if (trimmed.startsWith("### ")) {
      closeLists();
      htmlParts.push(`<h3>${trimmed.slice(4)}</h3>`);
      continue;
    }

    if (trimmed.startsWith("## ")) {
      closeLists();
      htmlParts.push(`<h2>${trimmed.slice(3)}</h2>`);
      continue;
    }

    if (trimmed.startsWith("# ")) {
      closeLists();
      htmlParts.push(`<h1>${trimmed.slice(2)}</h1>`);
      continue;
    }

    if (trimmed.startsWith("- ")) {
      if (inOrderedList) {
        htmlParts.push("</ol>");
        inOrderedList = false;
      }

      if (!inUnorderedList) {
        htmlParts.push("<ul>");
        inUnorderedList = true;
      }

      htmlParts.push(`<li>${trimmed.slice(2)}</li>`);
      continue;
    }

    const orderedMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (orderedMatch) {
      if (inUnorderedList) {
        htmlParts.push("</ul>");
        inUnorderedList = false;
      }

      if (!inOrderedList) {
        htmlParts.push("<ol>");
        inOrderedList = true;
      }

      htmlParts.push(`<li>${orderedMatch[2]}</li>`);
      continue;
    }

    closeLists();
    htmlParts.push(`<p>${trimmed}</p>`);
  }

  closeLists();
  return htmlParts.join("\n");
}

export function Recorder() {
  const [phase, setPhase] = useState<RecorderPhase>("idle");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isStructuring, setIsStructuring] = useState(false);
  const [savedRecording, setSavedRecording] = useState<Recording | null>(null);
  const [structuredHtml, setStructuredHtml] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const combinedTranscript = useMemo(() => {
    if (!interimText.trim()) {
      return finalText;
    }

    if (!finalText.trim()) {
      return interimText;
    }

    return `${finalText} ${interimText}`;
  }, [finalText, interimText]);

  const canSave = combinedTranscript.trim().length > 0 && !isSaving;
  const canStructure = Boolean(savedRecording) && !isStructuring;
  const renderedStructuredHtml = useMemo(() => {
    if (!structuredHtml) {
      return "";
    }

    if (!isStructuring) {
      return structuredHtml;
    }

    return `${structuredHtml}\n<p><span class="inline-block animate-pulse text-amber-300" aria-hidden="true">|</span></p>`;
  }, [isStructuring, structuredHtml]);

  const statusConfig = useMemo(() => {
    if (phase === "recording") {
      return {
        label: "Opname actief",
        icon: Mic,
        className: "text-red-300",
      };
    }

    if (isStructuring) {
      return {
        label: "Structureren...",
        icon: LoaderCircle,
        className: "text-amber-300",
      };
    }

    if (isSaving) {
      return {
        label: "Opslaan...",
        icon: Save,
        className: "text-sky-300",
      };
    }

    return {
      label: "Klaar",
      icon: CheckCircle2,
      className: "text-emerald-300",
    };
  }, [isSaving, isStructuring, phase]);

  const StatusIcon = statusConfig.icon;
  const isLoadingStatus = isSaving || isStructuring;

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      if (websocketRef.current && websocketRef.current.readyState <= WebSocket.OPEN) {
        websocketRef.current.close();
      }

      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function appendTranscript(base: string, nextChunk: string) {
    const normalizedChunk = nextChunk.trim();
    if (!normalizedChunk) {
      return base;
    }

    const normalizedBase = base.trim();
    if (!normalizedBase) {
      return normalizedChunk;
    }

    return `${normalizedBase} ${normalizedChunk}`;
  }

  async function getAuthHeader() {
    const session = await ensureSupabaseSession();
    const accessToken = session?.access_token ?? "";

    if (!accessToken) {
      throw new Error("Je bent niet ingelogd. Log opnieuw in en probeer opnieuw.");
    }

    return {
      Authorization: `Bearer ${accessToken}`,
    };
  }

  async function handleStart() {
    if (phase === "recording") {
      return;
    }

    setNotice(null);
    setInterimText("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice({ kind: "error", message: "Je browser ondersteunt geen microfoonopname." });
      return;
    }

    let authHeaders: { Authorization: string };
    try {
      authHeaders = await getAuthHeader();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kan auth niet ophalen.";
      setNotice({ kind: "error", message });
      return;
    }

    let websocketUrl: string;
    let websocketToken: string;
    try {
      const tokenResponse = await fetch("/api/transcribe/token", {
        headers: authHeaders,
      });

      const tokenPayload = (await tokenResponse.json()) as TokenResponse | ApiError;

      if (!tokenResponse.ok) {
        const apiError = extractApiError(tokenPayload);
        throw new Error(apiError?.error ?? "Kon Deepgram token niet ophalen.");
      }

      const typedTokenPayload = tokenPayload as TokenResponse;
      if (!typedTokenPayload.url?.trim() || !typedTokenPayload.token?.trim()) {
        throw new Error("Lege Deepgram token ontvangen.");
      }

      websocketUrl = typedTokenPayload.url;
      websocketToken = typedTokenPayload.token;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Kon Deepgram token niet ophalen.";
      setNotice({ kind: "error", message });
      return;
    }

    const websocket = new WebSocket(websocketUrl, ["token", websocketToken]);
    websocketRef.current = websocket;

    websocket.onmessage = (event: MessageEvent<string>) => {
      let data: DeepgramMessage;
      try {
        data = JSON.parse(event.data) as DeepgramMessage;
      } catch {
        return;
      }

      const transcript = data.channel?.alternatives?.[0]?.transcript?.trim() ?? "";
      if (!transcript) {
        return;
      }

      if (data.is_final) {
        setFinalText((current) => appendTranscript(current, transcript));
        setInterimText("");
        return;
      }

      setInterimText(transcript);
    };

    websocket.onerror = () => {
      setNotice({ kind: "error", message: "WebSocket verbinding met Deepgram is mislukt." });
    };

    websocket.onclose = () => {
      setInterimText("");
    };

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          // Keep subtle background filtering but avoid cutting soft speech too aggressively.
          noiseSuppression: false,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
          sampleSize: 16,
        },
      });
    } catch {
      setNotice({ kind: "error", message: "Microfoontoegang geweigerd of niet beschikbaar." });
      websocket.close();
      websocketRef.current = null;
      return;
    }

    streamRef.current = stream;

    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      });
    } catch {
      try {
        recorder = new MediaRecorder(stream);
      } catch {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        websocket.close();
        websocketRef.current = null;
        setNotice({ kind: "error", message: "MediaRecorder is niet beschikbaar in deze browser." });
        return;
      }
    }

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data.size === 0) {
        return;
      }

      if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      websocketRef.current.send(event.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (websocketRef.current && websocketRef.current.readyState <= WebSocket.OPEN) {
        websocketRef.current.close();
      }

      websocketRef.current = null;
      setPhase("idle");
    };

    try {
      recorder.start(250);
      setPhase("recording");
      setNotice({ kind: "success", message: "Opname gestart. Transcriptie komt live binnen." });
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      websocket.close();
      websocketRef.current = null;
      setNotice({ kind: "error", message: "Kon opname niet starten." });
    }
  }

  function handleStop() {
    if (phase !== "recording") {
      return;
    }

    mediaRecorderRef.current?.stop();

    if (websocketRef.current && websocketRef.current.readyState <= WebSocket.OPEN) {
      websocketRef.current.close();
    }

    websocketRef.current = null;
    setFinalText((current) => appendTranscript(current, interimText));
    setInterimText("");
    setNotice({ kind: "success", message: "Opname gestopt." });
  }

  async function handleSave() {
    if (!canSave) {
      return;
    }

    setIsSaving(true);
    setNotice(null);

    try {
      const headers = await getAuthHeader();
      const response = await fetch("/api/recordings", {
        method: "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rawText: combinedTranscript.trim(),
        }),
      });

      const payload = (await response.json()) as unknown;

      if (!response.ok) {
        const apiError = extractApiError(payload);
        throw new Error(apiError?.error ?? "Opslaan mislukt.");
      }

      if (!isRecording(payload)) {
        throw new Error("Opslaan gelukt, maar response heeft een onverwacht formaat.");
      }

      const recording = payload;
      setSavedRecording(recording);
      setStructuredHtml("");
      setNotice({ kind: "success", message: "Opname opgeslagen. Je kunt nu op Structureer klikken." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Opslaan mislukt.";
      setNotice({ kind: "error", message });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStructure() {
    if (!savedRecording || !canStructure) {
      return;
    }

    setIsStructuring(true);
    setNotice(null);

    try {
      const headers = await getAuthHeader();
      const response = await fetch(`/api/recordings/${savedRecording.id}/structure`, {
        method: "POST",
        headers,
      });

      if (!response.ok) {
        const payload = (await response.json()) as unknown;
        const apiError = extractApiError(payload);
        throw new Error(apiError?.error ?? "Structureren mislukt.");
      }

      if (!response.body) {
        throw new Error("Structureren gelukt, maar stream ontbreekt.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedMarkdown = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) {
          continue;
        }

        streamedMarkdown += chunk;
        const cleanedMarkdown = streamedMarkdown.trim();
        setFinalText(cleanedMarkdown);
        setInterimText("");
        setStructuredHtml(cleanedMarkdown ? renderSimpleMarkdown(cleanedMarkdown) : "");
      }

      streamedMarkdown += decoder.decode();
      const finalMarkdown = streamedMarkdown.trim();

      if (!finalMarkdown) {
        throw new Error("Structureren gaf geen tekst terug.");
      }

      if (finalMarkdown.includes("[ERROR]")) {
        const errorLine = finalMarkdown
          .split(/\r?\n/)
          .find((line) => line.includes("[ERROR]"))
          ?.replace("[ERROR]", "")
          .trim();
        throw new Error(errorLine || "Structureren is onderbroken.");
      }

      setSavedRecording((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          structured_text: finalMarkdown,
          status: "done",
          updated_at: new Date().toISOString(),
        };
      });
      setFinalText(finalMarkdown);
      setInterimText("");
      setStructuredHtml(renderSimpleMarkdown(finalMarkdown));
      setNotice({ kind: "success", message: "Transcriptie is gestructureerd." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Structureren mislukt.";
      setNotice({ kind: "error", message });
    } finally {
      setIsStructuring(false);
    }
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      {structuredHtml ? (
        <div className="relative rounded-xl border border-(--border) bg-black/25 p-4">
          <span
            className={`pointer-events-none absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--border) bg-black/45 ${statusConfig.className}`}
            title={`Status: ${statusConfig.label}`}
            aria-label={`Status: ${statusConfig.label}`}
          >
            <StatusIcon className={`h-4 w-4 ${isLoadingStatus ? "animate-spin" : ""}`} aria-hidden="true" />
          </span>
          <div
            className="prose prose-invert max-w-none [&_h1]:text-2xl [&_h2]:mt-4 [&_h2]:text-xl [&_h3]:mt-3 [&_h3]:text-lg [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
            dangerouslySetInnerHTML={{ __html: renderedStructuredHtml }}
          />
        </div>
      ) : (
        <div className="relative min-h-56 w-full rounded-xl border border-(--border) bg-black/20">
          <span
            className={`pointer-events-none absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full border border-(--border) bg-black/45 ${statusConfig.className}`}
            title={`Status: ${statusConfig.label}`}
            aria-label={`Status: ${statusConfig.label}`}
          >
            <StatusIcon className={`h-4 w-4 ${isLoadingStatus ? "animate-spin" : ""}`} aria-hidden="true" />
          </span>
          <div className="pointer-events-none min-h-56 whitespace-pre-wrap p-3 text-sm leading-6">
            <span className="text-slate-100">{finalText}</span>
            {finalText && interimText ? <span className="text-slate-100"> </span> : null}
            <span className="text-slate-400">{interimText}</span>
            {!combinedTranscript ? <span className="text-slate-400">Live transcriptie verschijnt hier...</span> : null}
          </div>
          <textarea
            value={combinedTranscript}
            onChange={(event) => {
              setFinalText(event.target.value);
              setInterimText("");
            }}
            placeholder="Live transcriptie verschijnt hier..."
            className="absolute inset-0 min-h-56 w-full resize-y bg-transparent p-3 text-sm leading-6 text-transparent caret-slate-100 outline-none ring-blue-500/50 focus:ring"
          />
        </div>
      )}

      {notice ? (
        <p className={`text-sm ${notice.kind === "success" ? "text-emerald-300" : "text-red-300"}`}>
          {notice.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleStart} disabled={phase === "recording"}>
          Start opname
        </Button>
        <Button variant="outline" onClick={handleStop} disabled={phase !== "recording"}>
          Stop opname
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          {isSaving ? "Opslaan..." : "Opslaan"}
        </Button>
        {savedRecording ? (
          <Button onClick={handleStructure} disabled={!canStructure}>
            {isStructuring ? "Structureren..." : "Structureer"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
