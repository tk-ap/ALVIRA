const explore = [
  ["Context", "/context"],
  ["Context example", "/context-example"],
  ["Use elsewhere", "/integrations"],
  ["For organizations", "/partners"],
] as const;

const product = [
  ["Start with ALVIRA", "/app"],
  ["Pricing", "/pricing"],
  ["Founding Beta", "/founding-beta"],
  ["Sign in", "/login"],
] as const;

const trust = [
  ["Privacy", "/privacy"],
  ["Terms", "/terms"],
  ["Refunds", "/refunds"],
  ["Support", "/support"],
  ["Data", "/data"],
] as const;

export function TrustFooter() {
  return (
    <footer className="immersive-footer" aria-label="ALVIRA site footer">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
        <div className="immersive-footer__grid">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-system">Context Intelligence</p>
            <p className="immersive-footer__statement mt-4">Keep the understanding on your side.</p>
          </div>

          <div>
            <p className="immersive-footer__label">Explore</p>
            <nav className="immersive-footer__links" aria-label="Explore ALVIRA">
              {explore.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
            </nav>
          </div>

          <div>
            <p className="immersive-footer__label">Product</p>
            <nav className="immersive-footer__links" aria-label="ALVIRA product links">
              {product.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
            </nav>
          </div>

          <div>
            <p className="immersive-footer__label">Trust</p>
            <nav className="immersive-footer__links" aria-label="Trust and legal links">
              {trust.map(([label, href]) => <a key={href} href={href}>{label}</a>)}
            </nav>
          </div>
        </div>

        <div className="immersive-footer__bottom">
          <span>© 2026 ALVIRA</span>
          <span>Immersive prototype · production untouched</span>
        </div>
      </div>
    </footer>
  );
}
