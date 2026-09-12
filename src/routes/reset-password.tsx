import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { updatePassword } from "@/lib/supabase/auth";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [{ title: "DXF2OBJ — Reset Password" }],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await updatePassword(password);
      setDone(true);
      window.setTimeout(() => void navigate({ to: "/" }), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="w-full max-w-[360px] rounded-[6px] border border-line bg-panel p-[24px]">
        <h1 className="text-[16px] font-semibold text-txt">Set a new password</h1>

        {done ? (
          <p className="mt-[14px] text-[11.5px] text-ok-2">Password updated. Redirecting…</p>
        ) : (
          <form onSubmit={(e) => void submit(e)} className="mt-[16px] space-y-[11px]">
            <div className="space-y-[6px]">
              <label htmlFor="new-password" className="block text-[11px] text-txt-muted">
                New password
              </label>
              <input
                id="new-password"
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-[32px] w-full rounded-[4px] border border-line bg-surface px-[10px] text-[12px] text-txt outline-none focus:border-accent"
              />
            </div>

            {error ? <p className="text-[11.5px] text-destructive">{error}</p> : null}

            <button
              type="submit"
              disabled={busy}
              className="flex h-[34px] w-full items-center justify-center rounded-[5px] text-[12.5px] font-medium text-white shadow-[0_4px_16px_-6px_var(--accent)] transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: "var(--gradient-accent)" }}
            >
              {busy ? "Updating…" : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
