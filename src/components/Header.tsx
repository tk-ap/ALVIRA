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

const tierBadgeClass: Record<string, string> = {
  free: "border-gray-400 dark:border-gray-500 text-gray-500 dark:text-gray-400",
  pro: "border-emerald-500 dark:border-emerald-400 text-emerald-600 dark:text-emerald-400",
  lifetime: "border-amber-500 dark:border-amber-400 text-amber-600 dark:text-amber-400",
};

export function Header() {
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined); // undefined = loading
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getCurrentUser().then((u) => {
      if (!cancelled) setUser(u);
    }).catch(() => {
      if (!cancelled) setUser(null);
    });
    return () => { cancelled = true; };
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

  return (
    <header className="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-50">
      <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2.5 font-bold text-lg text-gray-900 dark:text-gray-100 tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-mono font-bold">
            A
          </span>
          <span className="font-mono tracking-tight">ALVIRA</span>
        </a>

        <div className="flex items-center gap-4">
          {user === undefined ? (
            <div className="h-8 w-20 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <span className={`font-mono text-[10px] uppercase tracking-wider border px-1.5 py-0.5 rounded ${tierBadgeClass[user.tier] || tierBadgeClass.free}`}>
                {user.tier}
              </span>
              <span className="font-mono text-sm text-gray-600 dark:text-gray-400 hidden sm:inline">
                {user.email}
              </span>
              <a href="/dashboard" className="font-mono text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Dashboard</a>
              <a href="/account" className="font-mono text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">Account</a>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="font-mono text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors disabled:opacity-50"
              >
                {loggingOut ? "..." : "Logout"}
              </button>
            </div>
          ) : (
            <a
              href="/login"
              className="font-mono text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Sign In
            </a>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
