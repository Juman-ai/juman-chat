// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { makeAssistantDataUI } from "@assistant-ui/react";

export const NotCoveredDataUI = makeAssistantDataUI({
  name: "not-covered",
  render: ({ data }) => {
    const { message } = data as { message: string };
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border-2 border-[var(--juman-gold)] bg-[var(--juman-cream)] px-4 py-3 font-[var(--font-juman)]"
      >
        <span className="text-xl" aria-hidden="true">⚠️</span>
        <p className="text-sm font-semibold text-[var(--juman-ink)]">{message}</p>
      </div>
    );
  },
});
