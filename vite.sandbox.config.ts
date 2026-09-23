// Static-first sandbox build (AgentOS here-now-sandbox contract). Prerenders the
// UI to plain HTML so it can be hosted on here.now. Backend behaviour (database,
// sign-in, API routes) is NOT available in this build. Production still uses
// vite.config.ts and is untouched.
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// SANDBOX_BASE lets a variant be published under a sub-path, e.g. /variants/dossier/.
export default defineConfig({
  base: process.env.SANDBOX_BASE || "/",
  plugins: [
    tailwindcss(),
    tsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      spa: { enabled: true },
      prerender: { enabled: true, crawlLinks: true, autoSubfolderIndex: true, failOnError: false },
    }),
    viteReact(),
  ],
});
