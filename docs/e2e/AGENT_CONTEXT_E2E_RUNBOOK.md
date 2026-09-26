# ALVIRA agent-to-AI context E2E — runbook for Codex

This runbook reproduces the agent-to-AI context experiment first run on 2026-09-25 (run `alvira-agent-e2e-20260925-01`, executed by Claude Code). It is written for **Codex** running interactively on TK's Omarchy workstation. Read all of it before starting. The first run lost time to every trap listed in §10.

## 1. What the run proves

It proves one chain, with evidence at every link:

**agent-held context → agent completes ALVIRA's real interview as a delegated agent → persisted Context with provenance → retrieval over the Bridge (MCP) → task-specific Context Brief → fresh signed-out ChatGPT → measurably better answer to the same prompt.**

It does **not** prove, and you must not claim:
- that ALVIRA itself does task-aware selection. You, the agent, write the brief.
- that the Bridge reaches anonymous ChatGPT. Signed-out ChatGPT has no MCP or connector surface, so the brief goes in by manual paste, reported as such.
- that the lift is independent. You write the brief and you score it, so TK's blind review is the independent check.

Report exactly what the evidence shows. Put failures and repairs in the report too.

## 2. Who does what

| Step | Codex | TK only |
|---|---|---|
| Drive the browser | Yes, via your Chrome plugin in the `alvira-e2e` Chromium profile (native host `com.openai.codexextension` is registered for Chromium). | — |
| Passwords, sign-up, sign-in, CAPTCHAs | Never | Yes |
| Approving the Bridge OAuth consent | Only after TK says yes in chat | Or TK clicks it |
| First-time recording window selection | — | Picks the Chromium window in the portal dialog (saved afterwards) |
| Secrets (Neon URL, Vercel variables) | Never read, print or paste them | Saves them |
| Reset test state | After TK agrees | — |

**This runbook is interactive-only.** An AgentOS/Hermes-dispatched Codex run cannot do it: `adapters/codex/browser.py` in tk-ap/agent-os fails closed (`BLOCKED`) without a sandbox attestation. If your Chrome plugin cannot reach the `alvira-e2e` profile, **stop and ask TK**. Do not launch Chromium from the shell (see `~/Work/AGENTS.md`, "Browser execution security").

## 3. Environment (already set up once; verify, don't rebuild)

- **Code:** branch `e2e/agent-interview-mode` in tk-ap/ALVIRA. It is an executable **E2E overlay**, not an independent visual product fork: before a new canonical E2E release, reconcile the latest verified **published** `sandbox/review` UI/product baseline into this branch while preserving the isolated E2E database, agent-mode, provenance, Bridge and test instrumentation. The last deliberately reconciled sandbox SHA is recorded in `docs/e2e/CANONICAL_SANDBOX_BASELINE`. **Prototype, never merge as-is to production.** Work from a dedicated worktree, e.g. `~/Work/alvira-agent-e2e-wt`.
- **Database:** Neon project `neon-canary-diamond`, **not** connected to any Vercel project. Its URL is in `~/.config/alvira/e2e-db.env`, mode 600, written by TK.
- **Vercel:** team `alvira2`, project `alvira`. The Preview variable `ALVIRA_E2E_DATABASE_URL` points at Neon. The shared `DATABASE_URL` (Production **and** Preview) is **production** — the E2E build never reads it.
- **Preview URL:** `https://alvira-agent-e2e.vercel.app` (alias, re-pointed on each deploy).
- **Test account:** `codex-smoke-…@example.com`, already signed up on the preview. TK signs in; you never type the password. In an E2E-stamped build this isolated account has the same test-access simulator as the live authorized test account (`actual / founder / free / pro / lifetime`) so tier behavior can be checked without inventing a production-only smoke tier.
- **Browser:** Chromium profile `alvira-e2e`, never signed into ChatGPT or Google.

Check the environment (the output is masked; never print the URL any other way):

```bash
scripts/e2e/e2e-env db-check     # expect: 1 url, host ep-crimson-sno…, users: N (non-test: 0)
scripts/e2e/e2e-env state        # profiles, drafts, active Bridge grants, latest provenance
curl -s https://alvira-agent-e2e.vercel.app/api/health/ready   # {"status":"ready"}
```

To deploy code changes, use only `scripts/e2e/e2e-env deploy`. It refuses an unlinked folder, a dirty/uncommitted worktree, a non-test database, an E2E overlay whose recorded canonical-sandbox baseline is behind the source SHA currently published by `sandbox/review` to the permanent here.now sandbox, or a bundle that is not E2E-stamped. Before building, it checks the current E2E alias release fingerprint and health; when the E2E commit and currently published canonical-sandbox source SHA already match a healthy alias, it **reuses the existing deployment instead of creating another Vercel deployment**. After a real deploy it stamps `/e2e-release.json`, aliases the preview and checks health.

### E2E release-boundary rule

The three release boundaries remain distinct:

- `mighty-ether-p6cn.here.now` = canonical **static** sandbox from `sandbox/review`;
- `alvira-agent-e2e.vercel.app` = latest reconciled sandbox experience + real isolated E2E capabilities;
- `alviratech.vercel.app` = production from `main`.

Do not point the E2E alias directly at a `sandbox/review` Vercel preview. Reconcile the sandbox UI into the E2E overlay, update `docs/e2e/CANONICAL_SANDBOX_BASELINE` to the exact verified sandbox SHA, then use `e2e-env deploy`. This keeps the test functional while preventing routine here.now design iterations from consuming Vercel deployments.

## 4. Recording

Use `scripts/e2e/e2e-record`. It records **only the Chromium window** through the desktop portal, and while recording it shows a persistent desktop banner **"● E2E SMOKE TEST — RECORDING"** so anyone at the workstation knows it is in use.

```bash
RUN=alvira-agent-e2e-$(date +%Y%m%d)-NN        # next free NN
DIR=~/Work/alvira-e2e-runs/$RUN
scripts/e2e/e2e-record start --run-dir "$DIR" --label A-engineering   # engineering evidence
scripts/e2e/e2e-record stop  --run-dir "$DIR"
scripts/e2e/e2e-record start --run-dir "$DIR" --label B-clean-demo    # after a reset, second uninterrupted run
```

Rules:
- **Window capture is fail-closed.** If it cannot start, nothing records. Use `--monitor` only with TK's OK: it records the terminal and everything else on screen.
- TK signs in **before** you start recording. No password entry may appear on video.
- Keep the Chromium workspace (3) visible during the run. Window capture kept producing frames while it was hidden in testing, but that test used a static page, so it is unverified whether a hidden window's content keeps updating.
- Before stopping, show the final evidence on screen: the saved Context and the POST answer.
- After stopping, build a contact sheet and look at it before calling a recording shareable:
  `ffmpeg -v error -i FILE -vf "fps=1/60,scale=480:-1,tile=4x4" -frames:v 1 contact.jpg`

## 5. The run

Create `$DIR/{outputs,evidence,screenshots,recordings}` and keep everything there. Nothing lives only in terminal scrollback.

### Phase 0 — Freeze the prompt (before PRE)

Write `$DIR/TEST_PROMPT.txt` and record the time. Default wording:

> Based only on the context available to you, determine the five highest-priority things I should work on today, explain why each belongs where it does, and identify what I should explicitly defer.

Use the identical wording for PRE and POST.

### Phase 1 — PRE (signed-out ChatGPT)

1. Start recording.
2. Clear ChatGPT's local state in the profile. Signed-out ChatGPT keeps a **local chat history in IndexedDB**, and it will leak between sessions. On a `chatgpt.com` tab, run: `localStorage.clear(); sessionStorage.clear(); for (const d of await indexedDB.databases()) indexedDB.deleteDatabase(d.name)`. Reload.
3. New tab → `chatgpt.com`. Screenshot showing "Log in / Sign up" and no history.
4. Submit TEST_PROMPT. Save the full reply to `outputs/PRE_ALVIRA_OUTPUT.md` with URL, time and "model not exposed". Screenshot it.

### Phase 2 — Agent interview

1. Open `https://alvira-agent-e2e.vercel.app/app?actor=agent&actor_id=<your-agent-id>` (e.g. `codex-gpt-5`). Start with a relevant starting point, or resume the draft ("Continue previous interview").
2. Confirm the amber banner: "Agent contributing context on behalf of <account>". Screenshot it.
3. First answer: identify yourself ("I'm Codex, an AI agent acting on TK's behalf with their authorization. Everything I state is my account of TK…").
4. For each question:
   - Pick **KNOWN** (supported by sources you legitimately hold) or **INFERRED** (your reasoning). **The selector does not reset between answers.**
   - When you have no evidence, click **Unknown →**. Never invent.
   - Answers can be dense and cover several areas.
   - Never state a guess as fact. The first run wrongly recorded pronouns as KNOWN and had to correct it; TK's pronouns have not been stated.
5. Your sources: `~/Work` files, repos (`gh pr list`, `origin/main`) and your own notes about TK. Current state must come from the remote, not stale checkouts. Keep private data (salary, health, family) out unless it matters.
6. Finish when the interview says "All domains covered". Click **Generate knowledge files**, dismiss the popup, check that the compiled Context shows the "Supplied by an agent…" note, the `[inferred…]` tags and the Unknown section, then **Confirm & save profile**.

Interface traps (still open; see §9):
- **Submit with Enter, not the Send button.** The Context Mirror panel sits over Send and Generate at this window width.
- **Target elements by accessibility reference, never by screen coordinates.** The page scrolls between screenshots. The first run clicked a footer link and lost an answer.
- A **"Possibilities ALVIRA noticed"** popup can open over the interview and swallow clicks. Close it (×), then confirm with a DOM read that it is gone.
- Typing long answers can time out. Check the textarea value before sending.
- The chat shows your answer even when it was **not saved**. After every few answers, confirm with `scripts/e2e/e2e-env state` or the saved draft.

### Phase 3 — Persistence

`scripts/e2e/e2e-env state` must show:
- the profile ID and timestamps;
- provenance `{actor_type: agent, actor_id, subject_id, delegated: true, source_type: interview}`;
- the knowledge-state counts.

Save the output to `evidence/persistence.md`. `context_versions` stays empty on a first save; that is expected, not a failure.

### Phase 4 — Retrieval over the Bridge, then the commission

1. `python3 scripts/e2e/bridge_probe.py "$DIR" "$RUN" &`. It registers a client and writes `evidence/bridge/authorize_url.txt`.
2. Open that URL in the test browser. Ask TK in chat before clicking **Authorize read access**.
3. The probe then calls `initialize`, `tools/list`, `list_alvira_profiles` and `get_alvira_context`, and logs Vercel request IDs. It never writes the token.
4. Check that the retrieved JSON still has provenance and knowledge tags. Save a readable copy as `outputs/FULL_ALVIRA_RECORD.md`.
5. Save the commission text verbatim in `outputs/CONTEXT_COMMISSION.md`. It is the brief's §Phase 4 wording: minimum sufficient context, no dump, no invention, preserve uncertainty.
6. Write `outputs/GOAL_TO_CONTEXT_MAPPING.md`: task → decisions → facts → selection → framing, plus exclusions and why.
7. Write `outputs/TASK_SPECIFIC_CONTEXT_BRIEF.md`. Sections: Goal, Relevant Current State, Goals and Priorities, Constraints, Active Work, Preferences, Existing Decisions, Avoid / Do Not Assume, Uncertainty. Tag each line [KNOWN] / [INFERRED] / [UNKNOWN] and date it.
8. Record the size of the brief against the full record and the time it took.
9. **Watch for over-steering.** If the brief states a ranking, the POST answer will largely copy it. Either leave the ranking out, or keep it labelled [INFERRED] and say so in the report.

### Phase 5 — Delivery

- Bridge transport to signed-out ChatGPT: **NOT TESTABLE ON ANONYMOUS CLIENT**. Screenshot that "Plugins" and Settings offer no connector.
- Deliver the brief by **manual paste**, byte-identical. The signed-out composer is a plain `<textarea id="mobile-composer-prompt">`. Set it with the native value setter, fire an `input` event, and check `value === brief` before sending. Record the sha256.

### Phase 6 — POST

1. Clear the storage again (Phase 1 step 2), open a new chat and confirm the signed-out state.
2. Message 1: the brief alone, no instructions. ChatGPT may answer straight away because the brief states its goal. Save that reply separately; it is **not** POST.
3. Message 2: TEST_PROMPT, exact. The reply is `outputs/POST_ALVIRA_OUTPUT.md`. Screenshot the prompt and the answer.

## 6. Measurements

Score with the brief's rubrics (0–5 per dimension, max 40): **AIRS** (interview), **CRS** (brief), **ACIS** (PRE and POST, same rubric), **Context Utilization** (each brief fact: used correctly / available but unused / misused / hallucinated), **Context Efficiency** (sizes, % selected, latency, lift).

Count TK interventions by class: authentication, missing facts, ambiguous UI, browser/agent failure, product defect, safety/approval.

Score strictly, and state that you scored your own brief. Build `outputs/BLIND_REVIEW_FOR_TK.md` with PRE and POST as randomly assigned A/B, and seal the key in `evidence/blind_key.json`.

## 7. Report

Follow the brief's Final Report Format. Use `~/Work/alvira-e2e-runs/alvira-agent-e2e-20260925-01/REPORT.md` as the reference; it is private and local, so don't publish it. Keep "implemented during this test" separate from "recommended future architecture". The run is **INCOMPLETE** until both recordings exist and TK's blind review is recorded.

## 8. Clean demo run

After a passing engineering run:
1. Ask TK before resetting.
2. `scripts/e2e/e2e-env reset --yes` deletes the test user's profiles, drafts and Bridge grants **and resets its interview usage counter to 0**. It keeps the test user and leaves the owner account alone, so no re-signup is needed. Tier simulation remains available through the same authorized test-access control used by the live test account.
3. Re-run Phases 1–6 without debugging, recording with `--label B-clean-demo`.

If anything breaks, stop the clean take, fix it in the engineering track, and start the clean take over.

## 9. Known open issues (not fixed on this branch)

- O1: Interviewer/validator copy still says "you" in agent mode.
- O2: The possibilities popup intercepts input.
- O3: The resume screen counts chat turns as "answers saved".
- O4: No agent-mode indication before the interview starts.
- O5: The Context Mirror covers Send/Generate.
- O7: The consent page does not show the client name.

Fixed on this branch: R1 (plural keywords misfiled answers), R2 (answers containing "what is"/"how do" discarded as questions), R3 (Unknown areas re-asked). R1 and R2 also affect human users on production.

## 10. Mistakes the first run made — don't repeat them

| Mistake | Consequence | Rule |
|---|---|---|
| Printed a URL-parse result that included the DB password | Password in transcript, had to be rotated | Only use `e2e-env db-check`; never print URLs |
| `source`d the env file | Connection failed: `&` in the query string backgrounded the shell | Read it with Python (`e2e-env` does) |
| Deployed a preview that read `DATABASE_URL` | Would have written to production | Stamped builds only (`e2e-env deploy`) |
| Checked the stamp through a function parameter | The build define didn't replace it; the guard was inert | Keep `process.env.ALVIRA_E2E` literal; `deploy` greps for `e2eBuild = true` |
| Tried to bake the DB URL into the bundle | Blocked as credential leakage | The secret goes in a Vercel variable that TK sets |
| `vercel deploy --yes` in an unlinked folder | Created a stray Vercel project | `e2e-env deploy` requires `.vercel/project.json` = `alvira` |
| `vercel link` | Left `.env.local` with an OIDC token and edited `.gitignore` | Delete `.env.local`; revert `.gitignore` |
| `pkill -f <pattern>` to stop the recorder | Killed its own shell | Stop by PID (`e2e-record stop`) |
| Recorded the whole monitor | Captured the terminal and other tab titles | Window capture (`e2e-record`) |
| `hyprctl dispatch workspace 3` | Silently did nothing: this Hyprland takes Lua syntax | `hyprctl dispatch 'hl.dsp.focus({workspace = 3})'` |
| Commit author email not on the Vercel team | CLI deploy blocked | TK added the email to their Vercel account; if it recurs, tell TK |
| Clicked by coordinates after a scroll | Navigated away mid-answer | Use accessibility refs |
| Took chat echo as proof an answer was saved | Two answers silently lost (R1/R2) | Verify persisted state |

## 11. Founders-demo run (2026-09-25, run 02): what changed

- **Use Brave, not Chromium.** Chromium quit on its own twice mid-run (09:47 and 13:59; clean exits, no crash or OOM), which TK says is a known issue with Chromium on this machine. Brave is Chromium-based, and both native hosts (`com.anthropic.claude_code_browser_extension`, `com.openai.codexextension`) are already registered under `~/.config/BraveSoftware/Brave-Browser/NativeMessagingHosts`. Use a dedicated Brave profile `alvira-e2e` with both extensions. The recorder's saved window choice does not follow a new window, so TK picks the window once more.
- **Keep ChatGPT signed out in the recorded profile.** The Codex extension needs a ChatGPT sign-in, and a signed-in ChatGPT tab in the recorded window shows TK's chat history. Give Codex its own profile (for example `alvira-e2e-codex`), and close every tab you did not open before recording.
- **A database reset does not clear the browser draft.** ALVIRA keeps `alvira:interview-draft:user:<id>:context` in localStorage, and it reappears in the Context Mirror after a DB reset (attempt 1 was voided for this). Before each take, on the preview origin run: `Object.keys(localStorage).filter(k=>k.startsWith('alvira:')).forEach(k=>localStorage.removeItem(k)); sessionStorage.clear()`, reload, and confirm there is no Context Mirror, popup or resume prompt.
- **Don't type long answers keystroke by keystroke.** Under recording load, the per-key re-render of a 1,000-character answer froze the page (attempt 2). Set the textarea with the native value setter, dispatch `input`, then press Enter.
- **Recorder load.** `e2e-record` now defaults to 20fps at 1260x800 (full-size 30fps CPU encoding used a whole core).
- **Source the agent's context from TK's signed-in ChatGPT first,** with TK's go-ahead and off camera. Ask for a briefing with every item tagged stated or inferred and dated. My own notes were stale and missed major items, which is why TK's blind review scored the run-01 POST answer 2/5 on "would follow it".
- **Sensitive context split.** In a recorded demo, file only non-sensitive context. Afterwards, off camera, add sensitive items (identity, housing and legal, exact finances) to the same profile, labelled sensitive with release conditions.
- **Blind tests have three arms:** A anonymous, B signed-in ChatGPT (its own memory), C anonymous + ALVIRA brief. B is the real competitor. Capture it before anyone signs ChatGPT out of the profile.

## 12. Demo persona (use for anything that may be shown publicly)

The E2E test account is bound to a **fictional persona, Wren Calloway**: see `docs/e2e/persona/PERSONA.md`. Recordings for the public site or ASHWOOD builds use Wren, never TK's real Context. The agent's source is `docs/e2e/persona/wren-source-briefing.md`, standing in for "what Wren's other AI knows". Use the persona's frozen demo prompt. TK's real Context belongs to TK's own account, not the test account.
