// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { useEffect, useState } from "react";
import { StaffGate } from "@/components/juman/staff-gate";
import { ReviewPanel } from "@/components/juman/review-panel";
import { staffCheckSession } from "@/lib/staff-api";

export default function StaffPage() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    staffCheckSession().then((valid) => setAuthenticated(valid));
  }, []);

  // Loading — checking session
  if (authenticated === null) return null;

  if (!authenticated) {
    return <StaffGate onSuccess={() => setAuthenticated(true)} />;
  }

  return <ReviewPanel />;
}
