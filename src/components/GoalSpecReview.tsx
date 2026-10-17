import { useState } from "react";
import { GOAL_SPEC_FIELDS, type CitableAnswer, type GoalSpec, type GoalSpecKey } from "~/lib/goal-spec";

interface Props {
  spec: GoalSpec | undefined;
  citable: CitableAnswer[];
  /** False for a delegated agent: it may draft, but only the owner approves. */
  canReview: boolean;
  stale: boolean;
  drafting: boolean;
  error: string;
  onDraft: () => void;
  onReview: (key: GoalSpecKey, action: "approve" | "reject" | "edit" | "reset", editedValue?: string) => void;
}

const REVIEW_LABEL = { pending: "Awaiting review", approved: "Approved", edited: "Approved with your edit", rejected: "Rejected" } as const;
const REVIEW_CLASS = {
  pending: "text-gray-600 dark:text-gray-400",
  approved: "text-emerald-700 dark:text-emerald-400",
  edited: "text-emerald-700 dark:text-emerald-400",
  rejected: "text-red-700 dark:text-red-400",
} as const;

export function GoalSpecReview({ spec, citable, canReview, stale, drafting, error, onDraft, onReview }: Props) {
  const [editing, setEditing] = useState<GoalSpecKey | null>(null);
  const [draftText, setDraftText] = useState("");
  const byId = new Map(citable.map((answer) => [answer.id, answer]));
  const released = spec ? Object.values(spec.fields).filter((f) => f.review === "approved" || f.review === "edited").length : 0;

  return (
    <section aria-labelledby="goal-spec-h" className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="goal-spec-h" className="text-base font-semibold text-gray-900 dark:text-gray-100">Goal spec</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Your interview as one hand-off-ready statement of the goal. Each field cites the answers it rests on; only fields you approve are included in goal-spec.md and the download.
          </p>
        </div>
        <button type="button" onClick={onDraft} disabled={drafting} className="min-h-11 rounded-lg border border-gray-300 px-4 text-sm font-semibold text-gray-900 hover:border-emerald-600 disabled:opacity-50 dark:border-gray-600 dark:text-gray-100">
          {drafting ? "Drafting…" : spec ? "Redraft" : "Draft goal spec"}
        </button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p>}
      {spec && stale && <p role="status" className="mt-3 text-sm text-amber-700 dark:text-amber-400">Your Context changed since this draft. Redraft to include the new answers; your reviews start over.</p>}
      {spec && !canReview && <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">Drafted for the account owner, who reviews each field before it is shared.</p>}
      {spec && (
        <>
          <p className="mt-3 font-mono text-xs text-gray-600 dark:text-gray-400">{released} of {GOAL_SPEC_FIELDS.length} fields approved</p>
          <ol className="mt-3 divide-y divide-gray-200 dark:divide-gray-700">
            {GOAL_SPEC_FIELDS.map(({ key, label }) => {
              const field = spec.fields[key];
              if (!field) return null;
              const shown = field.review === "edited" ? field.editedValue ?? "" : field.value;
              return (
                <li key={key} className="py-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{label}</h3>
                    <span className={`font-mono text-xs ${REVIEW_CLASS[field.review]}`}>{REVIEW_LABEL[field.review]}</span>
                  </div>
                  {editing === key ? (
                    <div className="mt-2 space-y-2">
                      <label className="sr-only" htmlFor={`gs-${key}`}>{label}</label>
                      <textarea id={`gs-${key}`} value={draftText} onChange={(e) => setDraftText(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950" />
                      <div className="flex flex-wrap gap-2">
                        <button type="button" disabled={!draftText.trim()} onClick={() => { onReview(key, "edit", draftText); setEditing(null); }} className="min-h-11 rounded-md bg-emerald-700 px-3 text-sm font-semibold text-white disabled:opacity-50">Save and approve</button>
                        <button type="button" onClick={() => setEditing(null)} className="min-h-11 rounded-md border border-gray-300 px-3 text-sm dark:border-gray-700">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p className={`mt-1 whitespace-pre-line text-sm ${shown ? "text-gray-800 dark:text-gray-200" : "italic text-gray-500 dark:text-gray-400"}`}>
                      {shown || "Not stated in the interview."}
                    </p>
                  )}
                  {field.review !== "edited" && field.citations.length > 0 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-emerald-700 dark:text-emerald-400">From {field.citations.length} answer{field.citations.length === 1 ? "" : "s"}</summary>
                      <ul className="mt-1 space-y-1">
                        {field.citations.map((id) => (
                          <li key={id} className="text-xs text-gray-600 dark:text-gray-400"><span className="font-semibold">{byId.get(id)?.label ?? id}:</span> {byId.get(id)?.text.slice(0, 240) ?? ""}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                  {canReview && editing !== key && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {field.review !== "approved" && <button type="button" onClick={() => onReview(key, "approve")} className="min-h-11 rounded-md border border-emerald-600 px-3 text-sm text-emerald-700 dark:border-emerald-500 dark:text-emerald-300">{field.status === "stated" ? "Approve" : "Approve as not stated"}</button>}
                      <button type="button" onClick={() => { setEditing(key); setDraftText(shown); }} className="min-h-11 rounded-md border border-gray-300 px-3 text-sm dark:border-gray-700">Edit</button>
                      {field.review !== "rejected" && <button type="button" onClick={() => onReview(key, "reject")} className="min-h-11 rounded-md border border-gray-300 px-3 text-sm dark:border-gray-700">Reject</button>}
                      {field.review !== "pending" && <button type="button" onClick={() => onReview(key, "reset")} className="min-h-11 px-2 text-sm text-gray-600 underline dark:text-gray-400">Undo</button>}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </>
      )}
    </section>
  );
}
