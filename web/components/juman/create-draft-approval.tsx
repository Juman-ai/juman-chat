// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { useState } from "react";
import { makeAssistantToolUI } from "@assistant-ui/react";
import { t } from "@/lib/strings";

const API_URL =
  process.env.NEXT_PUBLIC_JUMAN_API_URL ?? "http://localhost:8000";

type CreateDraftArgs = {
  title: string;
  body: string;
};

type CreateDraftResult = {
  status: "approved" | "rejected" | "error";
  message: string;
};

export const CreateDraftToolUI = makeAssistantToolUI<CreateDraftArgs, string>({
  toolName: "create_draft",
  display: "standalone",
  render: ({ toolCallId, args, result, addResult }) => {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDecision = async (approved: boolean) => {
      setSubmitting(true);
      setError(null);
      try {
        const res = await fetch(`${API_URL}/tool/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tool_call_id: toolCallId,
            approved,
          }),
        });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({ detail: res.statusText }));
          throw new Error(detail.detail || res.statusText);
        }
        const data = await res.json();
        addResult(JSON.stringify(data));
      } catch (e) {
        // Network or server error — do NOT mark as rejected.
        // Server status stays pending; user can retry.
        setSubmitting(false);
        setError(e instanceof Error ? e.message : t.connectionError);
      }
    };

    // After decision
    if (result) {
      let parsed: CreateDraftResult;
      try {
        parsed = JSON.parse(result);
      } catch {
        parsed = { status: "error", message: result };
      }
      const isApproved = parsed.status === "approved";
      const isError = parsed.status === "error";
      return (
        <div
          role="status"
          className="rounded-xl border-2 px-4 py-3 font-[var(--font-juman)]"
          style={{
            borderColor: isError
              ? "#c33"
              : isApproved
                ? "var(--juman-teal)"
                : "var(--juman-gold)",
            backgroundColor: isError
              ? "color-mix(in srgb, #c33 8%, var(--juman-paper))"
              : isApproved
                ? "color-mix(in srgb, var(--juman-teal) 10%, var(--juman-paper))"
                : "var(--juman-cream)",
          }}
        >
          <p className="text-sm font-bold text-[var(--juman-ink)]">
            {isError ? t.errorOccurred : isApproved ? t.approved : t.rejected}
          </p>
          <p className="mt-1 text-sm text-[var(--juman-ink)]">{parsed.message}</p>
        </div>
      );
    }

    // Pending approval (with possible transient error)
    return (
      <div
        role="alertdialog"
        aria-label={t.approvalTitle}
        className="rounded-xl border-2 border-[var(--juman-gold)] bg-[var(--juman-cream)] px-4 py-4 font-[var(--font-juman)]"
      >
        <p className="mb-3 text-sm font-bold text-[var(--juman-navy)]">
          {t.approvalTitle}
        </p>

        <div className="mb-3 space-y-1 rounded-lg bg-[var(--juman-paper)] p-3 text-sm text-[var(--juman-ink)]">
          <p>
            <span className="font-semibold">{t.draftTitle}:</span> {args.title}
          </p>
          <p>
            <span className="font-semibold">{t.draftBody}:</span> {args.body}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {t.errorOccurred}: {error}
          </div>
        )}

        <p className="mb-3 text-xs text-[var(--juman-muted)]">{t.approvalPending}</p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleDecision(true)}
            className="rounded-lg bg-[var(--juman-teal)] px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          >
            {t.approve}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleDecision(false)}
            className="rounded-lg border border-[var(--juman-line)] bg-[var(--juman-paper)] px-4 py-2 text-sm font-semibold text-[var(--juman-ink)] transition-opacity disabled:opacity-50"
          >
            {t.reject}
          </button>
        </div>
      </div>
    );
  },
});
