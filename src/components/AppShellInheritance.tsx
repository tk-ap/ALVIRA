import { useEffect } from "react";

const APP_SHELL_ROUTES = [
  "/app",
  "/context",
  "/dashboard",
  "/interview",
  "/meos",
  "/account",
  "/data",
  "/bridge",
] as const;

function isAppShellPath(pathname: string) {
  return APP_SHELL_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

export function AppShellInheritance() {
  useEffect(() => {
    const root = document.documentElement;

    const sync = () => {
      const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
      if (isAppShellPath(pathname)) {
        root.dataset.alviraAppShell = "true";
      } else {
        delete root.dataset.alviraAppShell;
      }
    };

    sync();
    window.addEventListener("popstate", sync);

    return () => {
      window.removeEventListener("popstate", sync);
      delete root.dataset.alviraAppShell;
    };
  }, []);

  return null;
}
