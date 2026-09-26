import { Header } from "~/components/Header";
import type { ReactNode } from "react";

function SandboxFrame({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh bg-[#0b0e0e] text-[#f4f0e9]">
      <Header />
      <main id="main-content" className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">
          {eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
          {title}
        </h1>
        {children}
      </main>
    </div>
  );
}

export function StaticAppSandbox() {
  return (
    <SandboxFrame
      eyebrow="Static Context sandbox"
      title="What would you like AI to help you with?"
    >
      <p className="mt-7 max-w-3xl text-lg leading-8 text-[#b8ada1]">
        Start with what matters. The real ALVIRA app turns your answers into a
        reviewable Context and keeps it current with your permission.
      </p>
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {[
          "Make a decision",
          "Write something that sounds like you",
          "Plan a project or transition",
          "Organize useful background",
        ].map((need) => (
          <article
            key={need}
            className="border border-white/10 bg-white/[0.025] p-5"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-system">
              Starting point
            </p>
            <h2 className="mt-3 text-xl font-medium">{need}</h2>
          </article>
        ))}
      </div>
      <p className="mt-10 border border-system/35 bg-system/10 p-5 text-sm leading-7 text-[#e8e1d9]">
        This is a static product view. It does not sign you in, collect an
        answer, create a profile, or save Context. Those actions remain in the
        server-backed ALVIRA application.
      </p>
    </SandboxFrame>
  );
}

export function StaticConnectSandbox() {
  return (
    <SandboxFrame
      eyebrow="Static Connect sandbox"
      title="Carry approved Context where it helps."
    >
      <p className="mt-7 max-w-3xl text-lg leading-8 text-[#b8ada1]">
        ALVIRA Bridge is a controlled delivery capability inside ALVIRA. A
        connection can read only the Context a person approves; it never grants
        an external tool permission to act.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <section className="border border-white/10 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-system">
            01 / Review
          </p>
          <h2 className="mt-3 text-2xl font-medium">Choose the Context.</h2>
          <p className="mt-3 text-sm leading-7 text-[#b8ada1]">
            The real Bridge asks the signed-in person to select the approved
            Context and see exactly what a compatible client may read.
          </p>
        </section>
        <section className="border border-white/10 p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-system">
            02 / Control
          </p>
          <h2 className="mt-3 text-2xl font-medium">Authorize or withhold.</h2>
          <p className="mt-3 text-sm leading-7 text-[#b8ada1]">
            OAuth, MCP discovery, tokens, connections, and revocation require
            the real server-backed Bridge. None are simulated here.
          </p>
        </section>
      </div>
      <p className="mt-10 border border-system/35 bg-system/10 p-5 text-sm leading-7 text-[#e8e1d9]">
        No connection address is copied, no authorization starts, and no
        external client receives Context from this static sandbox.
      </p>
    </SandboxFrame>
  );
}

export function StaticReflectSandbox() {
  return (
    <SandboxFrame
      eyebrow="Static Reflect sandbox"
      title="Return to what ALVIRA understands."
    >
      <p className="mt-7 max-w-3xl text-lg leading-8 text-[#b8ada1]">
        Reflect is the private place to revisit, validate, correct, and evolve a
        living Context as life changes.
      </p>
      <ol className="mt-10 grid gap-4 sm:grid-cols-3">
        {[
          ["01", "Notice", "See what is established, uncertain, or changing."],
          [
            "02",
            "Review",
            "Confirm or correct the understanding in your own words.",
          ],
          [
            "03",
            "Carry forward",
            "Choose what remains useful for future help.",
          ],
        ].map(([number, label, copy]) => (
          <li key={number} className="border border-white/10 p-5">
            <p className="font-mono text-xs text-system">{number}</p>
            <h2 className="mt-6 text-xl font-medium">{label}</h2>
            <p className="mt-3 text-sm leading-7 text-[#b8ada1]">{copy}</p>
          </li>
        ))}
      </ol>
      <p className="mt-10 border border-system/35 bg-system/10 p-5 text-sm leading-7 text-[#e8e1d9]">
        This static view does not load a profile, reveal account data, or save
        corrections. The authenticated Reflect experience remains server-backed.
      </p>
    </SandboxFrame>
  );
}
