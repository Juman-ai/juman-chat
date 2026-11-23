// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { useState } from "react";
import { staffLogin } from "@/lib/staff-api";

const ERROR_MESSAGES: Record<string, string> = {
  invalid_code: "رمز الدخول غير صحيح",
  rate_limited: "محاولات كثيرة، حاول لاحقًا",
  network_error: "تعذّر الاتصال بالخادم",
  server_error: "حدث خطأ في الخادم",
};

export function StaffGate({ onSuccess }: { onSuccess: () => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await staffLogin(code);
    setLoading(false);
    if (result.ok) {
      onSuccess();
      return;
    }
    setError(ERROR_MESSAGES[result.reason] ?? "حدث خطأ غير متوقع");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--juman-paper)]">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-[var(--juman-line)] bg-[var(--juman-surface)] p-8 shadow-sm"
      >
        <label
          htmlFor="staff-code"
          className="text-sm font-semibold text-[var(--juman-ink)]"
        >
          رمز الدخول
        </label>
        <input
          id="staff-code"
          type="password"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="rounded-lg border border-[var(--juman-line)] bg-[var(--juman-paper)] px-3 py-2 text-sm text-[var(--juman-ink)] outline-none focus:ring-2 focus:ring-[var(--juman-gold)]"
          autoFocus
        />
        {error && (
          <p data-testid="gate-error" className="text-sm font-medium text-red-600">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading || !code}
          className="rounded-lg bg-[var(--juman-navy)] px-4 py-2 text-sm font-semibold text-[var(--juman-paper)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "…" : "دخول"}
        </button>
      </form>
    </div>
  );
}
