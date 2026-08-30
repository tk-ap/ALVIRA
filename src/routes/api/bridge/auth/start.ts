import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/bridge/auth/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const callback = `${url.origin}/api/bridge/auth/callback`;
        const connect = new URL("/bridge/connect", url.origin);
        connect.searchParams.set("return_to", callback);
        return Response.redirect(connect, 302);
      },
    },
  },
});
