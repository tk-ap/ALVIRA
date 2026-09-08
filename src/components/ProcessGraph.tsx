import type { CSSProperties } from "react";

/**
 * ProcessGraph — a labeled node→edge→path map of how a thing works.
 *
 * This is the first ported primitive from the ecosystem visual grammar
 * (see /home/tk/Work/ecosystem-visual-grammar.md). It renders a linear flow of
 * labeled nodes connected by drawn edges, with an optional "highlighted path"
 * that glows to mark the important traversal — the same pattern as Ledgato's
 * authority graph (a map instead of a paragraph).
 *
 * Nodes fade in, edges draw, the highlighted path pulses. Everything freezes
 * to the final state under prefers-reduced-motion.
 */

export interface ProcessGraphNode {
  id: string;
  /** Mono label — the node's name. */
  label: string;
  /** Small mono sublabel — a short clarification of the node's role. */
  sublabel?: string;
}

interface ProcessGraphProps {
  nodes: ProcessGraphNode[];
  /** Node ids to emphasize (glow) — the important path. */
  highlightIds?: string[];
  /** One readable line summarizing the whole path, e.g. "you → interview → context → tool". */
  pathLabel?: string;
  /** Accessible description of what the graph shows. */
  ariaLabel?: string;
}

const glowStyle: CSSProperties = { animation: "pg-glow 2.4s ease-in-out infinite" };

export function ProcessGraph({ nodes, highlightIds = [], pathLabel, ariaLabel }: ProcessGraphProps) {
  return (
    <div role="img" aria-label={ariaLabel ?? pathLabel ?? nodes.map((n) => n.label).join(" to ")}>
      <style>{`
        @keyframes pg-node-in { from { opacity: 0; transform: translateY(4px) } to { opacity: 1; transform: none } }
        @keyframes pg-edge-draw { from { stroke-dashoffset: 1 } to { stroke-dashoffset: 0 } }
        @keyframes pg-glow { 0%, 100% { opacity: .55 } 50% { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) {
          .pg-node, .pg-edge { animation: none !important }
          .pg-glow { animation: none !important }
        }
      `}</style>

      <div className="flex flex-wrap items-center gap-y-4">
        {nodes.map((node, i) => {
          const highlighted = highlightIds.includes(node.id);
          return (
            <div key={node.id} className="flex items-center">
              <div
                className={`pg-node rounded-lg border px-4 py-3 ${
                  highlighted
                    ? "border-emerald-400 bg-emerald-50 shadow-[0_0_20px_rgba(16,185,129,0.28)] dark:border-emerald-500 dark:bg-emerald-950/30"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                }`}
                style={{ animation: `pg-node-in .5s ${i * 0.12}s cubic-bezier(.22,1,.36,1) both` }}
              >
                <div className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">{node.label}</div>
                {node.sublabel && (
                  <div className="mt-0.5 font-mono text-[10px] leading-relaxed text-gray-500 dark:text-gray-400">{node.sublabel}</div>
                )}
              </div>

              {i < nodes.length - 1 && (
                <svg
                  width="34"
                  height="10"
                  viewBox="0 0 34 10"
                  className={`pg-edge mx-2 shrink-0 ${highlighted ? "pg-glow" : ""}`}
                  aria-hidden="true"
                  style={highlighted ? glowStyle : undefined}
                >
                  <line
                    x1="0"
                    y1="5"
                    x2="26"
                    y2="5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    pathLength={1}
                    className={highlighted ? "text-emerald-500" : "text-gray-400"}
                    style={{ strokeDasharray: 1, animation: `pg-edge-draw .5s ${0.28 + i * 0.12}s ease both` }}
                  />
                  <path d="M26 5 l6 -3.2 v6.4 z" fill="currentColor" className={highlighted ? "text-emerald-500" : "text-gray-400"} />
                </svg>
              )}
            </div>
          );
        })}
      </div>

      {pathLabel && (
        <p className="mt-3 font-mono text-[11px] tracking-wide text-gray-500 dark:text-gray-400">{pathLabel}</p>
      )}
    </div>
  );
}
