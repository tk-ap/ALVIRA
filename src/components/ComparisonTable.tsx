import { COMPARISON, COMPARISON_COMPETITORS, COMPARISON_DIMENSIONS, MARKS, MARKS_LABEL, type Competitor, type Dimension, type Mark } from "~/lib/comparison";

type Props = { competitors?: Competitor[]; dimensions?: Dimension[]; highlightRow?: number };

export function ComparisonTable({ competitors = COMPARISON_COMPETITORS, dimensions = COMPARISON_DIMENSIONS, highlightRow }: Props) {
  const rows = COMPARISON.filter((row) => dimensions.some((dimension) => dimension.id === row.id));
  const cols = competitors.filter((competitor) => COMPARISON_COMPETITORS.some((item) => item.id === competitor.id));
  const cellLabel = (mark: Mark, note?: string) => `${MARKS_LABEL[mark]}${note ? ` — ${note}` : ""}`;
  return <div className="mt-10">
    <div className="hidden overflow-x-auto sm:block">
      <table className="w-full min-w-[52rem] border-collapse text-left">
        <caption className="sr-only">Feature comparison across AI context tools.</caption>
        <thead><tr className="border-b-2 border-gray-200 dark:border-gray-700">
          <th scope="col" className="w-1/6 py-3 pr-4 font-mono text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Dimension</th>
          {cols.map((competitor, index) => <th scope="col" key={competitor.id} className={`px-3 py-3 font-mono text-xs uppercase tracking-wide ${index === 0 ? "bg-emerald-50/70 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}>{competitor.featureName ?? competitor.displayName}</th>)}
        </tr></thead>
        <tbody className="text-sm leading-relaxed">{rows.map((row, rowIndex) => <tr key={row.id} className={`border-b border-gray-100 dark:border-gray-800 ${highlightRow === rowIndex ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}`}>
          <th scope="row" className="py-3.5 pr-4 font-semibold text-gray-900 dark:text-gray-100">{row.label}</th>
          {cols.map((competitor, index) => { const cell = row.cells[competitor.id]; return <td key={competitor.id} className={`px-3 py-3.5 ${index === 0 ? "bg-emerald-50/40 dark:bg-emerald-950/20" : ""}`}><span role="img" aria-label={cellLabel(cell.mark, cell.note)}>{MARKS[cell.mark]}</span>{cell.note ? <span className="ml-1 text-gray-600 dark:text-gray-400">{cell.note}</span> : null}</td>; })}
        </tr>)}</tbody>
      </table>
    </div>
    <div className="space-y-6 sm:hidden">{rows.map((row, rowIndex) => <div key={row.id} className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="border-b border-emerald-200 bg-emerald-50 px-5 py-3 font-mono text-xs uppercase tracking-wide text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{row.shortLabel}</div>
      {cols.map((competitor, index) => { const cell = row.cells[competitor.id]; return <div key={competitor.id} className={`flex items-start gap-2 border-b border-gray-100 px-5 py-3 text-sm last:border-b-0 dark:border-gray-800 ${index === 0 ? "bg-emerald-50/30 dark:bg-emerald-950/10" : ""}`}><span role="img" aria-label={cellLabel(cell.mark, cell.note)} aria-hidden="false">{MARKS[cell.mark]}</span><span className="font-medium text-gray-900 dark:text-gray-100">{competitor.featureName ?? competitor.displayName}:</span><span className="text-gray-600 dark:text-gray-400">{MARKS_LABEL[cell.mark]}{cell.note ? ` — ${cell.note}` : ""}</span></div>; })}
    </div>)}</div>
    <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 font-mono text-xs text-gray-500 dark:text-gray-400" aria-label="Comparison legend">{(Object.keys(MARKS_LABEL) as Mark[]).map((mark) => <span key={mark}><span aria-hidden="true">{MARKS[mark]}</span> {MARKS_LABEL[mark]}</span>)}<span>Last reviewed: August 2026</span></div>
  </div>;
}
