import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/variants/context-portability")({
  head: () => ({
    meta: [{ httpEquiv: "refresh", content: "0; url=/context/" }],
  }),
  component: () => (
    <main className="mx-auto max-w-xl px-6 py-24">
      <p>
        Archived Context Portability experiment. Continue to{" "}
        <a className="underline" href="/context/">
          Context
        </a>
        .
      </p>
    </main>
  ),
});
