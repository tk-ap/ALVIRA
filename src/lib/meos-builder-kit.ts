export type MeosBuilderKitInput = {
  topic: string;
  portrait?: unknown;
  interviewState?: unknown;
  content: Record<string, string>;
};

export function createMeosBuilderKit(
  input: MeosBuilderKitInput,
  options: { includeStarter?: boolean } = {},
): Record<string, string> {
  const generatedAt = new Date().toISOString();
  const contentFiles = Object.keys(input.content).sort();
  const profile = {
    schemaVersion: "1.0",
    generatedAt,
    topic: input.topic,
    portrait: input.portrait ?? null,
    interviewState: input.interviewState ?? null,
    contentFiles: contentFiles.map((name) => `content/${name}`),
    provenance:
      "Compiled from owner-provided and owner-reviewed ALVIRA MeOS interview material.",
  };

  const startHere = `# Start Here — Your MeOS Builder Kit

This package contains the personal source material and build specification needed for a capable coding agent to create a private MeOS-style companion.

## Recommended workflow

1. Review every file in \`content/\` and remove anything you do not want to share.
2. Read \`privacy-requirements.md\`.
3. Upload this package to your chosen coding agent.
4. Give the agent the instruction in \`AGENT-BUILD-BRIEF.md\`.
5. Review the generated application before connecting hosting, analytics, or external APIs.

## Security notice

This beta download is a standard ZIP archive and is **not encrypted**. Store it securely and encrypt it before uploading or sharing it if it contains sensitive information. ALVIRA will not claim encryption until password-protected package generation is implemented and verified.

Generated: ${generatedAt}
`;

  const buildBrief = `# MeOS Agent Build Brief

## Objective

Build a private, responsive personal operating-system application from the supplied MeOS profile. The result should help the owner return to their stated purpose, decision criteria, boundaries, daily practices, and longer-term direction.

## Canonical sources

- Use \`meos-profile.json\` for structured metadata.
- Use files in \`content/\` for owner-approved language.
- Do not invent biographical facts, diagnoses, predictions, or personal claims.
- Preserve source qualifiers and uncertainty where present.

## Required routes

- \`/today\` — daily compass, one durable action, energy check, evening reflection
- \`/journey\` — dated evidence and progress over time
- \`/compass\` — success conditions and decision tests
- \`/purpose\` — personal and professional purpose
- \`/next-chapter\` — goals, career evidence, and experiments
- \`/portrait\` — integrated portrait
- \`/lenses\` — optional reflective frameworks with disclaimers
- \`/cycles\` — user-approved cycles and countdowns
- \`/resources\` — source documents and provenance

## Functional requirements

- Responsive and keyboard accessible.
- Private by default.
- Store daily entries locally unless the owner explicitly configures a secure backend.
- Provide export and delete controls for all user-created entries.
- Clearly distinguish owner statements, agent synthesis, and optional symbolic material.
- Never send personal content to analytics, advertising, or model providers without explicit consent.

## Visual direction

Calm, editorial, reflective, and practical. Favor strong typography, generous spacing, restrained color, visible progress, and short daily interactions over dashboard density.

## Completion standard

The application must satisfy every item in \`acceptance-criteria.md\` and display the reflective-practice disclaimer in the footer.
`;

  const privacy = `# Privacy Requirements

- Treat every supplied file as private personal data.
- Do not add third-party analytics by default.
- Do not transmit journal entries or profile content to an AI provider without an explicit, contextual confirmation.
- Keep local-only persistence as the default.
- Provide complete export and deletion controls.
- Never include secrets, API keys, passwords, or deployment tokens in client code.
- Symbolic frameworks must be described as optional reflective lenses, never scientific, diagnostic, predictive, or deterministic claims.
`;

  const dataModel = `# Data Model

## Profile

- schemaVersion
- generatedAt
- topic
- portrait
- contentFiles
- provenance

## Daily entry

- id
- date
- durableAction
- availableEnergy
- alignmentChecks
- evidence
- releasedResponsibility
- completedAt

## Source record

- id
- label
- sourceType
- ownerValidated
- contentReference
`;

  const acceptance = `# Acceptance Criteria

- All required routes are present and usable on mobile and desktop.
- Daily entries persist after refresh on the same device.
- The owner can export and permanently delete locally stored entries.
- Personal copy comes only from the supplied MeOS sources.
- Optional symbolic content carries a visible reflective-practice disclaimer.
- No analytics or external data transfer is enabled by default.
- Empty and incomplete profile sections fail gracefully without invented copy.
- Keyboard navigation and visible focus states work throughout.
- The footer states: “A reflective tool, not a diagnosis or guarantee. Your choices remain your own.”
`;

  const files: Record<string, string> = {
    "START-HERE.md": startHere,
    "AGENT-BUILD-BRIEF.md": buildBrief,
    "meos-profile.json": JSON.stringify(profile, null, 2),
    "product-spec/routes.md":
      buildBrief
        .split("## Required routes")[1]
        ?.split("## Functional requirements")[0]
        ?.trim() || "See AGENT-BUILD-BRIEF.md.",
    "product-spec/data-model.md": dataModel,
    "product-spec/privacy-requirements.md": privacy,
    "product-spec/acceptance-criteria.md": acceptance,
    ...Object.fromEntries(
      Object.entries(input.content).map(([name, value]) => [
        `content/${name}`,
        value,
      ]),
    ),
  };
  if (options.includeStarter) Object.assign(files, createStarterFiles(profile));
  return files;
}

function createStarterFiles(
  profile: Record<string, unknown>,
): Record<string, string> {
  const profileJson = JSON.stringify(profile, null, 2);
  return {
    "starter-app/README.md": `# Reusable MeOS Starter Application

Open \`index.html\` directly, or serve this directory with any static web server. It has no external dependencies, analytics, accounts, or network requests. Daily reflections remain in this browser's local storage and can be exported or deleted.
`,
    "starter-app/meos-profile.json": profileJson,
    "starter-app/index.html": `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>My MeOS</title><link rel="stylesheet" href="styles.css"></head><body><header><p class="eyebrow">PRIVATE / MeOS</p><h1 id="title">My personal operating system</h1><p>A calm place to return to what matters.</p></header><nav id="nav" aria-label="MeOS sections"></nav><main><section id="view"></section></main><footer>A reflective tool, not a diagnosis or guarantee. Your choices remain your own.</footer><script src="app.js"></script></body></html>`,
    "starter-app/styles.css": `:root{color-scheme:light dark;font:16px/1.65 system-ui,sans-serif;background:#f5f7f4;color:#17211e}body{margin:0}header,main,nav,footer{max-width:860px;margin:auto;padding:24px}header{padding-top:70px}.eyebrow{font:12px ui-monospace;color:#176b5b;letter-spacing:.16em}h1{font-size:clamp(2rem,6vw,4rem);line-height:1.05;max-width:13ch}nav{display:flex;gap:8px;flex-wrap:wrap;border-block:1px solid #ccd5d0}button{font:inherit;border:1px solid #176b5b;background:transparent;color:inherit;border-radius:6px;padding:9px 12px;cursor:pointer}button[aria-current=true],.primary{background:#176b5b;color:white}.card{background:#fff;border:1px solid #d9e0dc;padding:24px;margin:16px 0;border-radius:8px}textarea,input{box-sizing:border-box;width:100%;padding:12px;margin:6px 0 14px;font:inherit}footer{font-size:12px;color:#596660}@media(prefers-color-scheme:dark){:root{background:#0e1513;color:#e8eeeb}.card{background:#151e1b;border-color:#34423d}}`,
    "starter-app/app.js": `const PROFILE=${profileJson};const tabs=['Today','Journey','Compass','Purpose','Next Chapter','Portrait','Lenses','Cycles','Resources'];const nav=document.querySelector('#nav'),view=document.querySelector('#view');document.querySelector('#title').textContent=PROFILE.topic||'My MeOS';const key='meos.entries.v1';const entries=()=>JSON.parse(localStorage.getItem(key)||'[]');function show(tab){[...nav.children].forEach(b=>b.setAttribute('aria-current',String(b.textContent===tab)));const p=PROFILE.portrait||{};const purposes=p.purposeStatements||{};const copy={Compass:p.decisionCompass,Purpose:(purposes.personal||'')+'\\n\\n'+(purposes.professional||''),Portrait:p.portrait,Lenses:'Use only the reflective frameworks you have explicitly chosen. They are optional lenses, never diagnoses or predictions.',Cycles:p.cycles,Resources:'See meos-profile.json and the content folder for source material.','Next Chapter':'What experiment would create useful evidence for your next chapter?'};if(tab==='Today')view.innerHTML='<h2>Today</h2><div class="card"><label>One durable action<textarea id="action"></textarea></label><label>Available energy<input id="energy" placeholder="low, steady, expansive…"></label><button class="primary" id="save">Save reflection</button></div>';else if(tab==='Journey')view.innerHTML='<h2>Journey</h2>'+entries().map(e=>'<div class="card"><strong>'+e.date+'</strong><p>'+safe(e.action)+'</p><small>Energy: '+safe(e.energy)+'</small></div>').join('')+'<button id="export">Export entries</button> <button id="delete">Delete all entries</button>';else view.innerHTML='<h2>'+tab+'</h2><div class="card"><p>'+safe(copy[tab]||'This section is ready for your owner-reviewed material.')+'</p></div>';document.querySelector('#save')?.addEventListener('click',()=>{const all=entries();all.unshift({date:new Date().toLocaleString(),action:document.querySelector('#action').value,energy:document.querySelector('#energy').value});localStorage.setItem(key,JSON.stringify(all));show('Journey')});document.querySelector('#export')?.addEventListener('click',()=>download('meos-entries.json',JSON.stringify(entries(),null,2)));document.querySelector('#delete')?.addEventListener('click',()=>{if(confirm('Permanently delete all local entries?')){localStorage.removeItem(key);show('Journey')}})}function safe(v){const d=document.createElement('div');d.textContent=String(v||'Not yet defined.');return d.innerHTML.replaceAll('\\n','<br>')}function download(n,c){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([c],{type:'application/json'}));a.download=n;a.click();URL.revokeObjectURL(a.href)}tabs.forEach(t=>{const b=document.createElement('button');b.textContent=t;b.onclick=()=>show(t);nav.appendChild(b)});show('Today');`,
  };
}
