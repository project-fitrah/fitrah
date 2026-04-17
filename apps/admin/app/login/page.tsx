import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Inloggen",
};

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-5">
      <section className="w-full rounded-3xl border border-slate-700/80 bg-slate-950/75 p-6 shadow-[0_24px_50px_-30px_rgba(2,6,23,0.95)] backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Fitrah Admin</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-100">Inloggen</h1>
        <p className="mt-2 text-sm text-slate-300">Log in met je Supabase-account om toegang te krijgen tot het dashboard.</p>

        <LoginForm />
      </section>
    </main>
  );
}
