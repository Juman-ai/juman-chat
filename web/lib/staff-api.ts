// SPDX-License-Identifier: AGPL-3.0-or-later

const API_URL =
  process.env.NEXT_PUBLIC_JUMAN_API_URL ?? "http://localhost:8000";

export type Finding = {
  id: string;
  check_id: string;
  clause_id: string;
  field: "title" | "meta_description" | "body";
  message: string;
  basis: "computed" | "model";
  quote: string;
  suggestion: string | null;
  char_pos: [number, number] | null;
  source: {
    source_type: "dga" | "policy";
    doc_id?: string;
    doc_title?: string;
    clause_id?: string;
    clause_text?: string;
    page?: number;
    section?: string;
    rule_id?: string;
    url?: string;
  } | null;
};

export type UncheckedClause = {
  clause_id: string;
  text: string;
  page: number;
  status?: "not_checked" | "partial";
  scope_notice?: string;
};

export type PolicyStatus = {
  has_policy: boolean;
  is_example?: boolean;
  rule_count?: number;
  message: string;
};

export type ReviewResponse = {
  findings: Finding[];
  unchecked_clauses: UncheckedClause[];
  wording_notice: string | null;
  model_status: "ok" | "failed" | "timeout" | "not_run" | null;
  policy_status: PolicyStatus;
  skipped_checks: Array<{ check_id: string; name: string; reason: string }>;
  traceability: Record<string, unknown>;
};

type LoginResult =
  | { ok: true }
  | { ok: false; reason: "invalid_code" | "rate_limited" | "network_error" | "server_error" };

export async function staffCheckSession(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/staff/session`, {
      credentials: "include",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function staffLogin(code: string): Promise<LoginResult> {
  try {
    const res = await fetch(`${API_URL}/staff/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code }),
    });
    if (res.ok) return { ok: true };
    if (res.status === 401) return { ok: false, reason: "invalid_code" };
    if (res.status === 429) return { ok: false, reason: "rate_limited" };
    return { ok: false, reason: "server_error" };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

export async function staffReview(payload: {
  title: string;
  meta_description: string;
  body: string;
  keyword: string;
  computed_only: boolean;
}): Promise<ReviewResponse> {
  const res = await fetch(`${API_URL}/staff/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Review failed: ${res.status}`);
  return res.json();
}

export type SuggestMetaResponse = {
  title: string;
  meta_description: string;
  computed_findings: Array<{ check_id: string; message: string; field: string }>;
};

export async function staffSuggestMeta(payload: {
  body: string;
  keyword: string | null;
}): Promise<SuggestMetaResponse> {
  const res = await fetch(`${API_URL}/staff/suggest-meta`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Suggest failed: ${res.status}`);
  return res.json();
}

export async function staffFindingAction(payload: {
  finding_id: string;
  action: string;
  check_id: string;
  clause_id: string | null;
}): Promise<void> {
  await fetch(`${API_URL}/staff/finding-action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
}
