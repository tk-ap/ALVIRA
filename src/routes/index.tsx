import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "~/components/Header";
import { DossierOwnershipPositioning } from "~/components/DossierOwnershipPositioning";
import { TrustFooter } from "~/components/TrustFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ALVIRA — Context that moves with you" },
      {
        name: "description",
        content:
          "Immersive prototype: ALVIRA builds a living context layer you can inspect, correct, and selectively carry between the AI tools you use.",
      },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Home,
});

const flow = [
  {
    id: "context",
    number: "01",
    title: "Context",
    eyebrow: "Capture what matters",
    body: "Build a maintained understanding of your goals, constraints, decisions, preferences, and project history.",
    detail: "The useful background lives somewhere you can inspect instead of being scattered across separate chats.",
  },
  {
    id: "reflect",
    number: "02",
    title: "Reflect",
    eyebrow: "Keep it honest",
    body: "Inspect it, correct it, and keep it current instead of trusting an invisible memory layer.",
    detail: "Known, uncertain, and changing context should look different — so old assumptions do not silently become permanent facts.",
  },
  {
    id: "bridge",
    number: "03",
    title: "Bridge",
    eyebrow: "Carry it selectively",
    body: "Take approved context into the AI tool that fits the work.",
    detail: "Portability is deliberate: the context layer stays on your side, and you decide what another tool gets to know.",
  },
] as const;

const understandingStates = [
  ["Known", "Established enough to rely on.", "solid"],
  ["Uncertain", "Visible instead of silently treated as fact.", "open"],
  ["Changing", "Updated when new evidence changes the picture.", "pulse"],
  ["Reusable", "Available to carry into future AI interactions when appropriate.", "route"],
] as const;

const modelNodes = ["ChatGPT", "Claude", "Gemini", "Cursor"] as const;

function Home() {
  const [activeFlow, setActiveFlow] = useState<(typeof flow)[number]["id"]>("context");
  const active = flow.find((item) => item.id === activeFlow) ?? flow[0];

  return (
    <div className="min-h-dvh bg-[#0b0e0e] text-[#f4f0e9]">
      <style>{`
        :root{--alv-acid:#d6c24a;--alv-warm:#b8ada1;--alv-ink:#0b0e0e;--alv-line:rgba(244,240,233,.14);--alv-red:#8b3345}
        html{scroll-behavior:smooth}
        .immersive-page{background:
          radial-gradient(circle at 78% 9%,rgba(214,194,74,.075),transparent 25%),
          radial-gradient(circle at 12% 58%,rgba(139,51,69,.07),transparent 28%),
          #0b0e0e}
        .proto-strip{display:flex;align-items:center;justify-content:space-between;gap:20px;border-block:1px solid var(--alv-line);padding:10px 0;
          font:600 9px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#857c74}
        .proto-strip strong{color:var(--alv-acid)}
        .hero-grid{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(360px,.95fr);gap:clamp(40px,7vw,110px);align-items:center;min-height:78vh;padding:70px 0 92px}
        .hero-kicker{font:600 11px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.18em;text-transform:uppercase;color:var(--alv-acid)}
        .hero-title{margin:22px 0 0;max-width:10.6ch;font-size:clamp(58px,7.7vw,116px);font-weight:600;line-height:.88;letter-spacing:-.06em}
        .hero-title span{color:#8f857c}
        .hero-copy{max-width:650px;margin:30px 0 0;color:var(--alv-warm);font-size:clamp(17px,1.7vw,21px);line-height:1.55}
        .hero-actions{display:flex;flex-wrap:wrap;gap:12px;margin-top:34px}
        .hero-actions a{min-height:50px;display:inline-flex;align-items:center;justify-content:center;padding:0 22px;border:1px solid var(--alv-line);
          text-decoration:none;font-size:13px;font-weight:700}
        .hero-actions a:first-child{background:#f4f0e9;color:#191715;border-color:#f4f0e9}
        .context-field{position:relative;min-height:520px;display:grid;place-items:center}
        .context-orbit{position:relative;width:min(43vw,480px);aspect-ratio:1;border:1px solid var(--alv-line);border-radius:50%;display:grid;place-items:center}
        .context-orbit:before,.context-orbit:after{content:"";position:absolute;border:1px solid var(--alv-line);border-radius:50%}
        .context-orbit:before{inset:18%}.context-orbit:after{inset:36%}
        .context-core{position:relative;z-index:4;width:34%;aspect-ratio:1;border-radius:50%;display:grid;place-items:center;text-align:center;background:#0b0e0e;border:1px solid var(--alv-acid);
          box-shadow:0 0 80px rgba(214,194,74,.08);font:700 9px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;color:var(--alv-acid)}
        .context-core:before{content:"";position:absolute;inset:-16%;border:1px solid rgba(214,194,74,.18);border-radius:50%;animation:alvPulse 4s ease-in-out infinite}
        .model-node{position:absolute;z-index:4;padding:10px 12px;background:#0b0e0e;border:1px solid var(--alv-line);
          font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.1em;text-transform:uppercase}
        .model-node:nth-of-type(2){top:5%;left:50%;transform:translateX(-50%)}.model-node:nth-of-type(3){right:-4%;top:46%}
        .model-node:nth-of-type(4){bottom:5%;left:50%;transform:translateX(-50%)}.model-node:nth-of-type(5){left:-4%;top:46%}
        .model-node i{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:7px;background:#756d66}
        .context-thread{position:absolute;left:50%;top:50%;width:42%;height:1px;background:linear-gradient(90deg,rgba(214,194,74,.15),rgba(214,194,74,.7));transform-origin:left center;z-index:2}
        .context-thread.t1{transform:rotate(-90deg)}.context-thread.t2{transform:rotate(0)}.context-thread.t3{transform:rotate(90deg)}.context-thread.t4{transform:rotate(180deg)}
        .context-thread:after{content:"";position:absolute;right:0;top:-2px;width:5px;height:5px;border-radius:50%;background:var(--alv-acid);box-shadow:0 0 14px rgba(214,194,74,.8);animation:alvTravel 2.8s ease-in-out infinite alternate}
        .context-thread.t2:after{animation-delay:.5s}.context-thread.t3:after{animation-delay:1s}.context-thread.t4:after{animation-delay:1.5s}
        @keyframes alvPulse{0%,100%{transform:scale(.96);opacity:.4}50%{transform:scale(1.05);opacity:1}}
        @keyframes alvTravel{0%{right:95%;opacity:.25}100%{right:0;opacity:1}}
        .field-caption{position:absolute;bottom:8px;left:0;right:0;text-align:center;font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase;color:#6f6861}
        .sticky-story{border-top:1px solid var(--alv-line);display:grid;grid-template-columns:minmax(300px,.72fr) minmax(0,1.28fr);gap:clamp(50px,8vw,130px);padding:120px 0}
        .sticky-copy{position:sticky;top:110px;align-self:start}
        .sticky-copy h2{margin:18px 0 0;max-width:8ch;font-size:clamp(52px,6.5vw,94px);font-weight:550;line-height:.9;letter-spacing:-.055em}
        .sticky-copy p{margin:28px 0 0;max-width:36ch;color:var(--alv-warm);font-size:16px;line-height:1.65}
        .comparison-stack{display:grid;gap:24px}
        .comparison{min-height:360px;padding:clamp(28px,5vw,54px);border:1px solid var(--alv-line);background:rgba(255,255,255,.018);display:grid;align-content:space-between}
        .comparison small{font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:#756d66}
        .comparison h3{margin:70px 0 0;max-width:15ch;font-size:clamp(34px,4.6vw,62px);font-weight:500;line-height:.94;letter-spacing:-.045em}
        .comparison p{margin:24px 0 0;max-width:58ch;color:var(--alv-warm);line-height:1.6}
        .comparison--signal{border-color:rgba(214,194,74,.38);background:linear-gradient(145deg,rgba(214,194,74,.055),rgba(255,255,255,.012))}
        .comparison--signal small{color:var(--alv-acid)}
        .flow-section{border-block:1px solid var(--alv-line);padding:110px 0}
        .flow-head{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:50px;align-items:end}
        .flow-head h2{margin:14px 0 0;max-width:11ch;font-size:clamp(50px,6vw,86px);font-weight:550;line-height:.9;letter-spacing:-.052em}
        .flow-head p{max-width:640px;color:var(--alv-warm);font-size:17px;line-height:1.65}
        .flow-console{margin-top:58px;display:grid;grid-template-columns:300px minmax(0,1fr);border:1px solid var(--alv-line)}
        .flow-nav{border-right:1px solid var(--alv-line)}
        .flow-button{width:100%;min-height:120px;padding:24px;text-align:left;background:transparent;color:inherit;border:0;border-bottom:1px solid var(--alv-line);cursor:pointer}
        .flow-button:last-child{border-bottom:0}.flow-button.is-active{background:rgba(214,194,74,.05)}
        .flow-button small{display:block;font:600 9px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase;color:#756d66}
        .flow-button strong{display:block;margin-top:14px;font-size:24px;font-weight:500}.flow-button.is-active strong{color:var(--alv-acid)}
        .flow-display{min-height:440px;padding:clamp(34px,5vw,60px);display:grid;grid-template-columns:minmax(0,1fr) minmax(260px,.7fr);gap:50px;align-items:center;background:radial-gradient(circle at 80% 30%,rgba(214,194,74,.05),transparent 32%)}
        .flow-display .eyebrow{font:600 9px/1.3 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--alv-acid)}
        .flow-display h3{margin:18px 0 0;font-size:clamp(42px,5vw,68px);font-weight:520;line-height:.9;letter-spacing:-.05em}
        .flow-display p{margin:24px 0 0;max-width:50ch;color:var(--alv-warm);line-height:1.65}
        .context-card{padding:24px;border:1px solid var(--alv-line);background:#0d1110;transform:rotate(1deg);box-shadow:0 30px 90px rgba(0,0,0,.3)}
        .context-card small{font:600 9px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.13em;text-transform:uppercase;color:#756d66}
        .context-card blockquote{margin:34px 0 0;font-size:24px;line-height:1.3;letter-spacing:-.02em}
        .context-card .status{margin-top:30px;display:flex;align-items:center;gap:8px;font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--alv-acid)}
        .context-card .status:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--alv-acid)}
        .states{padding:110px 0}
        .states-head{display:flex;justify-content:space-between;gap:40px;align-items:end}
        .states-head h2{margin:16px 0 0;max-width:11ch;font-size:clamp(50px,6vw,84px);font-weight:550;line-height:.9;letter-spacing:-.052em}
        .states-grid{margin-top:58px;display:grid;grid-template-columns:repeat(4,1fr);border-block:1px solid var(--alv-line)}
        .state-card{min-height:290px;padding:28px;border-right:1px solid var(--alv-line);display:flex;flex-direction:column;justify-content:space-between}
        .state-card:last-child{border-right:0}.state-card h3{margin:0;font-size:28px;font-weight:500}.state-card p{color:var(--alv-warm);font-size:14px;line-height:1.55}
        .state-mark{width:46px;height:46px;border:1px solid var(--alv-line);border-radius:50%;position:relative}
        .state-mark:before{content:"";position:absolute;inset:13px;border-radius:50%;background:#756d66}
        .state-card:nth-child(1) .state-mark:before{background:var(--alv-acid)}
        .state-card:nth-child(2) .state-mark{border-style:dashed}
        .state-card:nth-child(3) .state-mark:before{animation:alvPulse 2.8s ease-in-out infinite;background:var(--alv-red)}
        .state-card:nth-child(4) .state-mark:after{content:"→";position:absolute;left:54px;top:14px;color:var(--alv-acid)}
        .engine-invite{margin:0 0 110px;padding:clamp(36px,6vw,72px);border:1px solid rgba(214,194,74,.38);display:grid;grid-template-columns:minmax(0,1.2fr) minmax(300px,.8fr);gap:50px;align-items:end;background:linear-gradient(145deg,rgba(214,194,74,.055),rgba(255,255,255,.012))}
        .engine-invite h2{margin:14px 0 0;max-width:12ch;font-size:clamp(46px,6vw,84px);font-weight:550;line-height:.9;letter-spacing:-.052em}
        .engine-invite p{margin:0;color:var(--alv-warm);line-height:1.65}
        .engine-invite a{margin-top:24px;display:inline-flex;min-height:50px;align-items:center;border:1px solid var(--alv-acid);padding:0 20px;color:var(--alv-acid);text-decoration:none;font-weight:700}
        .final-cta{border-top:1px solid var(--alv-line);padding:110px 0 130px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:50px;align-items:end}
        .final-cta h2{margin:16px 0 0;max-width:12ch;font-size:clamp(52px,7vw,100px);font-weight:550;line-height:.88;letter-spacing:-.06em}
        .final-cta a{min-height:56px;display:inline-flex;align-items:center;padding:0 26px;background:#f4f0e9;color:#191715;text-decoration:none;font-weight:700}
        @media(max-width:960px){
          .hero-grid,.sticky-story,.flow-head,.engine-invite,.final-cta{grid-template-columns:1fr}.context-field{min-height:400px}.context-orbit{width:min(78vw,430px)}
          .sticky-copy{position:relative;top:auto}.flow-console{grid-template-columns:1fr}.flow-nav{border-right:0;border-bottom:1px solid var(--alv-line);display:grid;grid-template-columns:repeat(3,1fr)}
          .flow-button{min-height:100px;border-bottom:0;border-right:1px solid var(--alv-line)}.flow-button:last-child{border-right:0}.flow-display{grid-template-columns:1fr}.states-grid{grid-template-columns:repeat(2,1fr)}
          .state-card:nth-child(2){border-right:0}.state-card:nth-child(-n+2){border-bottom:1px solid var(--alv-line)}
        }
        @media(max-width:640px){
          .proto-strip{align-items:flex-start;flex-direction:column}.hero-grid{padding-top:46px}.hero-title{font-size:clamp(48px,15vw,76px)}
          .flow-nav{grid-template-columns:1fr}.flow-button{border-right:0;border-bottom:1px solid var(--alv-line)}.states-grid{grid-template-columns:1fr}.state-card{border-right:0;border-bottom:1px solid var(--alv-line)}
          .state-card:last-child{border-bottom:0}
        }
        @media(prefers-reduced-motion:reduce){
          html{scroll-behavior:auto}.context-core:before,.context-thread:after,.state-card:nth-child(3) .state-mark:before{animation:none}
        }
      `}</style>

      <Header />

      <main id="main-content" className="immersive-page">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-10">
          <div className="proto-strip">
            <span><strong>Immersive prototype</strong> · preview only · production untouched</span>
            <span>21st reference study · live Lab engine behind the interview route</span>
          </div>

          <section className="hero-grid">
            <div>
              <p className="hero-kicker">Context Intelligence</p>
              <h1 className="hero-title">
                You use more than one AI. <span>Why are you the only thing connecting them?</span>
              </h1>
              <p className="hero-copy">
                Your AI tools have memory. ALVIRA gives your context somewhere to live between them —
                a living layer you can inspect, correct, and selectively carry wherever you work.
              </p>
              <div className="hero-actions">
                <a href="/interview-lab-immersive">Experience the interview prototype →</a>
                <a href="#portability">See the context move</a>
              </div>
            </div>

            <div className="context-field" aria-label="ALVIRA portability visualization">
              <div className="context-orbit">
                <span className="context-thread t1" />
                <span className="context-thread t2" />
                <span className="context-thread t3" />
                <span className="context-thread t4" />
                <div className="context-core">YOUR<br />CONTEXT</div>
                {modelNodes.map((node) => <span className="model-node" key={node}><i />{node}</span>)}
              </div>
              <p className="field-caption">One maintained layer · selectively routed · provider-independent</p>
            </div>
          </section>

          <section id="portability" className="sticky-story">
            <div className="sticky-copy">
              <p className="hero-kicker">The shift</p>
              <h2>Your context should not start over when your AI does.</h2>
              <p>
                The problem is not a lack of capable models. It is that the human-side context gets
                fragmented across them — and you become the manual synchronization layer.
              </p>
            </div>

            <div className="comparison-stack">
              <article className="comparison">
                <small>Without ALVIRA / fragmented</small>
                <div>
                  <h3>Copy → paste → summarize → correct → repeat.</h3>
                  <p>
                    ChatGPT knows one history. Claude knows the decisions you copied over. The next
                    agent knows whatever you remembered to explain.
                  </p>
                </div>
              </article>

              <article className="comparison comparison--signal">
                <small>With ALVIRA / maintained</small>
                <div>
                  <h3>One context layer. Use the model that fits.</h3>
                  <p>
                    Review what is known, keep it current, and choose what travels with you instead
                    of rebuilding yourself for every model.
                  </p>
                </div>
              </article>

              <article className="comparison">
                <small>The boundary / explicit</small>
                <div>
                  <h3>Portable context is not provider memory control.</h3>
                  <p>
                    ALVIRA does not replace the memory inside other tools or control what they retain.
                    It maintains a context layer on your side that you can selectively reuse.
                  </p>
                </div>
              </article>
            </div>
          </section>

          <section className="flow-section">
            <div className="flow-head">
              <div>
                <p className="hero-kicker">Context → Reflect → Bridge</p>
                <h2>Understanding should have a visible lifecycle.</h2>
              </div>
              <p>
                Instead of treating context like an invisible memory feature, make the lifecycle
                inspectable: capture it, question it, correct it, then carry only what belongs in the
                next interaction.
              </p>
            </div>

            <div className="flow-console">
              <nav className="flow-nav" aria-label="ALVIRA context lifecycle">
                {flow.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveFlow(item.id)}
                    className={`flow-button ${activeFlow === item.id ? "is-active" : ""}`}
                    aria-pressed={activeFlow === item.id}
                  >
                    <small>{item.number} / {item.eyebrow}</small>
                    <strong>{item.title}</strong>
                  </button>
                ))}
              </nav>

              <div className="flow-display" aria-live="polite">
                <div>
                  <p className="eyebrow">{active.eyebrow}</p>
                  <h3>{active.title}</h3>
                  <p>{active.body}</p>
                  <p>{active.detail}</p>
                </div>
                <div className="context-card">
                  <small>Living context / sample state</small>
                  <blockquote>
                    {active.id === "context" && "“I switch models based on the work, but I should not have to reconstruct my priorities every time.”"}
                    {active.id === "reflect" && "“This was true three months ago. Mark it as changing until I confirm it still fits.”"}
                    {active.id === "bridge" && "“Share the project constraints and decisions. Keep unrelated personal context out.”"}
                  </blockquote>
                  <div className="status">
                    {active.id === "context" && "Captured"}
                    {active.id === "reflect" && "Under review"}
                    {active.id === "bridge" && "Scoped for reuse"}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="states">
            <div className="states-head">
              <div>
                <p className="hero-kicker">More than memory</p>
                <h2>Context should show what kind of truth it is.</h2>
              </div>
            </div>

            <div className="states-grid">
              {understandingStates.map(([title, body]) => (
                <article className="state-card" key={title}>
                  <div className="state-mark" aria-hidden="true" />
                  <div>
                    <h3>{title}</h3>
                    <p>{body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="engine-invite">
            <div>
              <p className="hero-kicker">The engine underneath</p>
              <h2>Do not just watch a mockup. Talk to the latest Interview Lab.</h2>
            </div>
            <div>
              <p>
                The immersive interview prototype is wired to the isolated Lab v2 engine. It uses the
                real carried-forward context, target-gap, and question-purpose diagnostics while
                keeping production Context and profile state untouched.
              </p>
              <a href="/interview-lab-immersive">Open the Interview Lab experience →</a>
            </div>
          </section>

          <section className="final-cta">
            <div>
              <p className="hero-kicker">Context that moves with you</p>
              <h2>Your tools can change. Your context can keep moving.</h2>
            </div>
            <a href="/interview-lab-immersive">Try the prototype →</a>
          </section>
        </div>
      </main>

      <DossierOwnershipPositioning />
      <TrustFooter />
    </div>
  );
}
