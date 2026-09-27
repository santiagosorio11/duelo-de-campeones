"use client";

import { useActionState } from "react";
import { login } from "../actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <form action={action} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className="text-sm font-medium text-bone/90">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state?.ok === false}
          aria-describedby={state?.ok === false ? "password-error" : undefined}
          className="h-12 w-full rounded-[14px] border border-white/12 bg-ink-850 px-4 text-base text-bone outline-none transition focus:border-gold-400/70 focus:ring-2 focus:ring-gold-400/25"
        />
        {state?.ok === false ? (
          <p id="password-error" className="text-sm text-danger">
            {state.message}
          </p>
        ) : null}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-gold-400 py-3.5 text-base font-semibold text-ink-950 transition active:scale-[0.99] disabled:opacity-70"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
