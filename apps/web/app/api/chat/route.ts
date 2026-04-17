import { NextResponse } from "next/server";

type ChatRequestBody = {
  prompt?: string;
};

function buildAssistantReply(prompt: string): string {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return "Ik heb nog geen vraag ontvangen. Typ iets in de input en druk op sturen.";
  }

  return [
    "Ik hoor je.",
    `Je zei: \"${trimmed}\".`,
    "Dit antwoord wordt bewust woord per woord gestreamd zodat je chat-ervaring hetzelfde aanvoelt als bij een LLM.",
    "Je kan dit endpoint later vervangen door een echte model-call en de streamlogica behouden.",
  ].join(" ");
}

export async function POST(request: Request) {
  let body: ChatRequestBody;

  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const prompt = body.prompt ?? "";
  const reply = buildAssistantReply(prompt);
  const words = reply.split(/\s+/).filter(Boolean);

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let index = 0;

      const interval = setInterval(() => {
        if (index >= words.length) {
          clearInterval(interval);
          controller.close();
          return;
        }

        const chunk = `${words[index]}${index < words.length - 1 ? " " : ""}`;
        controller.enqueue(new TextEncoder().encode(chunk));
        index += 1;
      }, 70);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
