/** A living profile shown as a maintained sequence of versions. */
export function VersionHistoryGraphic() {
  const versions = [
    { date: "JAN 12 2025", version: "v1.0", note: "foundation captured" },
    { date: "MAR 04 2025", version: "v1.1", note: "work style clarified" },
    { date: "JUN 18 2025", version: "v1.2", note: "new priorities added" },
    { date: "NOW", version: "v1.3", note: "ready for what's next" },
  ];
  return <svg viewBox="0 0 560 250" className="h-auto w-full overflow-visible" role="img" aria-label="Version history timeline showing four continuously maintained AI profile versions from January 2025 to now.">
    <style>{`@media (prefers-reduced-motion: no-preference) { @keyframes vh-rise { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:translateY(0) } } @keyframes vh-draw { to { stroke-dashoffset:0 } } .vh-fade { opacity:0; animation:vh-rise .65s cubic-bezier(.22,1,.36,1) both } .vh-line { stroke-dasharray:1; stroke-dashoffset:1; animation:vh-draw 1.2s ease both } }`}</style>
    <defs><pattern id="vh-dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1.3" cy="1.3" r=".9" fill="currentColor" /></pattern></defs>
    <rect width="560" height="250" fill="url(#vh-dots)" className="text-warm-gray/15" />
    <text x="24" y="28" className="font-mono text-warm-gray/70" fontSize="8" letterSpacing=".16em" fill="currentColor">PROFILE EVOLUTION</text>
    <path d="M68 103 H492" pathLength="1" className="vh-line text-warm-gray/45" fill="none" stroke="currentColor" strokeWidth="1" style={{ animationDelay: ".3s" }} />
    <path d="M68 103 C180 103 210 121 294 103 S410 88 492 103" pathLength="1" className="vh-line text-system/60" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 5" style={{ animationDelay: ".55s" }} />
    {versions.map((item, i) => { const x = 68 + i * 141.3; const current = i === versions.length - 1; return <g key={item.version} className="vh-fade" style={{ animationDelay: `${.25 + i * .15}s` }}><circle cx={x} cy="103" r={current ? 8 : 6} fill={current ? "var(--color-system)" : "var(--color-ink-light)"} stroke={current ? "var(--color-system-dark)" : "var(--color-warm-gray)"} strokeWidth="1.2" /><circle cx={x} cy="103" r="2" fill={current ? "var(--color-ink-light)" : "var(--color-warm-gray)"} /><text x={x} y="72" textAnchor="middle" className="font-mono" fontSize="10" fill={current ? "var(--color-system)" : "var(--color-warm-gray)"}>{item.version}</text><text x={x} y="139" textAnchor="middle" className="font-mono" fontSize="8" fill="var(--color-warm-gray)">{item.date}</text><text x={x} y="158" textAnchor="middle" className="font-display italic" fontSize="12" fill="currentColor">{item.note}</text></g> })}
    <g className="vh-fade" style={{ animationDelay: "1.05s" }}><path d="M492 65v-18h20" fill="none" stroke="var(--color-system)" strokeWidth="1" /><text x="520" y="45" className="font-mono" fontSize="8" fill="var(--color-system)">CURRENT</text></g>
    <text x="280" y="228" textAnchor="middle" className="vh-fade font-mono" fontSize="8" letterSpacing=".18em" fill="var(--color-warm-gray)" fillOpacity=".65" style={{ animationDelay: "1.2s" }}>VERSION HISTORY · CONTINUOUSLY MAINTAINED</text>
  </svg>;
}
