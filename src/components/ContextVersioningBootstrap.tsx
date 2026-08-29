import { useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { ensureContextVersioning } from "~/routes/-contextVersions";

export function ContextVersioningBootstrap() {
  const location = useLocation();
  useEffect(() => {
    ensureContextVersioning().catch((error) => {
      console.warn("[context-versioning] bootstrap failed", error instanceof Error ? error.message : "unknown error");
    });
  }, [location.pathname]);
  return null;
}
