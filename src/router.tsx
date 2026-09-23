import { createRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    // Sandbox variants are served under a sub-path (see vite.sandbox.config.ts).
    // "/" in production, so this is a no-op there.
    basepath: import.meta.env.BASE_URL.replace(/\/$/, "") || undefined,
    defaultPreload: "intent",
    scrollRestoration: true,
    defaultNotFoundComponent: () => <p>Not found</p>,
  });
}
