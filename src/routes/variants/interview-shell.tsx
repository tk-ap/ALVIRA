import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/variants/interview-shell")({
  head: () => ({
    meta: [{ httpEquiv: "refresh", content: "0; url=/lab/interview/" }],
  }),
  component: LegacyInterviewShellRedirect,
});

function LegacyInterviewShellRedirect() {
  return (
    <main className="mx-auto max-w-xl px-6 py-24">
      <p className="font-mono text-xs uppercase tracking-[0.18em] text-system">
        Legacy Interview Shell route
      </p>
      <h1 className="mt-4 text-3xl font-semibold">Interview Lab moved.</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        This retained link redirects to the canonical static Interview Lab
        sandbox.
      </p>
      <a
        className="mt-8 inline-block text-system underline"
        href="/lab/interview/"
      >
        Continue to /lab/interview/
      </a>
    </main>
  );
}
