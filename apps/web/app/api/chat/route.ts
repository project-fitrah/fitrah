import { streamText } from "ai";

export const runtime = "edge";

export async function POST(request: Request) {
  const { prompt } = (await request.json()) as { prompt?: string };

  const result = streamText({
    model: {
      provider: "placeholder",
      modelId: "placeholder",
      async doStream() {
        throw new Error("Connect your AI provider model implementation.");
      }
    },
    prompt: prompt ?? "Explain why logical consistency matters in spiritual reasoning."
  });

  return result.toTextStreamResponse();
}
