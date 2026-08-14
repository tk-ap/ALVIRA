import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";
export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [{ title: "Support — ALVIRA" }, { name: "description", content: "" }],
  }),
  component: Support,
});
function Support() {
  return (
    <Page title="Support">
      <p>
        Need help with your profile, interview, billing, or connector? Email{" "}
        <a href="mailto:contextforge-18281ce4@ctomail.io">
          contextforge-18281ce4@ctomail.io
        </a>
        . We typically respond within two business days, and sooner when
        possible.
      </p>
      <p>
        Documentation and setup guides are coming soon. In the meantime, our
        support team can help you get started and answer questions directly.
      </p>
    </Page>
  );
}
function Page({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main
        id="main-content"
        className="mx-auto w-full max-w-3xl flex-1 px-6 py-16"
      >
        <p className="font-mono text-xs uppercase tracking-widest text-human">
          &lt; trust /&gt;
        </p>
        <h1 className="mt-4 text-4xl font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h1>
        <div className="mt-10 space-y-6 text-base leading-8 text-gray-600 dark:text-gray-400">
          {children}
        </div>
      </main>
      <TrustFooter />
    </div>
  );
}
