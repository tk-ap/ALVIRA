const links = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Refunds", "/refunds"],
  ["Support", "/support"],
  ["Data", "/data"],
] as const;

export function TrustFooter() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800" aria-label="Trust and legal links">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-x-3 gap-y-2 px-6 py-6 font-mono text-xs text-gray-500 dark:text-gray-400">
        <span>© 2026 ALVIRA</span>
        {links.map(([label, href]) => (
          <span key={href} className="flex items-center gap-x-3">
            <span aria-hidden="true">·</span>
            <a href={href} className="underline-offset-4 transition-colors hover:text-gray-900 hover:underline dark:hover:text-gray-100">{label}</a>
          </span>
        ))}
      </div>
    </footer>
  );
}
