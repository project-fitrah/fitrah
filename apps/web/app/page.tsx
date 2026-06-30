"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { FormEvent, Suspense } from "react";
import { Joe_animated } from "@components/Joe_animated.jsx";
import { selectJoePose, useJoeChatStore } from "@/stores/joe-chat-store";

export default function HomePage() {
  const input = useJoeChatStore((state) => state.input);
  const lastPrompt = useJoeChatStore((state) => state.lastPrompt);
  const responseText = useJoeChatStore((state) => state.responseText);
  const status = useJoeChatStore((state) => state.status);
  const error = useJoeChatStore((state) => state.error);
  const setInput = useJoeChatStore((state) => state.setInput);
  const submitPrompt = useJoeChatStore((state) => state.submitPrompt);
  const joePose = useJoeChatStore(selectJoePose);
  const isStreaming = status === "streaming";
  const canSubmit = input.trim().length > 0 && !isStreaming;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitPrompt();
  }

  return (
    <main className="min-h-screen px-6 py-8 text-slate-950 md:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-[2rem] border border-white/50 bg-slate-950 shadow-2xl">
          <div className="relative h-[520px] md:h-[680px]">
            <Canvas camera={{ position: [0, 1.6, 4.2], fov: 42 }}>
              <color attach="background" args={["#09090b"]} />
              <ambientLight intensity={0.65} />
              <directionalLight position={[4, 6, 5]} intensity={1.4} />
              <Suspense fallback={null}>
                <Joe_animated pose={joePose} position={[0, -1.25, 0]} rotation={[0, -0.12, 0]} />
              </Suspense>
              <OrbitControls enablePan={false} enableZoom={false} maxPolarAngle={Math.PI / 2} />
            </Canvas>

            <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white/85 backdrop-blur">
              Joe is {isStreaming ? "aan het antwoorden" : "aan het luisteren"}
            </div>
          </div>
        </section>

        <section className="space-y-6 rounded-[2rem] border border-white/70 bg-white/75 p-5 shadow-xl backdrop-blur md:p-8">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-700">Live gesprek</p>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Spreek met Joe</h1>
            <p className="text-base leading-7 text-slate-700">
              Stel je vraag. Joe blijft idle terwijl hij wacht en schakelt naar talking zolang het antwoord binnenkomt.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label htmlFor="joe-message" className="sr-only">
              Bericht aan Joe
            </label>
            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm md:flex-row">
              <input
                id="joe-message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Typ je vraag aan Joe..."
                className="min-h-12 flex-1 rounded-xl bg-transparent px-4 text-base outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-xl bg-slate-950 px-6 py-3 font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isStreaming ? "Joe praat..." : "Verstuur"}
              </button>
            </div>
          </form>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Jij</p>
              <p className="mt-2 min-h-6 text-slate-800">{lastPrompt || "Nog geen bericht verstuurd."}</p>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Joe</p>
              <p className="mt-2 min-h-32 whitespace-pre-wrap text-base leading-7 text-slate-900">
                {responseText || (isStreaming ? "Joe formuleert zijn antwoord..." : "Het antwoord verschijnt hier.")}
              </p>
            </div>
          </div>

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
        </section>
      </div>
    </main>
  );
}
