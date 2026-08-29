const destinations = [
  ["01", "ChatGPT", "conversation"],
  ["02", "Claude", "reasoning"],
  ["03", "Gemini", "multimodal"],
  ["04", "Cursor", "building"],
  ["05", "Your agents", "execution"],
] as const;

export function PortabilityNetwork() {
  return (
    <div
      className="relative overflow-hidden border border-[#191715]/12 bg-[#f4f0e9]/60 p-5 dark:border-white/12 dark:bg-white/[0.025] sm:p-7"
      data-portability-network="true"
      aria-label="ALVIRA Context portability network"
    >
      <div className="flex items-center justify-between gap-4 border-b border-[#191715]/10 pb-4 dark:border-white/10">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-system-dark dark:text-system">
          One maintained context
        </p>
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#74685e] dark:text-white/36">
          many destinations
        </p>
      </div>

      <div className="relative mt-7 grid gap-6 md:grid-cols-[0.78fr_auto_1.22fr] md:items-center">
        <div
          className="relative border border-system/45 bg-system/[0.055] p-5 sm:p-6"
          data-scroll-step="true"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#74685e] dark:text-white/36">
                source of continuity
              </p>
              <p className="mt-2 font-display text-2xl tracking-[-0.025em] text-[#27231f] dark:text-[#f0e8de] sm:text-3xl">
                ALVIRA Context
              </p>
            </div>
            <span
              className="h-2.5 w-2.5 rounded-full bg-system shadow-[0_0_18px_color-mix(in_srgb,var(--color-system)_60%,transparent)]"
              aria-hidden="true"
            />
          </div>

          <div className="mt-6 grid grid-cols-3 gap-2">
            {[
              ["Known", "text-system-dark dark:text-system"],
              ["Changing", "text-human-dark dark:text-human"],
              ["Uncertain", "text-iridescent-dark dark:text-iridescent"],
            ].map(([label, tone]) => (
              <div key={label} className="border-t border-[#191715]/12 pt-2 dark:border-white/12">
                <span className={`font-mono text-[9px] uppercase tracking-[0.08em] ${tone}`}>{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-system/25 pt-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-system-dark dark:text-system" aria-hidden="true">↗</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-system-dark dark:text-system">
                Reusable context
              </span>
              <span className="h-px flex-1 bg-system/45" aria-hidden="true" />
            </div>
            <p className="mt-2 text-[11px] leading-5 text-[#74685e] dark:text-white/44">
              Only context appropriate to carry forward crosses the portability boundary.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center md:flex-col" aria-hidden="true" data-scroll-step="true">
          <span className="h-px flex-1 bg-system/30 md:h-10 md:w-px" />
          <span className="px-3 font-mono text-lg text-system md:px-0 md:py-2">→</span>
          <span className="h-px flex-1 bg-system/30 md:h-10 md:w-px" />
        </div>

        <div className="relative">
          <div className="absolute bottom-6 left-3 top-6 w-px bg-system/25" aria-hidden="true" />
          <div className="space-y-3 pl-8">
            {destinations.map(([number, name, use]) => (
              <div
                key={name}
                data-portability-destination="true"
                data-scroll-step="true"
                className="relative grid grid-cols-[auto_1fr_auto] items-center gap-3 border border-[#191715]/12 bg-[#f4f0e9]/70 px-4 py-3 dark:border-white/12 dark:bg-white/[0.025]"
              >
                <span className="absolute -left-5 top-1/2 h-px w-5 -translate-y-1/2 bg-system/35" aria-hidden="true" />
                <span className="font-mono text-[9px] text-system-dark dark:text-system">{number}</span>
                <span className="text-sm font-semibold text-[#302b27] dark:text-[#ece4da]">{name}</span>
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#74685e] dark:text-white/36">{use}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-7 grid gap-3 border-t border-[#191715]/10 pt-5 dark:border-white/10 sm:grid-cols-[auto_1fr_auto] sm:items-center" data-scroll-step="true">
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-system-dark dark:text-system">
          continuity
        </span>
        <span className="hidden h-px bg-system/25 sm:block" aria-hidden="true" />
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#74685e] dark:text-white/38">
          same understanding · different tool
        </span>
      </div>
    </div>
  );
}
