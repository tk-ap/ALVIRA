export function DossierOwnershipPositioning({ compact = false }: { compact?: boolean }) {
  return (
    <section id="dossier" className="border-t border-[#191715]/10 bg-[#0d1110] text-[#f4f0e9] dark:border-white/10 dark:bg-[#080b0a]">
      <div className={`mx-auto max-w-7xl px-6 sm:px-8 lg:px-10 ${compact ? "py-14 sm:py-16" : "py-20 sm:py-24"}`}>
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-system">Context ownership</p>
            <h2 className={`${compact ? "mt-4 text-4xl sm:text-5xl" : "mt-5 text-5xl sm:text-6xl"} max-w-xl font-display leading-[0.93] tracking-[-0.035em]`}>
              Your Context should belong to you.
            </h2>
            <p className="mt-6 max-w-lg text-base leading-7 text-white/60">
              The more useful AI becomes, the more it may need to understand about you. That understanding should not disappear when a chat ends — and it should not be trapped inside ALVIRA either.
            </p>
          </div>

          <div>
            <div className="border border-white/12 bg-white/[0.025] p-6 sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-system">ALVIRA Dossier</p>
              <p className="mt-5 font-display text-3xl leading-[1.02] tracking-[-0.025em] text-white sm:text-4xl">
                A private, portable record of the understanding you choose to build.
              </p>
              <p className="mt-5 max-w-3xl text-sm leading-7 text-white/58">
                ALVIRA is being built toward an encrypted Dossier that can carry your confirmed Context, meaningful changes, corrections, and Reflect-derived understanding in a form you control. The goal is simple: keep it, restore it, and decide when another AI gets to use it.
              </p>

              <div className="mt-8 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-4">
                {[
                  ["Build", "Capture what matters."],
                  ["Maintain", "Keep it current."],
                  ["Protect", "Package it privately."],
                  ["Carry", "Use it where you choose."],
                ].map(([label, copy]) => (
                  <div key={label} className="bg-[#0b0e0e] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-system">{label}</p>
                    <p className="mt-2 text-xs leading-5 text-white/48">{copy}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                <div className="border-t border-white/14 pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-white/38">What it is</p>
                  <p className="mt-3 text-sm leading-6 text-white/62">Context you deliberately build, validate, correct, and choose to carry forward.</p>
                </div>
                <div className="border-t border-human/45 pt-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.13em] text-human">What it is not</p>
                  <p className="mt-3 text-sm leading-6 text-white/62">Not a hidden behavioral profile, not a transcript of everything you say, and not permission for an AI to act for you.</p>
                </div>
              </div>

              <div className="mt-8 border-l border-system/60 pl-5">
                <p className="font-display text-2xl leading-tight text-white">ALVIRA can maintain your Context without owning your Context.</p>
                <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-white/35">Encrypted Dossier · restore/import · richer portability are forthcoming and will be labeled as they ship.</p>
              </div>

              {!compact && (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a href="/app" className="inline-flex min-h-11 items-center justify-center bg-[#f4f0e9] px-5 text-sm font-semibold text-[#191715] transition-opacity hover:opacity-85">Build the Context that stays yours →</a>
                  <a href="/pricing" className="inline-flex min-h-11 items-center justify-center border border-white/20 px-5 text-sm font-semibold text-white/74 hover:border-white/40 hover:text-white">See what is included →</a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
