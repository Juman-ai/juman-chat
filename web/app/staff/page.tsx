// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { useEffect, useState } from "react";
import { StaffGate } from "@/components/juman/staff-gate";
import { ReviewPanel } from "@/components/juman/review-panel";
import { staffCheckSession, staffLogout } from "@/lib/staff-api";

export default function StaffPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    staffCheckSession().then((valid) => setAuthenticated(valid));
  }, []);

  async function handleLogout() {
    await staffLogout();
    setAuthenticated(false);
  }

  if (authenticated === null) return null;

  if (!authenticated) {
    return <StaffGate onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div>
      <div className="flex items-center justify-end border-b border-[var(--juman-line)] bg-[var(--juman-surface)] px-4 py-2">
        <button
          onClick={handleLogout}
          className="rounded-md border border-[var(--juman-line)] px-3 py-1 text-xs font-semibold text-[var(--juman-ink)] transition-opacity hover:opacity-80"
        >
          خروج
        </button>
      </div>
      <ReviewPanel />
    </div>
  );
}
