import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { requestPasswordReset, signIn, signUp } from "@/lib/supabase/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "DXF2OBJ — Sign In" }],
  }),
  component: LoginPage,
});

type Mode = "sign-in" | "sign-up";

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "sign-up") {
        await signUp(email, password);
        setNotice("Account created. Check your email to confirm, then sign in.");
        setMode("sign-in");
      } else {
        await signIn(email, password);
        void navigate({ to: "/" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const forgotPassword = async () => {
    if (!email) {
      setError("Enter your email above first");
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await requestPasswordReset(email);
      setNotice("Password reset email sent.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send reset email");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="w-full max-w-[360px] rounded-[6px] border border-line bg-panel p-[24px]">
        <div className="mb-[18px] flex items-center gap-[9px]">
          <svg viewBox="0 0 24 24" className="size-[19px] text-txt" aria-hidden="true">
            <path
              d="M3 4h18L12 21 3 4Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path d="M8.5 4 12 10.5 15.5 4" fill="none" stroke="currentColor" strokeWidth="1.4" />
          </svg>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-txt">DXF2OBJ</span>
        </div>

        <h1 className="text-[16px] font-semibold text-txt">
          {mode === "sign-in" ? "Sign in" : "Create an account"}
        </h1>

        <form onSubmit={(e) => void submit(e)} className="mt-[16px] space-y-[11px]">
          <div className="space-y-[6px]">
            <label htmlFor="email" className="block text-[11px] text-txt-muted">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[32px] w-full rounded-[4px] border border-line bg-surface px-[10px] text-[12px] text-txt outline-none focus:border-accent"
            />
          </div>
          <div className="space-y-[6px]">
            <label htmlFor="password" className="block text-[11px] text-txt-muted">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-[32px] w-full rounded-[4px] border border-line bg-surface px-[10px] text-[12px] text-txt outline-none focus:border-accent"
            />
          </div>

          {error ? <p className="text-[11.5px] text-destructive">{error}</p> : null}
          {notice ? <p className="text-[11.5px] text-ok-2">{notice}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="flex h-[34px] w-full items-center justify-center rounded-[5px] text-[12.5px] font-medium text-white shadow-[0_4px_16px_-6px_var(--accent)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ background: "var(--gradient-accent)" }}
          >
            {busy ? "Please wait…" : mode === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <div className="mt-[14px] flex items-center justify-between text-[11px]">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "sign-in" ? "sign-up" : "sign-in");
              setError(null);
              setNotice(null);
            }}
            className="text-txt-muted hover:text-txt"
          >
            {mode === "sign-in" ? "Need an account? Sign up" : "Have an account? Sign in"}
          </button>
          {mode === "sign-in" ? (
            <button
              type="button"
              onClick={() => void forgotPassword()}
              className="text-txt-muted hover:text-txt"
            >
              Forgot password?
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
