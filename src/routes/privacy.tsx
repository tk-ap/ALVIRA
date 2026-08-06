import { createFileRoute } from "@tanstack/react-router";
import { Header } from "~/components/Header";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [{ title: "Privacy Policy — ALVIRA" }, { name: "description", content: "How ALVIRA collects, uses, and protects your information." }],
  }),
  component: Privacy,
});

function Privacy() {
  return <Policy title="Privacy Policy">
    <h2>What we collect</h2>
    <p>We collect your email address, password (stored in hashed form), interview answers, knowledge profiles, and documents you upload. Uploaded documents are processed for extraction and are not retained after extraction. We do not collect payment information; Stripe handles payment processing.</p>

    <h2>How we use your data</h2>
    <p>We use your data to provide the ALVIRA service, including interviews, knowledge compilation, and profile management; to authenticate you; to save and restore your interview progress; and to communicate service updates. We do not use your data to train AI models.</p>

    <h2>Documents you upload</h2>
    <p>Uploaded files are processed in memory to extract knowledge claims and are not stored after extraction completes. Extracted claims are presented for your review. Only claims you approve enter your interview state.</p>

    <h2>Third-party services</h2>
    <p>We use OpenAI for interview question generation and document extraction, so your answers and document text are sent to their API. We use Stripe for payment processing; Stripe receives your payment details, not ALVIRA. OpenAI and Stripe are covered by their own privacy policies.</p>

    <h2>Data retention</h2>
    <p>Your profile and interview data are stored while your account is active. You can delete your account and all associated data at any time by emailing <a href="mailto:contextforge-18281ce4@ctomail.io">contextforge-18281ce4@ctomail.io</a>. Deletion is permanent.</p>

    <h2>Cookies</h2>
    <p>We use essential session cookies for authentication. We do not use tracking cookies, analytics cookies, or third-party advertising cookies.</p>

    <h2>Your rights</h2>
    <p>You can access, correct, export, or delete your data at any time. You can export your knowledge files from the app, or request full account deletion by emailing <a href="mailto:contextforge-18281ce4@ctomail.io">contextforge-18281ce4@ctomail.io</a>.</p>

    <h2>Children</h2>
    <p>ALVIRA is not intended for users under 13.</p>

    <h2>Policy updates</h2>
    <p>We’ll notify you of material changes by email. Continued use of ALVIRA after changes means you accept the updated policy.</p>

    <h2>Contact</h2>
    <p>Questions about this policy can be sent to <a href="mailto:contextforge-18281ce4@ctomail.io">contextforge-18281ce4@ctomail.io</a>.</p>
  </Policy>;
}

function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="min-h-dvh flex flex-col"><Header /><main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-6 py-16"><p className="font-mono text-xs uppercase tracking-widest text-human">&lt; trust /&gt;</p><h1 className="mt-4 text-4xl font-semibold text-gray-900 dark:text-gray-100">{title}</h1><div className="mt-10 space-y-6 text-base leading-8 text-gray-600 dark:text-gray-400">{children}</div></main><TrustFooter /></div>;
}
