// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Finding,
  type PolicyStatus,
  type ReviewResponse,
  type SuggestMetaResponse,
  type UncheckedClause,
  staffFindingAction,
  staffReview,
  staffSuggestMeta,
} from "@/lib/staff-api";
import { DraftPanel } from "./draft-panel";
import { FindingCard } from "./finding-card";

type Fields = {
  title: string;
  meta_description: string;
  body: string;
  keyword: string;
};

const EMPTY_FIELDS: Fields = {
  title: "",
  meta_description: "",
  body: "",
  keyword: "",
};

export function ReviewPanel() {
  const [fields, setFields] = useState<Fields>(EMPTY_FIELDS);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [uncheckedClauses, setUncheckedClauses] = useState<UncheckedClause[]>([]);
  const [skippedChecks, setSkippedChecks] = useState<ReviewResponse["skipped_checks"]>([]);
  const [policyStatus, setPolicyStatus] = useState<PolicyStatus | null>(null);
  const [wordingNotice, setWordingNotice] = useState<string | null>(null);
  const [modelStatus, setModelStatus] = useState<ReviewResponse["model_status"] | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [staleIds, setStaleIds] = useState<Set<string>>(new Set());
  const [suggesting, setSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<SuggestMetaResponse | null>(null);

  const manuallyEditedFields = useRef<Set<string>>(new Set());
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function applyResponse(res: ReviewResponse, computedOnly: boolean) {
    if (computedOnly) {
      // Replace only computed findings; keep model findings, unchecked clauses,
      // skipped checks, and model status from the last full review
      setFindings((prev) => [
        ...prev.filter((f) => f.basis !== "computed"),
        ...res.findings,
      ]);
    } else {
      setFindings(res.findings);
      setModelStatus(res.model_status);
      setUncheckedClauses(res.unchecked_clauses);
      setSkippedChecks(res.skipped_checks);
      setPolicyStatus(res.policy_status);
      setWordingNotice(res.wording_notice);
      setHasReviewed(true);
    }
  }

  async function handleReview() {
    setReviewing(true);
    setStaleIds(new Set());
    manuallyEditedFields.current.clear();
    try {
      const res = await staffReview({ ...fields, computed_only: false });
      applyResponse(res, false);
    } catch {
      /* network errors — keep existing state */
    } finally {
      setReviewing(false);
    }
  }

  const scheduleComputedRerun = useCallback(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await staffReview({ ...fields, computed_only: true });
        applyResponse(res, true);
      } catch {
        /* ignore */
      }
    }, 500);
  }, [fields]);

  function handleFieldChange(
    field: keyof Fields,
    value: string,
    isManualTyping: boolean,
  ) {
    setFields((prev) => ({ ...prev, [field]: value }));

    if (isManualTyping) {
      manuallyEditedFields.current.add(field);
      setStaleIds((prev) => {
        const next = new Set(prev);
        for (const f of findings) {
          if (f.basis === "model" && f.field === field) next.add(f.id);
        }
        return next;
      });
    }
  }

  useEffect(() => {
    if (findings.length === 0) return;

    setStaleIds((prev) => {
      const next = new Set(prev);
      for (const f of findings) {
        if (f.quote && !fields[f.field].includes(f.quote)) {
          next.add(f.id);
        }
      }
      return next;
    });

    scheduleComputedRerun();

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [fields, findings.length, scheduleComputedRerun]);

  function handleAccept(finding: Finding) {
    if (!finding.suggestion || !finding.char_pos) return;
    const [start, end] = finding.char_pos;
    const fieldVal = fields[finding.field];
    // Replace by char_pos, not by string search
    const updated = fieldVal.slice(0, start) + finding.suggestion + fieldVal.slice(end);
    handleFieldChange(finding.field, updated, false);
  }

  function handleReject(_finding: Finding) {
    // Text unchanged; action already posted by FindingCard
  }

  async function handleCopyFinal() {
    const text = [fields.title, fields.meta_description, fields.body]
      .filter(Boolean)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
    staffFindingAction({
      finding_id: "",
      action: "copy_final",
      check_id: "",
      clause_id: null,
    });
  }

  async function handleSuggest() {
    setSuggesting(true);
    setSuggestion(null);
    try {
      const res = await staffSuggestMeta({
        body: fields.body,
        keyword: fields.keyword || null,
      });
      setSuggestion(res);
    } catch {
      /* network error */
    } finally {
      setSuggesting(false);
    }
  }

  function acceptSuggestion(field: "title" | "meta_description") {
    if (!suggestion) return;
    const value = field === "title" ? suggestion.title : suggestion.meta_description;
    // Never overwrite a field the staff member already filled
    if (fields[field].trim()) return;
    handleFieldChange(field, value, false);
    // Clear the suggestion for that field
    setSuggestion((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        [field]: "",  // mark as accepted
      };
    });
  }

  const canSuggest = fields.body.trim().length > 0;

  const inputClass =
    "w-full rounded-lg border border-[var(--juman-line)] bg-[var(--juman-paper)] px-3 py-2 text-sm text-[var(--juman-ink)] outline-none focus:ring-2 focus:ring-[var(--juman-gold)]";

  return (
    <div className="flex min-h-screen bg-[var(--juman-paper)]">
      {/* Editor */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <p className="text-xs text-[var(--juman-muted)]">
          لا تضع بيانات شخصية في النص. يُرسل النص إلى مزوّد النموذج لمراجعته.
        </p>

        {modelStatus === "not_run" && hasReviewed && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-800">
            لم تعمل فحوصات النموذج — أعد المحاولة.
          </div>
        )}

        {(modelStatus === "failed" || modelStatus === "timeout") && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
            لم تعمل فحوصات الإملاء والنحو — أعد المحاولة.
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[var(--juman-ink)]">العنوان</span>
          <input
            className={inputClass}
            value={fields.title}
            onChange={(e) => handleFieldChange("title", e.target.value, true)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[var(--juman-ink)]">الوصف التعريفي</span>
          <input
            className={inputClass}
            value={fields.meta_description}
            onChange={(e) => handleFieldChange("meta_description", e.target.value, true)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[var(--juman-ink)]">النص</span>
          <textarea
            className={`${inputClass} min-h-[300px] resize-y`}
            value={fields.body}
            onChange={(e) => handleFieldChange("body", e.target.value, true)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-semibold text-[var(--juman-ink)]">
            كلمة مفتاحية (اختياري)
          </span>
          <input
            className={inputClass}
            value={fields.keyword}
            onChange={(e) => handleFieldChange("keyword", e.target.value, true)}
          />
        </label>

        {/* Suggestion proposal */}
        {suggestion && (
          <div className="flex flex-col gap-3 rounded-lg border border-[var(--juman-teal)] bg-[var(--juman-cream)] p-4">
            <span className="text-sm font-semibold text-[var(--juman-navy)]">اقتراح عنوان ووصف</span>
            {suggestion.title && (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <span className="text-xs text-[var(--juman-muted)]">العنوان: </span>
                  <span className="text-sm">{suggestion.title}</span>
                </div>
                <button
                  onClick={() => acceptSuggestion("title")}
                  disabled={!!fields.title.trim()}
                  title={fields.title.trim() ? "الحقل ممتلئ — لن يُستبدل" : undefined}
                  className="shrink-0 rounded-md bg-[var(--juman-navy)] px-3 py-1 text-xs font-semibold text-[var(--juman-paper)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  قبول
                </button>
              </div>
            )}
            {suggestion.meta_description && (
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <span className="text-xs text-[var(--juman-muted)]">الوصف: </span>
                  <span className="text-sm">{suggestion.meta_description}</span>
                </div>
                <button
                  onClick={() => acceptSuggestion("meta_description")}
                  disabled={!!fields.meta_description.trim()}
                  title={fields.meta_description.trim() ? "الحقل ممتلئ — لن يُستبدل" : undefined}
                  className="shrink-0 rounded-md bg-[var(--juman-navy)] px-3 py-1 text-xs font-semibold text-[var(--juman-paper)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  قبول
                </button>
              </div>
            )}
            {suggestion.computed_findings.length > 0 && (
              <div className="text-xs text-amber-700">
                <span className="font-semibold">ملاحظات: </span>
                {suggestion.computed_findings.map((f, i) => (
                  <span key={i}>{f.message}{i < suggestion.computed_findings.length - 1 ? " | " : ""}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleReview}
            disabled={reviewing}
            className="rounded-lg bg-[var(--juman-navy)] px-5 py-2 text-sm font-semibold text-[var(--juman-paper)] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {reviewing ? "جارٍ المراجعة…" : "مراجعة"}
          </button>
          <button
            onClick={handleSuggest}
            disabled={suggesting || !canSuggest}
            className="rounded-lg border border-[var(--juman-teal)] px-5 py-2 text-sm font-semibold text-[var(--juman-teal)] transition-opacity hover:opacity-80 disabled:opacity-50"
          >
            {suggesting ? "جارٍ الاقتراح…" : "اقتراح عنوان ووصف"}
          </button>
          <button
            onClick={handleCopyFinal}
            className="rounded-lg border border-[var(--juman-line)] px-5 py-2 text-sm font-semibold text-[var(--juman-ink)] transition-opacity hover:opacity-80"
          >
            نسخ النص النهائي
          </button>
        </div>

        {/* Draft panel — always available */}
        <DraftPanel
          keyword={fields.keyword}
          currentFields={{ title: fields.title, meta_description: fields.meta_description, body: fields.body }}
          onUseDraft={(draft) => {
            handleFieldChange("title", draft.title, false);
            handleFieldChange("meta_description", draft.meta_description, false);
            handleFieldChange("body", draft.body, false);
          }}
        />
      </div>

      {/* Findings sidebar */}
      <aside className="flex w-96 shrink-0 flex-col gap-3 overflow-y-auto border-r border-[var(--juman-line)] bg-[var(--juman-surface)] p-4">
        <h2 className="text-sm font-bold text-[var(--juman-navy)]">النتائج</h2>

        {!hasReviewed && (
          <p data-testid="no-review-yet" className="text-xs text-[var(--juman-muted)]">
            لم تُجرَ مراجعة بعد.
          </p>
        )}

        {hasReviewed && findings.length === 0 && !skippedChecks.some((s) => s.reason === "الحقل فارغ") && (
          <p data-testid="zero-findings" className="text-xs text-green-700">
            {modelStatus === "ok" ? "لا توجد ملاحظات." : "لا توجد ملاحظات من الفحوصات الحاسوبية."}
          </p>
        )}

        {findings.map((f) => (
          <FindingCard
            key={f.id}
            finding={f}
            stale={staleIds.has(f.id)}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        ))}

        {skippedChecks.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg border border-amber-300 bg-amber-50 p-3">
            <span className="text-xs font-semibold text-amber-800">
              فحوصات لم تُجرَ:
            </span>
            {skippedChecks.map((sc) => (
              <div key={sc.check_id} className="text-xs text-amber-700">
                {sc.name}: {sc.reason}
              </div>
            ))}
          </div>
        )}

        {uncheckedClauses.length > 0 && (
          <div className="flex flex-col gap-2 rounded-lg border border-[var(--juman-line)] bg-[var(--juman-cream)] p-3">
            <span className="text-xs font-semibold text-[var(--juman-ink)]">
              حالة الضوابط:
            </span>
            {uncheckedClauses.map((uc) => (
              <div key={uc.clause_id} className="text-xs text-[var(--juman-ink)]">
                <span className="font-semibold">{uc.clause_id}</span>
                <span className="text-[var(--juman-muted)]"> (ص {uc.page})</span>
                <span className="break-words"> — «{uc.text}»</span>
                {uc.status === "partial" && uc.scope_notice && (
                  <p className="mt-1 text-[var(--juman-teal)]">فُحص جزئيًا: {uc.scope_notice}</p>
                )}
                {uc.status !== "partial" && (
                  <span className="text-[var(--juman-muted)]"> — لم يُفحص</span>
                )}
              </div>
            ))}
          </div>
        )}

        {policyStatus && hasReviewed && (
          <div className="rounded-lg border border-[var(--juman-line)] bg-[var(--juman-surface)] p-3 text-xs text-[var(--juman-ink)]">
            <span className="font-semibold">سياسة المحتوى: </span>
            <span className={policyStatus.has_policy ? "text-[var(--juman-teal)]" : "text-[var(--juman-muted)]"}>
              {policyStatus.message}
            </span>
          </div>
        )}

        {wordingNotice && (
          <p className="text-xs text-[var(--juman-muted)]">{wordingNotice}</p>
        )}
      </aside>
    </div>
  );
}
