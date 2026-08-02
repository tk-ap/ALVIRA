/**
 * HeroGraphic — "Living Context Map"
 *
 * A signature hero illustration for the ALVIRA homepage. It reads like a
 * hybrid of a system diagram and a constellation: human statement fragments
 * (serif, warm) feed fine 1px connector lines into knowledge domain nodes
 * (mono, precise). Some domains are resolved (solid system fill); others stay
 * dashed and light to suggest ongoing discovery.
 *
 * Theme-aware: everything is drawn with `currentColor` and CSS variables from
 * the design tokens, so it works on both ink-light and ink backgrounds without
 * explicit dark: variants.
 *
 * Motion is opt-in via `prefers-reduced-motion: no-preference` — with reduced
 * motion enabled, the graphic renders fully static and visible.
 */

const FRAGMENTS: Array<{
  id: string;
  text: string;
  x: number;
  y: number;
  anchor: "start" | "middle" | "end";
  size: number;
  tone: string;
  pulse?: boolean;
}> = [
  { id: "f1", text: "I need context before I commit", x: 20, y: 46, anchor: "start", size: 12, tone: "text-warm-gray/85" },
  { id: "f2", text: "I value directness", x: 540, y: 46, anchor: "end", size: 13, tone: "text-warm-gray/85" },
  { id: "f3", text: "My priorities shift with responsibility", x: 16, y: 160, anchor: "start", size: 11, tone: "text-warm-gray/85" },
  { id: "f4", text: "I do my best work with clear expectations", x: 544, y: 168, anchor: "end", size: 11.5, tone: "text-warm-gray/85" },
  { id: "f5", text: "I am still learning what belongs here", x: 280, y: 329, anchor: "middle", size: 12, tone: "text-human/85", pulse: true },
];

const DOMAINS: Array<{
  id: string;
  label: string;
  cx: number;
  cy: number;
  rx: number;
  resolved: boolean;
}> = [
  { id: "d1", label: "How I communicate", cx: 148, cy: 118, rx: 65, resolved: true },
  { id: "d2", label: "What I protect", cx: 424, cy: 118, rx: 59, resolved: true },
  { id: "d3", label: "How I decide", cx: 280, cy: 198, rx: 50, resolved: true },
  { id: "d4", label: "What gives me energy", cx: 140, cy: 268, rx: 74, resolved: true },
  { id: "d5", label: "Where I need structure", cx: 352, cy: 74, rx: 80, resolved: false },
  { id: "d6", label: "What I am becoming", cx: 424, cy: 268, rx: 71, resolved: false },
];

/** Connector lines — fine 1px strokes, slightly bowed for an organic feel. */
const LINES: Array<{ d: string; dashed?: boolean }> = [
  // fragments → domains
  { d: "M154 46 Q 268 40 352 74", dashed: true }, // f1 → where I need structure
  { d: "M154 46 Q 240 122 280 198" }, // f1 → how I decide
  { d: "M461 46 Q 250 140 148 118" }, // f2 → how I communicate
  { d: "M461 46 Q 430 170 280 198" }, // f2 → how I decide
  { d: "M167 160 Q 320 120 424 118" }, // f3 → what I protect
  { d: "M167 160 Q 246 184 280 198" }, // f3 → how I decide
  { d: "M377 168 Q 330 116 352 74", dashed: true }, // f4 → where I need structure
  { d: "M377 168 Q 236 182 148 118" }, // f4 → how I communicate
  { d: "M280 340 Q 196 306 140 268" }, // f5 → what gives me energy
  { d: "M280 340 Q 352 308 424 268", dashed: true }, // f5 → what I am becoming
  // domain → domain (the knowledge graph itself)
  { d: "M352 74 Q 250 86 148 118", dashed: true }, // structure → communicate (in progress)
  { d: "M148 118 Q 214 146 280 198" }, // communicate → decide
  { d: "M280 198 Q 352 172 424 118" }, // decide → protect
  { d: "M424 118 Q 442 192 424 268", dashed: true }, // protect → becoming (in progress)
  { d: "M140 268 Q 210 238 280 198" }, // energy → decide
  { d: "M140 268 Q 282 252 424 268", dashed: true }, // energy → becoming (in progress)
];

export function HeroGraphic() {
  return (
    <svg
      viewBox="0 0 560 360"
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label="Living context map. Personal statements — I need context before I commit, I value directness, my priorities shift with responsibility, I do my best work with clear expectations, I am still learning what belongs here — connect into knowledge domains: how I communicate, what I protect, how I decide, and what gives me energy are resolved; where I need structure and what I am becoming are still in progress."
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes hcm-rise {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes hcm-draw {
            to { stroke-dashoffset: 0; }
          }
          @keyframes hcm-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.55; }
          }
          .hcm-fade {
            opacity: 0;
            animation: hcm-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
          .hcm-fade-pulse {
            opacity: 0;
            animation:
              hcm-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both,
              hcm-pulse 4.5s ease-in-out 2.6s infinite;
          }
          .hcm-line {
            stroke-dasharray: 1;
            stroke-dashoffset: 1;
            animation: hcm-draw 1.1s cubic-bezier(0.4, 0, 0.2, 1) both;
          }
          .hcm-pulse {
            animation: hcm-pulse 4.5s ease-in-out 2.6s infinite;
          }
        }
      `}</style>

      <defs>
        <pattern id="hcm-dotgrid" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.3" cy="1.3" r="0.9" fill="currentColor" />
        </pattern>
      </defs>

      {/* Fine measurement grid — almost imperceptible */}
      <g className="text-warm-gray/20">
        <rect width="560" height="360" fill="url(#hcm-dotgrid)" />
      </g>

      {/* Connecting lines (drawn beneath nodes so fills mask their endpoints) */}
      <g fill="none" strokeWidth={1} strokeLinecap="round">
        {LINES.map((line, i) => (
          <path
            key={line.d}
            d={line.d}
            pathLength={1}
            stroke="currentColor"
            className={
              line.dashed
                ? `hcm-fade text-warm-gray/30`
                : `hcm-line text-warm-gray/35`
            }
            style={
              line.dashed
                ? { animationDelay: `${0.45 + i * 0.05}s` }
                : { animationDelay: `${0.4 + i * 0.05}s` }
            }
            strokeDasharray={line.dashed ? "4 7" : undefined}
          />
        ))}
      </g>

      {/* Knowledge domain nodes */}
      {DOMAINS.map((domain, i) => {
        const pending = !domain.resolved;
        return (
          <g key={domain.id} className={`hcm-fade`} style={{ animationDelay: `${0.3 + i * 0.08}s` }}>
            {pending ? (
              <g className={`hcm-pulse text-warm-gray/40`}>
                <ellipse
                  cx={domain.cx}
                  cy={domain.cy}
                  rx={domain.rx}
                  ry={19}
                  fill="var(--color-warm-gray)"
                  fillOpacity={0.05}
                  stroke="currentColor"
                  strokeWidth={1}
                  strokeDasharray="4 6"
                />
                <text
                  x={domain.cx}
                  y={domain.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-mono"
                  fontSize={10}
                  fontWeight={500}
                  letterSpacing="0.04em"
                  fill="currentColor"
                >
                  {domain.label}
                </text>
              </g>
            ) : (
              <>
                <ellipse
                  cx={domain.cx}
                  cy={domain.cy}
                  rx={domain.rx}
                  ry={19}
                  fill="var(--color-system)"
                  stroke="var(--color-system-dark)"
                  strokeOpacity={0.35}
                  strokeWidth={1}
                />
                <text
                  x={domain.cx}
                  y={domain.cy}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="font-mono"
                  fontSize={10}
                  fontWeight={500}
                  letterSpacing="0.04em"
                  fill="var(--color-ink-light)"
                >
                  {domain.label}
                </text>
                {/* small confirmation tick inside resolved nodes */}
                <path
                  d={`M ${domain.cx + domain.rx - 12} ${domain.cy} l 3.4 3.4 l 7 -7.4`}
                  fill="none"
                  stroke="var(--color-ink-light)"
                  strokeOpacity={0.7}
                  strokeWidth={1.1}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </>
            )}
          </g>
        );
      })}

      {/* Human statement fragments */}
      {FRAGMENTS.map((fragment, i) => (
        <text
          key={fragment.id}
          x={fragment.x}
          y={fragment.y}
          textAnchor={fragment.anchor}
          dominantBaseline="central"
          className={`font-display italic ${fragment.tone} ${fragment.pulse ? "hcm-fade-pulse" : "hcm-fade"}`}
          fontSize={fragment.size}
          fill="currentColor"
          style={{ animationDelay: `${0.15 + i * 0.09}s` }}
        >
          {fragment.text}
        </text>
      ))}

      {/* Technical caption */}
      <text
        x={280}
        y={354}
        textAnchor="middle"
        className="hcm-fade font-mono"
        fontSize={8}
        letterSpacing="0.18em"
        fill="var(--color-warm-gray)"
        fillOpacity={0.55}
        style={{ animationDelay: "1.35s" }}
      >
        LIVING CONTEXT MAP · 4 OF 6 DOMAINS RESOLVED
      </text>
    </svg>
  );
}
