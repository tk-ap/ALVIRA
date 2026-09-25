import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/variants/connect-loop")({
  head: () => ({
    meta: [{ httpEquiv: "refresh", content: "0; url=/bridge/connect/" }],
  }),
  component: () => (
    <main className="mx-auto max-w-xl px-6 py-24">
      <p>
        Archived Connect Loop experiment. Continue to{" "}
        <a className="underline" href="/bridge/connect/">
          Connect ALVIRA
        </a>
        .
      </p>
    </main>
  ),
});
