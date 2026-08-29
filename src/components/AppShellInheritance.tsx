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

function routeKey(pathname: string) {
  const match = APP_SHELL_ROUTES.find((route) => pathname === route || pathname.startsWith(`${route}/`));
  return match?.slice(1) || "";
}

export function AppShellInheritance() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  useEffect(() => {
    const root = document.documentElement;
    const normalizedPath = pathname.replace(/\/+$/, "") || "/";

    if (isAppShellPath(normalizedPath)) {
      root.dataset.alviraAppShell = "true";
      root.dataset.alviraRoute = routeKey(normalizedPath);
    } else {
      delete root.dataset.alviraAppShell;
      delete root.dataset.alviraRoute;
    }

    return () => {
      delete root.dataset.alviraAppShell;
      delete root.dataset.alviraRoute;
    };
  }, [pathname]);

  return null;
}
