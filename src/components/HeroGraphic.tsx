/**
 * HeroGraphic — "Human Words → Structured Knowledge"
 *
 * A clean, editorial hero illustration for the ALVIRA homepage. Personal
 * statements in warm Instrument Serif italic sit on the left; a single
 * dotted rule separates them from three resolved knowledge files (mono
 * labels, system-teal fills) on the right. No connector lines, no diagram
 * language — the two columns simply face each other and read as a
 * transformation: human words in, structured knowledge out.
 *
 * Theme-aware: everything is drawn with `currentColor` and CSS variables
 * from the design tokens, so it works on both ink-light and ink backgrounds
 * without explicit dark: variants.
 *
 * Motion is opt-in via `prefers-reduced-motion: no-preference` — with
 * reduced motion enabled, the graphic renders fully static and visible.
 */

const FRAGMENTS: Array<{ id: string; text: string; y: number; size: number }> =
  [
    { id: "f1", text: "I need context before I commit", y: 112, size: 19 },
    { id: "f2", text: "I value directness over ceremony", y: 162, size: 16.5 },
    { id: "f3", text: "My best work happens", y: 212, size: 16.5 },
    { id: "f4", text: "with clear expectations", y: 241, size: 16.5 },
  ];

const FILES: Array<{ id: string; label: string; y: number }> = [
  { id: "c1", label: "communication.md", y: 120 },
  { id: "c2", label: "decisions.md", y: 178 },
  { id: "c3", label: "boundaries.md", y: 236 },
];

const FILE_X = 336;
const FILE_W = 194;
const FILE_H = 40;
const RULE_X = 314;

export function HeroGraphic() {
  return (
    <svg
      viewBox="0 0 560 360"
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label="Human words become structured knowledge. Personal statements on the left — I need context before I commit, I value directness over ceremony, my best work happens with clear expectations — transform into resolved knowledge files on the right: communication dot m d, decisions dot m d, and boundaries dot m d."
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          @keyframes hg-rise {
            from { opacity: 0; transform: translateY(6px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .hg-fade {
            opacity: 0;
            animation: hg-rise 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
          }
        }
      `}</style>

      <defs>
        <pattern
          id="hg-dotgrid"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1.3" cy="1.3" r="0.9" fill="currentColor" />
        </pattern>
        <linearGradient id="hg-rule-fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset="0.5" stopColor="currentColor" stopOpacity="1" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Dot-grid backdrop */}
      <g className="text-warm-gray/20">
        <rect width="560" height="360" fill="url(#hg-dotgrid)" />
      </g>

      {/* Human statement fragments — warm serif, left */}
      <g className="text-warm-gray">
        {FRAGMENTS.map((fragment, i) => (
          <text
            key={fragment.id}
            x={30}
            y={fragment.y}
            className="hg-fade font-display italic"
            fontSize={fragment.size}
            fill="currentColor"
            fillOpacity={0.9}
            style={{ animationDelay: `${0.1 + i * 0.1}s` }}
          >
            {fragment.text}
          </text>
        ))}
      </g>

      {/* Transformation rule — dotted divider, fading at both ends */}
      <g className="text-warm-gray/45">
        <line
          x1={RULE_X}
          y1={62}
          x2={RULE_X}
          y2={298}
          className="hg-fade"
          stroke="url(#hg-rule-fade)"
          strokeWidth={1.3}
          strokeLinecap="round"
          strokeDasharray="1 6.5"
          style={{ animationDelay: "0.5s" }}
        />
      </g>

      {/* Structured knowledge files — system teal, right */}
      {FILES.map((file, i) => (
        <g
          key={file.id}
          className="hg-fade"
          style={{ animationDelay: `${0.6 + i * 0.12}s` }}
        >
          <rect
            x={FILE_X}
            y={file.y}
            width={FILE_W}
            height={FILE_H}
            rx={7}
            fill="var(--color-system)"
            stroke="var(--color-system-dark)"
            strokeOpacity={0.35}
            strokeWidth={1}
          />
          <text
            x={FILE_X + 18}
            y={file.y + FILE_H / 2}
            dominantBaseline="central"
            className="font-mono"
            fontSize={11.5}
            fontWeight={500}
            letterSpacing="0.02em"
            fill="var(--color-ink-light)"
          >
            {file.label}
          </text>
          {/* resolved check */}
          <path
            d={`M ${FILE_X + FILE_W - 34} ${file.y + FILE_H / 2} l 3.6 3.6 l 7.5 -8`}
            fill="none"
            stroke="var(--color-ink-light)"
            strokeOpacity={0.85}
            strokeWidth={1.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      ))}
    </svg>
  );
}
