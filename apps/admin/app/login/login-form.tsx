"use client";

import { useActionState } from "react";
import { loginAction, type LoginActionState } from "./login-action";

const initialState: LoginActionState = {
  success: false,
  message: "",
  error: "",
};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, initialState);

  return (
    <form className="mt-5 space-y-3" action={formAction}>
      <label className="block space-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">E-mail</span>
        <input
          type="email"
          name="email"
          required
          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none ring-slate-600/50 placeholder:text-slate-500 focus:ring"
          placeholder="naam@domein.com"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-400">Wachtwoord</span>
        <input
          type="password"
          name="password"
          required
          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-slate-100 outline-none ring-slate-600/50 placeholder:text-slate-500 focus:ring"
          placeholder="********"
        />
      </label>

      {state.error ? <p className="text-sm text-red-300">{state.error}</p> : null}
      {state.success ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 inline-flex h-11 w-full items-center justify-center rounded-xl bg-scholar-ink px-4 text-sm font-semibold text-white transition-colors hover:bg-scholar-ink/90 disabled:opacity-60"
      >
        {isPending ? "Bezig met inloggen..." : "Inloggen"}
      </button>
    </form>
  );
}