// SPDX-License-Identifier: AGPL-3.0-or-later
"use client";

import { useState } from "react";
import { type DraftResponse, staffDraft } from "@/lib/staff-api";

type UseDraftPayload = { title: string; meta_description: string; body: string };

export function DraftPanel({
  keyword,
  currentFields,
  onUseDraft,
}: {
  keyword: string;
  currentFields: { title: string; meta_description: string; body: string };
  onUseDraft: (draft: UseDraftPayload) => void;
}) {
  const [notes, setNotes] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [result, setResult] = useState<DraftResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  async function handleDraft() {
    setDrafting(true);
    setError(null);
    setResult(null);
    setConfirmReplace(false);
    try {
      const res = await staffDraft({ notes, keyword: keyword || null });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "فشل إنشاء المسودة");
    } finally {
      setDrafting(false);
    }
  }

  function handleUseDraft() {
    if (!result) return;
    // Check if any field already has text
    const hasExisting = currentFields.title.trim() || currentFields.meta_description.trim() || currentFields.body.trim();
    if (hasExisting && !confirmReplace) {
      setConfirmReplace(true);
      return;
    }
    onUseDraft({
      title: result.draft.title,
      meta_description: result.draft.meta_description,
      body: result.draft.body,
    });
    setConfirmReplace(false);
  }

  async function handleCopy() {
    if (!result) return;
    const text = [result.draft.title, result.draft.meta_description, result.draft.body]
      .filter(Boolean)
      .join("\n\n");
    await navigator.clipboard.writeText(text);
  }

  const inputClass =
    "w-full rounded-lg border border-[var(--juman-line)] bg-[var(--juman-paper)] px-3 py-2 text-sm text-[var(--juman-ink)] outline-none focus:ring-2 focus:ring-[var(--juman-gold)]";

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-[var(--juman-line)] bg-[var(--juman-surface)] p-4">
      <h3 className="text-sm font-bold text-[var(--juman-navy)]">صياغة مسودة</h3>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-[var(--juman-ink)]">ملاحظات الموظف</span>
        <textarea
          className={`${inputClass} min-h-[120px] resize-y`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="اكتب الملاحظات هنا — سيُصاغ الخبر منها ومن مصادر الجهة المنشورة."
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleDraft}
          disabled={drafting || !notes.trim()}
          className="rounded-lg bg-[var(--juman-navy)] px-5 py-2 text-sm font-semibold text-[var(--juman-paper)] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {drafting ? "جارٍ الصياغة…" : "صياغة مسودة"}
        </button>
        {result && (
          <>
            <button
              onClick={handleUseDraft}
              className="rounded-lg bg-[var(--juman-teal)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {confirmReplace ? "الحقول ممتلئة — هل تريد الاستبدال؟" : "استخدم المسودة"}
            </button>
            <button
              onClick={handleCopy}
              className="rounded-lg border border-[var(--juman-line)] px-5 py-2 text-sm font-semibold text-[var(--juman-ink)] transition-opacity hover:opacity-80"
            >
              نسخ المسودة
            </button>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 rounded-lg border border-[var(--juman-line)] bg-[var(--juman-paper)] p-4">
            <div>
              <span className="text-xs font-semibold text-[var(--juman-muted)]">العنوان: </span>
              <span className="text-sm font-semibold text-[var(--juman-ink)]">{result.draft.title}</span>
            </div>
            <div>
              <span className="text-xs font-semibold text-[var(--juman-muted)]">الوصف التعريفي: </span>
              <span className="text-sm text-[var(--juman-ink)]">{result.draft.meta_description}</span>
            </div>
            <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[var(--juman-ink)]">
              {result.draft.body}
            </div>
          </div>

          {result.draft.sources.length > 0 && (
            <div className="flex flex-col gap-1 rounded-lg border border-[var(--juman-line)] bg-[var(--juman-cream)] p-3">
              <span className="text-xs font-semibold text-[var(--juman-ink)]">المصادر:</span>
              {result.draft.sources.map((s) => (
                <div key={s.index} className="text-xs text-[var(--juman-ink)]">
                  [{s.index}]{" "}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[var(--juman-teal)] underline">
                    {s.title}
                  </a>
                </div>
              ))}
            </div>
          )}

          {result.review.findings.length > 0 && (
            <div className="flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
              <span className="text-xs font-semibold text-amber-800">ملاحظات على المسودة:</span>
              {result.review.findings.map((f, i) => (
                <div key={i} className="text-xs text-amber-700">
                  <span className="font-semibold">{f.check_id}: </span>
                  {f.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
