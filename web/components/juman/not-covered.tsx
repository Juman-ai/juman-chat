// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { makeAssistantDataUI } from "@assistant-ui/react";

const ALLOWED_SCHEMES = ["https:", "tel:", "mailto:"];

function isSafeContactUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_SCHEMES.includes(parsed.protocol);
  } catch {
    return false;
  }
}

type NotCoveredData = {
  message: string;
  contact?: { label: string; url: string };
};

export const NotCoveredDataUI = makeAssistantDataUI({
  name: "not-covered",
  render: ({ data }) => {
    const { message, contact } = data as NotCoveredData;
    const safeContact =
      contact?.url && isSafeContactUrl(contact.url) ? contact : null;
    return (
      <div
        role="status"
        className="flex flex-col gap-2 rounded-xl border-2 border-[var(--juman-gold)] bg-[var(--juman-cream)] px-4 py-3 font-[var(--font-juman)]"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">⚠️</span>
          <p className="text-sm font-semibold text-[var(--juman-ink)]">{message}</p>
        </div>
        {safeContact && (
          <p className="flex items-center gap-2 text-sm text-[var(--juman-ink)]">
            <span>للتواصل مع الجهة:</span>
            <a
              href={safeContact.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[var(--juman-gold)] px-4 py-1.5 font-semibold text-white transition-opacity hover:opacity-80"
            >
              {safeContact.label || safeContact.url}
            </a>
          </p>
        )}
      </div>
    );
  },
});
