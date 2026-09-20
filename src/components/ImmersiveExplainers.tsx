export function ContextAssemblyGraphic() {
  return (
    <figure className="ivx ivx--assembly" aria-label="Sources combine into one maintained ALVIRA Context with visible states">
      <div className="ivx__sources" aria-label="Context sources">
        {[
          ["Interview", "what you tell ALVIRA"],
          ["Files + URLs", "evidence you provide"],
          ["AI context", "what you bring forward"],
        ].map(([label, note]) => (
          <div className="ivx__source" key={label}>
            <span>{label}</span>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <div className="ivx__connector ivx__connector--in" aria-hidden="true"><i /></div>
      <div className="ivx__core">
        <small>ALVIRA</small>
        <strong>YOUR<br />CONTEXT</strong>
        <span>maintained here</span>
      </div>
      <div className="ivx__connector ivx__connector--out" aria-hidden="true"><i /></div>
      <div className="ivx__states" aria-label="Context states">
        {["Known", "Uncertain", "Changing", "Reusable"].map((label, index) => (
          <span className={`ivx__state ivx__state--${index + 1}`} key={label}>{label}</span>
        ))}
      </div>
      <figcaption>Sources remain traceable. Context becomes useful only after observation, review, and correction.</figcaption>
    </figure>
  );
}

export function PortabilityGraphic() {
  const tools = [
    ["ChatGPT", "north"],
    ["Claude", "east"],
    ["Gemini", "south"],
    ["Cursor", "west"],
  ] as const;

  return (
    <figure className="ivx ivx--portability" aria-label="Selected ALVIRA Context can be carried into different AI tools">
      <div className="ivx-port__context">
        <small>Maintained</small>
        <strong>ALVIRA<br />CONTEXT</strong>
        <span>reviewable · editable</span>
      </div>
      <div className="ivx-port__gate">
        <span>REVIEW</span>
        <span>SELECT</span>
        <span>CARRY</span>
      </div>
      <div className="ivx-port__orbit">
        <div className="ivx-port__hub">ONLY WHAT<br />YOU CHOOSE</div>
        {tools.map(([label, position]) => (
          <div className={`ivx-port__tool ivx-port__tool--${position}`} key={label}>{label}</div>
        ))}
      </div>
      <figcaption>No silent sync in manual reuse. Bridge is the governed path for explicitly connected access.</figcaption>
    </figure>
  );
}

export function TrustStateGraphic() {
  return (
    <figure className="ivx ivx--trust" aria-label="Context moves through observed, inferred, confirmed, and outdated states">
      {[
        ["01", "Observed", "source-backed"],
        ["02", "Inferred", "not yet fact"],
        ["03", "Confirmed", "trusted context"],
        ["04", "Outdated", "needs review"],
      ].map(([number, label, note], index) => (
        <div className="ivx-trust__step" key={label}>
          <small>{number}</small>
          <strong>{label}</strong>
          <span>{note}</span>
          {index < 3 ? <i aria-hidden="true">→</i> : null}
        </div>
      ))}
      <figcaption>ALVIRA should preserve provenance and uncertainty instead of flattening every signal into “memory.”</figcaption>
    </figure>
  );
}

export function PilotProofGraphic() {
  return (
    <figure className="ivx ivx--pilot" aria-label="Design partner proof loop compares work before and after ALVIRA Context">
      <div className="ivx-pilot__rail">
        <div><small>01</small><strong>BASELINE</strong><span>same workflow</span></div>
        <i>→</i>
        <div><small>02</small><strong>ADD CONTEXT</strong><span>review + select</span></div>
        <i>→</i>
        <div><small>03</small><strong>RUN AGAIN</strong><span>same work</span></div>
        <i>→</i>
        <div><small>04</small><strong>COMPARE</strong><span>measure difference</span></div>
      </div>
      <div className="ivx-pilot__measures">
        {["Context Lift", "Re-explanation", "Correction", "Reuse"].map((label) => <span key={label}>{label}</span>)}
      </div>
      <figcaption>The claim is not “Context helps.” The experiment is whether the measured work improves enough to matter.</figcaption>
    </figure>
  );
}

export function PlanChoiceGraphic() {
  return (
    <figure className="ivx ivx--plans" aria-label="Three ways to enter ALVIRA depending on what the user wants to learn or do">
      {[
        ["EXPLORE", "Free", "Does maintained Context help me?", "01"],
        ["KEEP USING", "Pro / Lifetime", "Make the full Context loop ongoing.", "02"],
        ["TEST CLOSELY", "Founding Beta", "Use it hard and help shape what works.", "03"],
      ].map(([signal, title, note, number]) => (
        <div className="ivx-plan" key={title}>
          <small>{number} / {signal}</small>
          <strong>{title}</strong>
          <span>{note}</span>
        </div>
      ))}
      <figcaption>One product loop. Different reasons to enter it.</figcaption>
    </figure>
  );
}

export function ContextExampleGraphic() {
  const nodes = [
    ["Communication", "north"],
    ["Decision rules", "east"],
    ["Constraints", "south"],
    ["Working style", "west"],
    ["AI instructions", "south-east"],
  ] as const;
  return (
    <figure className="ivx ivx--example" aria-label="A fictional ALVIRA Context organizes several kinds of user-confirmed information">
      <div className="ivx-example__orbit">
        <div className="ivx-example__core"><small>Fictional</small><strong>ALEX'S<br />CONTEXT</strong></div>
        {nodes.map(([label, pos]) => <span className={`ivx-example__node ivx-example__node--${pos}`} key={label}>{label}</span>)}
      </div>
      <figcaption>The document is only one rendering. The useful asset is the maintained understanding behind it.</figcaption>
    </figure>
  );
}

export function BetaExchangeGraphic() {
  return (
    <figure className="ivx ivx--beta" aria-label="Founding Beta exchanges access for real use and candid product feedback">
      <div className="ivx-beta__node"><small>ALVIRA</small><strong>FULL PRODUCT<br />ACCESS</strong></div>
      <i>→</i>
      <div className="ivx-beta__node"><small>YOU</small><strong>REAL USE</strong><span>normal work · real friction</span></div>
      <i>→</i>
      <div className="ivx-beta__node"><small>EVIDENCE</small><strong>CANDID FEEDBACK</strong><span>useful · confusing · broken</span></div>
      <i className="ivx-beta__return">↺</i>
      <figcaption>Founding Beta is an evidence loop, not a giveaway.</figcaption>
    </figure>
  );
}


export type ProductJourneyStage = "talk" | "understand" | "inspect" | "connect";

export function ProductJourneyRail({ active }: { active: ProductJourneyStage }) {
  const steps: Array<[ProductJourneyStage, string, string]> = [
    ["talk", "Talk", "say what matters"],
    ["understand", "Understand", "watch Context form"],
    ["inspect", "Inspect", "review + correct"],
    ["connect", "Connect", "approve what moves"],
  ];
  const activeIndex = Math.max(0, steps.findIndex(([id]) => id === active));

  return (
    <nav className="ivx-journey" aria-label="ALVIRA Context journey">
      {steps.map(([id, label, note], index) => {
        const state = index < activeIndex ? "done" : index === activeIndex ? "active" : "next";
        return (
          <div className={`ivx-journey__step ivx-journey__step--${state}`} key={id} aria-current={state === "active" ? "step" : undefined}>
            <small>0{index + 1}</small>
            <strong>{label}</strong>
            <span>{note}</span>
          </div>
        );
      })}
    </nav>
  );
}

export function LiveContextMirrorGraphic({
  items,
  currentLabel,
}: {
  items: Array<{ label: string; value: string; status: "captured" | "developing" }>;
  currentLabel?: string;
}) {
  return (
    <aside className="ivx-live-mirror" aria-label="Live Context Mirror">
      <div className="ivx-live-mirror__head">
        <div>
          <small>Live Context Mirror</small>
          <strong>What ALVIRA can point to right now</strong>
        </div>
        {currentLabel ? <span>asking about · {currentLabel}</span> : null}
      </div>
      {items.length ? (
        <div className="ivx-live-mirror__items">
          {items.map((item) => (
            <div className="ivx-live-mirror__item" key={item.label}>
              <div>
                <small>{item.label}</small>
                <p>{item.value}</p>
              </div>
              <span className={`ivx-live-mirror__status ivx-live-mirror__status--${item.status}`}>{item.status}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="ivx-live-mirror__empty">
          <span />
          <p>Nothing is shown as known yet. The mirror fills only from Context the interview has actually captured.</p>
        </div>
      )}
      <p className="ivx-live-mirror__rule">Visible state only · no invented confidence · correct the source conversation when something is wrong.</p>
    </aside>
  );
}
