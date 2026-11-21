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

export const NotCoveredDataUI = makeAssistantDataUI({
  name: "not-covered",
  render: ({ data }) => {
    const { message, contact } = data as {
      message: string;
      contact?: { label: string; url: string };
    };
    const safeContact =
      contact?.url && isSafeContactUrl(contact.url) ? contact : null;
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border-2 border-[var(--juman-gold)] bg-[var(--juman-cream)] px-4 py-3 font-[var(--font-juman)]"
      >
        <span className="text-xl" aria-hidden="true">⚠️</span>
        <div className="text-sm font-semibold text-[var(--juman-ink)]">
          <p>{message}</p>
          {safeContact && (
            <p className="mt-2">
              للتواصل مع الجهة:{" "}
              <a
                href={safeContact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[var(--juman-ink)]"
              >
                {safeContact.label || safeContact.url}
              </a>
            </p>
          )}
        </div>
      </div>
    );
  },
});
