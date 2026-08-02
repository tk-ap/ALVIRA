/** One ALVIRA knowledge source connected to every AI tool. */
export function PortabilityGraphic() {
  const tools = [{ label: "ChatGPT", x: 280, y: 46 }, { label: "Claude", x: 466, y: 108 }, { label: "Gemini", x: 420, y: 227 }, { label: "Cursor", x: 140, y: 227 }, { label: "Your Stack", x: 94, y: 108 }];
  return <svg viewBox="0 0 560 300" className="h-auto w-full overflow-visible" role="img" aria-label="ALVIRA knowledge files connect to ChatGPT, Claude, Gemini, Cursor, and your stack.">
    <style>{`@media (prefers-reduced-motion: no-preference) { @keyframes pg-rise { from { opacity:0; transform:translateY(5px) } to { opacity:1; transform:translateY(0) } } @keyframes pg-draw { to { stroke-dashoffset:0 } } .pg-fade { opacity:0; animation:pg-rise .65s cubic-bezier(.22,1,.36,1) both } .pg-line { stroke-dasharray:1; stroke-dashoffset:1; animation:pg-draw 1.1s ease both } }`}</style>
    <defs><pattern id="pg-dots" width="26" height="26" patternUnits="userSpaceOnUse"><circle cx="1.3" cy="1.3" r=".9" fill="currentColor" /></pattern></defs>
    <rect width="560" height="300" fill="url(#pg-dots)" className="text-warm-gray/15" />
    <text x="24" y="28" className="font-mono text-warm-gray/70" fontSize="8" letterSpacing=".16em" fill="currentColor">PORTABLE BY DESIGN</text>
    <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">{tools.map((tool, i) => <path key={tool.label} d={`M280 150 L${tool.x} ${tool.y}`} pathLength="1" className="pg-line text-system/45" style={{ animationDelay: `${.35 + i * .1}s` }} />)}</g>
    <g className="pg-fade" style={{ animationDelay: ".3s" }}><circle cx="280" cy="150" r="48" fill="var(--color-system)" fillOpacity=".12" stroke="var(--color-system)" strokeWidth="1.2" /><path d="M264 139h32v25h-32zM270 134h20v5h-20zM272 146h16m-16 6h12" fill="none" stroke="var(--color-system)" strokeWidth="1.2" strokeLinecap="round" /><text x="280" y="180" textAnchor="middle" className="font-mono" fontSize="8" letterSpacing=".1em" fill="var(--color-system)">ALVIRA FILES</text></g>
    {tools.map((tool, i) => <g key={tool.label} className="pg-fade" style={{ animationDelay: `${.55 + i * .12}s` }}><circle cx={tool.x} cy={tool.y} r="25" fill="var(--color-ink-light)" stroke="var(--color-system)" strokeOpacity=".65" /><circle cx={tool.x} cy={tool.y} r="20" fill="none" stroke="var(--color-warm-gray)" strokeOpacity=".25" strokeDasharray="2 4" /><text x={tool.x} y={tool.y + 3} textAnchor="middle" className="font-mono" fontSize="9" fill="currentColor">{tool.label}</text></g>)}
    <text x="280" y="284" textAnchor="middle" className="pg-fade font-mono" fontSize="8" letterSpacing=".18em" fill="var(--color-warm-gray)" fillOpacity=".65" style={{ animationDelay: "1.3s" }}>ONE PROFILE · EVERY AI TOOL</text>
  </svg>;
}
