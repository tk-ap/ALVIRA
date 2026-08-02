// ── Shared Header with auth state and theme toggle ──
import { useEffect, useState } from "react";
import { getCurrentUser, logout } from "~/routes/-auth";
import { ThemeToggle } from "~/routes/__root";

interface UserInfo {
  id: string;
  email: string;
  tier: string;
  interviewCount: number;
}

const linkClass =
  "text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors";
const mobileLinkClass = `${linkClass} flex min-h-11 items-center border-b border-gray-200 dark:border-gray-800`;

export function Header() {
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined); // undefined = loading
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      document.cookie = "alvira_session=; path=/; max-age=0; SameSite=Lax";
      await logout();
      setUser(null);
    } catch {
      setUser(null);
    } finally {
      setLoggingOut(false);
    }
  };

  const closeMenu = () => setMenuOpen(false);
  const mobileCtaHref = user ? "/dashboard" : "/signup";
  const mobileCtaLabel = user ? "Dashboard" : "Get Started";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/90">
      <div className="mx-auto max-w-4xl px-6 py-3">
        <div className="flex items-center justify-between">
          <a
            href="/"
            className="font-mono tracking-tight font-bold text-lg text-gray-900 dark:text-gray-100"
          >
            ALVIRA
          </a>

          {/* Desktop navigation retains the existing horizontal layout. */}
          <div className="hidden items-center gap-5 md:flex">
            <a href="/interview" className={linkClass}>
              Interview
            </a>
            <a href="/pricing" className={linkClass}>
              Pricing
            </a>
            <a href="/why-alvira" className={linkClass}>
              Why ALVIRA
            </a>
            <a href="/meos" className="font-mono text-sm text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 transition-colors">
              MeOS
            </a>
            {user === undefined ? (
              <div className="h-8 w-20 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-5">
                <a href="/dashboard" className={linkClass}>
                  Dashboard
                </a>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className={`${linkClass} min-h-11 disabled:opacity-50`}
                >
                  {loggingOut ? "..." : "Logout"}
                </button>
              </div>
            ) : (
              <a
                href="/login"
                className={`${linkClass} min-h-11 flex items-center`}
              >
                Sign In
              </a>
            )}
            <ThemeToggle />
          </div>

          {/* On small screens, keep one primary action visible and move the rest into the menu. */}
          <div className="flex items-center gap-2 md:hidden">
            <a
              href={mobileCtaHref}
              className="min-h-11 inline-flex items-center px-1 text-sm font-medium text-gray-600 underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-900 dark:text-gray-400 dark:decoration-gray-600 dark:hover:text-gray-100"
            >
              {mobileCtaLabel}
            </a>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-label={
                menuOpen ? "Close navigation menu" : "Open navigation menu"
              }
              aria-controls="mobile-navigation"
              className="flex min-h-11 min-w-11 items-center justify-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100"
            >
              <span className="sr-only">
                {menuOpen ? "Close menu" : "Open menu"}
              </span>
              <span className="flex w-5 flex-col gap-1" aria-hidden="true">
                <span className="h-0.5 w-full bg-current" />
                <span className="h-0.5 w-full bg-current" />
                <span className="h-0.5 w-full bg-current" />
              </span>
            </button>
          </div>
        </div>

        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          role="navigation"
          className={`${menuOpen ? "block" : "hidden"} mt-3 border-t border-gray-200/60 dark:border-gray-800/60 md:hidden`}
        >
          <a href="/interview" onClick={closeMenu} className={mobileLinkClass}>
            Interview
          </a>
          <a href="/pricing" onClick={closeMenu} className={mobileLinkClass}>
            Pricing
          </a>
          <a href="/why-alvira" onClick={closeMenu} className={mobileLinkClass}>
            Why ALVIRA
          </a>
          <a href="/meos" onClick={closeMenu} className={`${mobileLinkClass} text-amber-600 dark:text-amber-400`}>
            MeOS
          </a>
          {user ? (
            <button
              type="button"
              onClick={() => {
                closeMenu();
                void handleLogout();
              }}
              disabled={loggingOut}
              className={`${mobileLinkClass} w-full text-left disabled:opacity-50`}
            >
              {loggingOut ? "Logging out..." : "Logout"}
            </button>
          ) : user === null ? (
            <a href="/login" onClick={closeMenu} className={mobileLinkClass}>
              Sign In
            </a>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
