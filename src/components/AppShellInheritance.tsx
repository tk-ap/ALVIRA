import { useRouterState } from "@tanstack/react-router";
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
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const root = document.documentElement;
    const normalizedPath = pathname.replace(/\/+$/, "") || "/";

    if (isAppShellPath(normalizedPath)) {
      root.dataset.alviraAppShell = "true";
    } else {
      delete root.dataset.alviraAppShell;
    }

    return () => {
      delete root.dataset.alviraAppShell;
    };
  }, [pathname]);

  return null;
}
