// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { type Finding, staffFindingAction } from "@/lib/staff-api";

function SourceLabel({ clauseId, source }: { clauseId: string; source: Finding["source"] }) {
  if (!source) return null;

  if (source.source_type === "dga") {
    const isHeading = clauseId.startsWith("DGA-HEADING");
    const label = isHeading
      ? `القسم ${source.section ?? ""}، صفحة ${source.page ?? ""}`
      : `ضابط ${clauseId}، صفحة ${source.page ?? ""}`;
    return (
      <div className="flex flex-col gap-1 rounded-md bg-[var(--juman-cream)] p-2 text-xs text-[var(--juman-ink)]">
        <span className="font-semibold">
          {label}
        </span>
        {source.doc_title && (
          <span className="text-[var(--juman-muted)]">
            {source.doc_id} — {source.doc_title}
          </span>
        )}
        {source.clause_text && (
          <span className="break-words leading-relaxed">«{source.clause_text}»</span>
        )}
        {source.url ? (
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--juman-teal)] underline"
          >
            فتح المستند
          </a>
        ) : null}
      </div>
    );
  }

  if (source.source_type === "policy") {
    return (
      <span className="text-xs text-[var(--juman-muted)]">
        سياسة الجهة — {source.rule_id ?? ""}
      </span>
    );
  }

  return null;
}

export function FindingCard({
  finding,
  stale,
  onAccept,
  onReject,
}: {
  finding: Finding;
  stale: boolean;
  onAccept: (finding: Finding) => void;
  onReject: (finding: Finding) => void;
}) {
  const basisLabel =
    finding.basis === "computed" ? "فحص حاسوبي" : "اقتراح نموذج";

  function handleAccept() {
    onAccept(finding);
    staffFindingAction({
      finding_id: finding.id,
      action: "accept",
      check_id: finding.check_id,
      clause_id: finding.clause_id,
    });
  }

  function handleReject() {
    onReject(finding);
    staffFindingAction({
      finding_id: finding.id,
      action: "reject",
      check_id: finding.check_id,
      clause_id: finding.clause_id,
    });
  }

  const canAccept = finding.suggestion !== null;

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border border-[var(--juman-line)] bg-[var(--juman-surface)] p-3 ${stale ? "opacity-40" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-[var(--juman-ink)]">{finding.message}</p>
        <span className="shrink-0 rounded-md bg-[var(--juman-cream)] px-2 py-0.5 text-xs text-[var(--juman-navy)]">
          {basisLabel}
        </span>
      </div>

      {finding.quote && (
        <blockquote className="break-words border-r-2 border-[var(--juman-gold)] pr-3 text-xs leading-relaxed text-[var(--juman-muted)]">
          {finding.quote}
        </blockquote>
      )}

      {finding.suggestion !== null && (
        <div className="rounded-md bg-green-50 p-2 text-xs text-green-800">
          <span className="font-semibold">الاقتراح: </span>
          <span className="break-words">{finding.suggestion}</span>
        </div>
      )}

      <SourceLabel clauseId={finding.clause_id} source={finding.source} />

      {canAccept ? (
        <div className="flex gap-2">
          <button
            onClick={handleAccept}
            disabled={stale}
            className="rounded-md bg-[var(--juman-navy)] px-3 py-1 text-xs font-semibold text-[var(--juman-paper)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            قبول
          </button>
          <button
            onClick={handleReject}
            disabled={stale}
            className="rounded-md border border-[var(--juman-line)] px-3 py-1 text-xs font-semibold text-[var(--juman-ink)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            رفض
          </button>
        </div>
      ) : (
        <button
          onClick={handleReject}
          disabled={stale}
          className="w-fit rounded-md border border-[var(--juman-line)] px-3 py-1 text-xs font-semibold text-[var(--juman-ink)] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          تجاهل
        </button>
      )}
    </div>
  );
}
