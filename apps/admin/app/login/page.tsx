"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const isNotAdmin = searchParams.get("error") === "not-admin";

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return;
    }

    void supabase.auth.getUser().then((result) => {
      if (result.data.user) {
        router.replace("/");
      }
    });
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setError("Supabase configuratie ontbreekt.");
        return;
      }

      const result = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (result.error) {
        setError("Inloggen mislukt. Controleer je gegevens.");
        return;
      }

      router.replace("/");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-5">
      <section className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/75 p-6 shadow-[0_24px_50px_-30px_rgba(2,6,23,0.95)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Fitrah Admin</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-100">Inloggen</h1>
        <p className="mt-2 text-sm text-slate-300">Gebruik je admin account om het dashboard te openen.</p>
        {isNotAdmin ? (
          <p className="mt-2 text-sm text-amber-300">Dit account heeft geen admin-toegang.</p>
        ) : null}

        <form className="mt-5 space-y-3" onSubmit={handleSubmit}>
          <label className="block space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">E-mail</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none ring-slate-600/50 placeholder:text-slate-500 focus:ring"
              placeholder="naam@domein.com"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Wachtwoord</span>
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none ring-slate-600/50 placeholder:text-slate-500 focus:ring"
              placeholder="••••••••"
            />
          </label>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-scholar-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-scholar-ink/90 disabled:opacity-60"
          >
            {isLoading ? "Bezig met inloggen..." : "Inloggen"}
          </button>
        </form>
      </section>
    </main>
  );
}
