"use client";

import { FormEvent, useState } from "react";

export default function HomePage() {
  const [started, setStarted] = useState(false);
  const [input, setInput] = useState("");
  const [streamedText, setStreamedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const prompt = input.trim();
    if (!prompt || isLoading) {
      return;
    }

    setInput("");
    setStreamedText("");
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok || !response.body) {
        throw new Error("Streaming request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        setStreamedText((previous) => previous + chunk);
      }
    } catch {
      setError("Er ging iets mis tijdens het streamen. Probeer opnieuw.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-12 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-8">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Fitrah Live Chat</h1>
        <p className="max-w-2xl text-lg text-slate-700">
          Druk op de knop, stuur je bericht en kijk hoe het antwoord woord per woord binnenkomt.
        </p>

        {!started ? (
          <button
            type="button"
            onClick={() => setStarted(true)}
            className="rounded-2xl bg-slate-900 px-8 py-4 text-lg font-medium text-white transition hover:bg-slate-700"
          >
            Lets go
          </button>
        ) : null}

        {started ? (
          <section className="space-y-4 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm md:p-6">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Typ je vraag..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base outline-none transition focus:border-slate-500"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-xl bg-emerald-600 px-5 py-3 font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {isLoading ? "Streaming..." : "Verstuur"}
              </button>
            </form>

            <div className="min-h-36 rounded-xl border border-slate-200 bg-white p-4 text-base leading-relaxed text-slate-800">
              {streamedText || "Het antwoord verschijnt hier zodra je een bericht verstuurt."}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </section>
        ) : null}
      </div>
    </main>
  );
}
