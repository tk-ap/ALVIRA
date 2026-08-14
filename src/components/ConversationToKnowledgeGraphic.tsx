/** Conversation → structured, portable knowledge. */
export function ConversationToKnowledgeGraphic() {
  const bubbles = [
    { y: 58, w: 150, text: "I value directness" },
    { y: 105, w: 182, text: "Context helps me decide" },
    { y: 152, w: 136, text: "I protect focus time" },
    { y: 199, w: 168, text: "Ask me what matters" },
  ];
  const files = ["identity.md", "decisions.md", "style.md"];
  return (
    <svg
      viewBox="0 0 560 300"
      className="h-auto w-full overflow-visible"
      role="img"
      aria-label="A conversation transforms into structured knowledge files: identity.md, decisions.md, and style.md."
    >
      <style>{`@media (prefers-reduced-motion: no-preference) { @keyframes ctk-rise { from { opacity:0; transform:translateY(6px) } to { opacity:1; transform:translateY(0) } } @keyframes ctk-draw { to { stroke-dashoffset:0 } } .ctk-fade { opacity:0; animation:ctk-rise .65s cubic-bezier(.22,1,.36,1) both } .ctk-line { stroke-dasharray:1; stroke-dashoffset:1; animation:ctk-draw 1s ease both } }`}</style>
      <defs>
        <pattern
          id="ctk-dots"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="1.3" cy="1.3" r=".9" fill="currentColor" />
        </pattern>
      </defs>
      <rect
        width="560"
        height="300"
        fill="url(#ctk-dots)"
        className="text-warm-gray/15"
      />
      <text
        x="24"
        y="28"
        className="font-mono text-warm-gray/70"
        fontSize="8"
        letterSpacing=".16em"
        fill="currentColor"
      >
        HUMAN INPUT
      </text>
      <text
        x="536"
        y="28"
        textAnchor="end"
        className="font-mono text-system/80"
        fontSize="8"
        letterSpacing=".16em"
        fill="currentColor"
      >
        STRUCTURED OUTPUT
      </text>
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
      >
        {bubbles.map((b, i) => (
          <path
            key={b.text}
            d={`M${24 + b.w} ${b.y + 15} C 220 ${b.y + 15}, 260 145, 315 145`}
            pathLength="1"
            className="ctk-line text-human/45"
            style={{ animationDelay: `${0.55 + i * 0.08}s` }}
          />
        ))}
        <path
          d="M270 145 H342"
          pathLength="1"
          className="ctk-line text-system/70"
          style={{ animationDelay: ".8s" }}
        />
      </g>
      {bubbles.map((b, i) => (
        <g
          key={b.text}
          className="ctk-fade"
          style={{ animationDelay: `${0.15 + i * 0.1}s` }}
        >
          <rect
            x="24"
            y={b.y}
            width={b.w}
            height="30"
            rx="4"
            fill="var(--color-human)"
            fillOpacity=".12"
            stroke="var(--color-human)"
            strokeOpacity=".65"
          />
          <circle cx="35" cy={b.y + 15} r="2" fill="var(--color-human)" />
          <text
            x="44"
            y={b.y + 15}
            dominantBaseline="central"
            className="font-display italic"
            fontSize="12"
            fill="var(--color-human-dark)"
          >
            {b.text}
          </text>
        </g>
      ))}
      <g className="ctk-fade" style={{ animationDelay: ".65s" }}>
        <circle
          cx="292"
          cy="145"
          r="24"
          fill="var(--color-ink-light)"
          stroke="var(--color-system)"
          strokeOpacity=".7"
        />
        <path
          d="M281 145h21m-7-7 7 7-7 7"
          fill="none"
          stroke="var(--color-system)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="292"
          y="184"
          textAnchor="middle"
          className="font-mono text-system"
          fontSize="7"
          letterSpacing=".12em"
          fill="currentColor"
        >
          COMPILE
        </text>
      </g>
      {files.map((file, i) => {
        const y = 65 + i * 57;
        return (
          <g
            key={file}
            className="ctk-fade"
            style={{ animationDelay: `${0.8 + i * 0.1}s` }}
          >
            <path
              d={`M365 ${y}h104l16 16v27H365z`}
              fill="var(--color-system)"
              fillOpacity=".13"
              stroke="var(--color-system)"
              strokeOpacity=".8"
            />
            <path
              d={`M469 ${y}v16h16`}
              fill="none"
              stroke="var(--color-system)"
              strokeOpacity=".8"
            />
            <circle cx="378" cy={y + 21} r="3" fill="var(--color-system)" />
            <text
              x="389"
              y={y + 24}
              className="font-mono"
              fontSize="11"
              fill="var(--color-system-dark)"
            >
              {file}
            </text>
            <path
              d={`M378 ${y + 34}h83`}
              stroke="var(--color-system)"
              strokeOpacity=".35"
            />
          </g>
        );
      })}
      <text
        x="280"
        y="284"
        textAnchor="middle"
        className="ctk-fade font-mono"
        fontSize="8"
        letterSpacing=".18em"
        fill="var(--color-warm-gray)"
        fillOpacity=".65"
        style={{ animationDelay: "1.2s" }}
      >
        INTERVIEW → COMPILE → KNOWLEDGE FILES
      </text>
    </svg>
  );
}
