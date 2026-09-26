import { createFileRoute } from "@tanstack/react-router";
export const Route = createFileRoute("/variants/dossier")({
  head: () => ({ meta: [{ httpEquiv: "refresh", content: "0; url=/meos/" }] }),
  component: () => (
    <main className="mx-auto max-w-xl px-6 py-24">
      <p>
        Archived Dossier experiment. Continue to{" "}
        <a className="underline" href="/meos/">
          ALVIRA Reflect
        </a>
        .
      </p>
    </main>
  ),
});
