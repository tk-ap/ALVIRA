# ALVIRA marketing homepage — UI rebalance brief

> **Status: post–Revision 11 working hypothesis. Not owner-ratified direction.**
>
> Everything in this brief is a **recommendation** produced by an agent design review on 2026-09-05, not an approved requirement. The measurements in §5 are verified facts about the current deployment; the proposed grid, type scale, and hierarchy changes are proposals awaiting owner ratification. Nothing here supersedes Revision 11 or the owner-ratified addendum in `docs/CONTEXT_INTELLIGENCE_ROADMAP.md`.
>
> Do not implement from this document alone. It requires owner authorization first.

**Work item:** `alvira-ui-rebalance-2026-09-05` → [`.agent-os/work-items/alvira-ui-rebalance-2026-09-05.json`](.agent-os/work-items/alvira-ui-rebalance-2026-09-05.json), conforming to `tk-ap/agent-os` `contracts/work-item.schema.json`
**Owning product:** `alvira-meos` · **Routing source:** `registry/product-routing.yaml` · **Work item status:** `proposed`
**Surface:** ALVIRA public marketing homepage — `https://alviratech.vercel.app/`
**Prepared:** 2026-09-05

---

## 0. Read before starting

**Authorization.** The work item is `proposed`. Per the Agent OS Cross-Product Write Rule and this repository's `AGENTS.md`, implementation requires explicit owner authorization. This brief and its evidence are the proposal; they are not the go-ahead.

**Branching and merge.** Follow `AGENTS.md` → Shared Repository Safety: branch from latest `main` as `codex/<short-task-name>`, one short-lived branch, never commit to `main`, open a **draft** pull request, and satisfy the Merge Gate — including verification of desktop, mobile, light-mode and dark-mode states, since this is a visual change.

**Do not launch a browser to verify this work.** The Agent OS Codex browser adapter fails closed: `adapters/codex/browser.py` unconditionally appends *"provider receipt authentication is not implemented; caller trust flags are insufficient"*, so `prepare_codex_browser_execution` returns `BLOCKED` even with a complete attestation (`tests/test_codex_browser_adapter.py::test_caller_authenticated_complete_attestation_is_denied`). Rendered assertions in §7.2 are produced by the owner or another authorized surface and returned as evidence. You verify §7.1 only.

**Never pass `--no-sandbox` to any Chromium-family browser.**

**Human acceptance gate.** Agent OS `policies/HANDOFF_POLICY.md`: *"If the acceptance question is materially aesthetic or experiential, preserve a human acceptance gate. Agents may surface evidence and specific concerns but must not manufacture visual approval."* Surface before/after renders and assertion output. Do not record visual acceptance, and do not treat green mechanical assertions as proof the page looks right.

**Testing policy.** This surface is unauthenticated marketing, so the free-tier smoke account requirement in `AGENTS.md` does not apply unless a change reaches an authenticated surface. If it does, free-tier acceptance testing applies in full and comes first.

## 1. Objective

The homepage copy and colour palette are strong and must not change. The problem is **compositional**: section content does not sit on a shared grid, display type is set in columns too narrow for its size, and the type scale has a hole in the middle. The page reads as a series of separately-designed bands rather than one document.

Fix the grid, the display measure, the type scale, and header crowding. Do not rewrite the page.

## 2. Preserve contract — do not do these

- **Zero changes to user-facing copy.** Every headline, paragraph, label and button string stays byte-identical.
- No changes to the colour palette, brand teal, logo, or light/dark theme behaviour. Both themes currently render at identical height (5743px).
- No section reordering, additions, or removals.
- **No changes to the mobile layout.** At ≤640px the page is already well balanced — single column, headlines get full measure, the rag resolves. Every change below applies at `md:`/`lg:` and must leave base styles intact.
- No new CSS framework, component library, or animation library.
- Preserve the Context / Reflect / Bridge product relationship and Bridge's subordinate positioning as defined in `AGENTS.md`.

Agent OS quality railguards may reject unsupported or low-quality work but hold **no aesthetic authority** over deliberate ALVIRA product direction. Where this brief conflicts with repository-local art direction, the repository wins and the conflict is escalated rather than resolved unilaterally.

## 3. Reference images

Five annotated renders at 1440px, captured from the live deployment after `document.fonts.ready`, stored as design references under `design/brand-references/source/2026-09-05/`. The first four are full-page; the navigation audit is a header crop. Per that directory's rules they are **reference only and must never be loaded by the production website**.

| Image | What it shows |
|---|---|
| [`ui-audit-heading-axes.png`](design/brand-references/source/2026-09-05/ui-audit-heading-axes.png) | **The primary defect.** A coloured rule at each distinct heading left edge, full page height, with an occurrence count per axis. Every heading is boxed and labelled with its x, column width, size and line count. |
| [`ui-audit-proposed-12col-grid.png`](design/brand-references/source/2026-09-05/ui-audit-proposed-12col-grid.png) | **The proposed target.** A 12-column / 1200px / 24px-gutter grid overlaid on the current page, with columns 1 and 5 highlighted as the only two proposed content axes. |
| [`ui-audit-display-measure.png`](design/brand-references/source/2026-09-05/ui-audit-display-measure.png) | **Task 2 scope.** Every ≥56px heading boxed — red where its column is under 640px, teal where it is not — with a dashed 640px minimum-measure bar beneath each failing heading. |
| [`ui-audit-section-rhythm.png`](design/brand-references/source/2026-09-05/ui-audit-section-rhythm.png) | **Task 6 scope.** Each `<section>` banded and labelled with height and padding, existing padding hatched. Red bands are the four sections with zero vertical padding. |
| [`ui-audit-navigation.png`](design/brand-references/source/2026-09-05/ui-audit-navigation.png) | **Task 9 scope.** The header with every interactive item's width and every inter-item gap marked. Yellow gaps are 15–16px; the single teal 33px gap is the only grouping signal in the bar. |

Read the heading-axes and display-measure images before touching code. They make the diagnosis checkable rather than something to take on trust.

## 4. Discovery

Locate the homepage sections by searching for these strings, which are unique to the page:

```bash
rg -l "The harder part is knowing what matters"      # hero
rg -l "What could you use some help with"            # use-case selector
rg -l "AI can help. ALVIRA helps it help you"        # Without/With comparison
rg -l "Context is just the useful background"        # six-facet context section
rg -l "You do not build a perfect profile"           # 01/02/03 steps
rg -l "Context Intelligence\."                       # technical-category section
rg -l "should not be trapped in one conversation"    # Bridge / reuse section
rg -l "What could AI help you with if it understood" # closing CTA
```

Also locate the Tailwind config — Tasks 3, 6 and 7 add tokens to it. Record resolved paths in the pull request.

## 5. Measured evidence

Verified facts about the current deployment. Headless Chromium with native sandbox enabled, **1440×900**, `deviceScaleFactor: 2`, measured after `networkidle` and `document.fonts.ready`.

### 5.1 Heading left edges — the primary defect

| Section heading | Element | Left edge | Column width | Size |
|---|---|---|---|---|
| AI can do almost anything… | H1 | **120** | 791px | 90.72px |
| What could you use some help with? | H2 | **504** | 768px | 60px |
| AI can help. ALVIRA helps it help you. | H2 | **178** | 379px | 60px |
| Context is just the useful background. | H2 | **120** | 360px | 60px |
| You do not build a perfect profile… | H2 | **528** | 768px | 60px |
| Context Intelligence. | H2 | **887** | 433px | 60px |
| Your understanding should not be trapped… | H2 | **120** | 437px | 60px |
| What could AI help you with… | H2 | **224** | 992px | 72px |

**8 headings across 6 distinct axes** — `120` (×3), `178`, `224`, `504`, `528`, `887`.

The diagnostic pairs are **504 vs 528** (24px apart) and **178 vs 120** (58px apart): too close to read as intentional, too far to read as aligned. That near-miss is what makes the page feel unbalanced rather than merely asymmetric.

### 5.2 Section vertical rhythm

| § | Height | padding-top | padding-bottom |
|---|---|---|---|
| 1 | 1230px | 112px | 112px |
| 2 | 907px | 0 | 0 |
| 3 | **428px** | 0 | 0 |
| 4 | 590px | 96px | 96px |
| 5 | 796px | 0 | 0 |
| 6 | 449px | 0 | 0 |
| 7 | 510px | 96px | 96px |
| 8 | 700px | 0 | 0 |

Four of eight sections carry no padding and rely on ad-hoc internal spacing. The 428px band adjacent to the 1230px band is the most visible discontinuity.

### 5.3 Type scale in use

`90.72, 72, 60, 24, 16, 14, 12, 11, 10, 9` px — **nothing between 24 and 60.**

Utility frequency in the served HTML: `text-sm` ×31, `text-[10px]` ×18, `text-xs` ×15, `text-base` ×7, `text-5xl` ×7. The page either shouts or whispers; there is no middle register.

### 5.4 Display weight

H1 renders at `font-weight: 600`. **Every H2 renders at `font-weight: 400`**, all at 60px — so section heads read thin and washed out beside the hero.

### 5.5 Hardcoded greys bypassing the token system

Seven near-identical arbitrary values sit alongside the existing `ink` / `mineral` / `warm-gray` tokens:

`#27231f` · `#2c2824` · `#4d453e` · `#5f554c` · `#5f574f` · `#6d6258` · `#74685e`

All fall in one narrow band, so hierarchy is expressed through differences the eye cannot rank.

### 5.6 Accessibility baseline — already good, protect it

106 text nodes checked against composited backgrounds, with `oklab()` colours resolved to sRGB. Only two fall below WCAG AA:

- `Context Intelligence` header tagline, 9px — **3.99:1** (needs 4.5)
- `Without ALVIRA` label, 10px — **3.83:1** (needs 4.5)

Everything else passes; the 10px nav passes at 4.91:1. **No change may reduce any text below 4.5:1, or 3:1 at ≥24px.**

## 6. Proposed tasks

All recommendations. Tasks 1–3 are the substance; 4–8 are follow-through.

### Task 1 — One grid, two axes

**Highest impact. This single change would resolve most of the imbalance.**

Define a 12-column grid on a shared section container: `max-width: 1200px`, centred, `padding-inline: 120px` at `lg`, 24px gutter.

Every section's content starts at **column 1 or column 5** — no other value:

| Section | Current | Proposed |
|---|---|---|
| Hero | 120 | col 1 |
| What could you use some help with? | 504 | col 5 |
| AI can help. ALVIRA helps it help you. | 178 | col 1 |
| Context is just the useful background. | 120 | col 1 |
| You do not build a perfect profile… | 528 | col 5 |
| Context Intelligence. | 887 | col 5 *(see Task 5c)* |
| Your understanding should not be trapped… | 120 | col 1 |
| What could AI help you with… | 224 | col 1 |

### Task 2 — Display measure

60px type currently runs in 360–437px columns — roughly 5–6 characters per line, forcing four-line headings with severe rag. The closing headline meanwhile gets 72px in 992px: the same typographic role at 2.75× the measure.

Per heading, apply one of two rules:

- **Column ≥640px** → keep 60px.
- **Column <640px** → widen the column to ~640–720px, **or** step the heading down to **40–44px**.

The four failing headings are marked red in `ui-audit-display-measure.png`: *AI can help. ALVIRA helps it help you.* (379px), *Context is just the useful background.* (360px), *Context Intelligence.* (433px), *Your understanding should not be trapped in one conversation.* (437px).

### Task 3 — Close the type-scale gap

- Add **32px** and **40px** display steps to the Tailwind theme.
- Promote sub-section headings (currently 24px) into the 32px step where they lead a block.
- Raise prose body from **14px → 16px**. Keep 14px for captions, metadata and labels only.

Target: no more than two consecutive steps in the rendered scale differ by more than 1.6×.

### Task 4 — Unify display weight

Pick one weight for the display role — **600 recommended**, matching the hero — and apply it to every heading ≥40px.

### Task 5 — Hierarchy corrections

**5a. Hero emphasis is inverted.** "AI can do almost anything." carries full-strength cream; "The harder part is knowing what matters." — the thesis of the page — is muted warm grey. Swap the emphasis so the second sentence carries full strength.

**5b. Hero right column.** The "If you have never used AI this way" card begins ~600px down, leaving the entire top-right quadrant empty, and its heading is large enough to compete with the H1. Raise it to align to a grid line in the upper half and drop it one step below the H1's size, so there is a single headline-scale voice per viewport.

**5c. Without/With comparison.** The strongest idea on the page, rendered as two visually identical columns separated only by a small teal label and a 1px rule — a contrast that should be seen before it is read. Give "With ALVIRA" real weight: a panel background, a border, or a size step. The `Without ALVIRA` label is also one of the two contrast failures in §5.6; fix it here.

### Task 6 — Regularise section rhythm

Replace per-section ad-hoc padding with two tokens applied to every section: **`--section-y: 96px`** standard, **`--section-y-lg: 128px`** for the hero and closing CTA. Remove the four `padding: 0` cases in §5.2.

### Task 7 — Collapse the greys to tokens

Replace the seven arbitrary hex values in §5.5 with three semantic roles — `text-primary`, `text-secondary`, `text-muted` — mapped onto the existing `ink` / `mineral` / `warm-gray` scale, each with a correct `dark:` counterpart. Three clearly separated roles will do the job the seven values are failing to do.

### Task 8 — Minor type sizing

> **Correction (2026-09-05): Task 8 must not ship without Task 9.**
> Raising header type in isolation measurably worsens the crowding documented in Task 9. Simulated on the live page at 1440px, bumping every sub-12px header element to 12px increases header ink width by **+108px** and occupancy from **73.4% → 81.8%** of the inner container. It does not overflow — the flex layout absorbs it — but it spends the bar's entire remaining slack. Task 8 was written before the header was reviewed as a composition; the two changes are coupled.

- Header nav 10px → **12px**. It passes contrast at 4.91:1 but is undersized for a primary navigation.
- Header `Context Intelligence` tagline: see Task 9 — the recommendation is to **remove it from the header**, not resize it. If it is kept, it must go to 12px and resolve its 3.99:1 contrast.

### Task 9 — Reduce header crowding

The header carries **9 interactive items at 73.4% ink occupancy** of the 1280px inner container, leaving 80px of slack across the whole bar.

Item count is not the whole problem. Measured gaps at 1440px:

```
ALVIRA/> Context Intelligence  ·133·  How it helps ·16· Context ·15· Reflect
·16· Use elsewhere ·16· Pricing ·33· Sign In ·16· Start here ·16· [theme]
```

Every item after the wordmark is spaced at 15–16px. Five section links, the account link and the primary CTA sit at nearly identical intervals, so the bar parses as **one undifferentiated run of seven items** rather than navigation plus account/actions. The single 33px gap before "Sign In" is the only grouping signal and is too weak to chunk the bar.

Two further measurements:

- **The branding block is 375px** — 29% of the container — for wordmark plus the 9px "Context Intelligence" tagline. That tagline is the single largest space consumer in the bar and is also one of the two WCAG failures in §5.6.
- **The 133px gap after branding collapses to 24px at ≤1150px**, and the hamburger does not take over until **760px**. Between 1150px and 760px the full 9-item bar runs in visibly cramped space.

Recommended changes:

1. **Remove `Reflect` and `Use elsewhere` from the primary navigation.** Both remain reachable in-page and at their own routes. This is consistent with ratified architecture rather than a departure from it: `AGENTS.md` defines Bridge as "a gated secondary capability" that must stay "visible but subordinate," and says main navigation *may* link to the Bridge route — permissive, not required. Reflect likewise belongs inside the ALVIRA loop rather than being a separate commercial boundary. The page's stated audience is people who have never used AI, and "How it helps" is more legible to that reader than pillar names.
2. **Remove the "Context Intelligence" tagline from the header.** It is redundant with the hero, which states the category ~200px below the fold line, and removing it recovers the largest single block of header space while eliminating a contrast failure.
3. **Resulting primary nav: `How it helps · Context · Pricing`** — three links, then a clear separator, then `Sign In · Start here · [theme]`.
4. **Widen the navigation-to-actions separator to ~40px** so the bar reads as two groups rather than one run.
5. **Raise the hamburger breakpoint from 760px to ~1000px**, removing the cramped 1150–760px band entirely.

Measured effect of (1) combined with Task 8: occupancy returns to **70.2%** — better than today, with legible 12px type.

> **These cuts touch product-surface architecture and are a post–Revision 11 working hypothesis. They require owner ratification before implementation**, more so than Tasks 1–7, which are purely compositional.

## 7. Verification

### 7.1 Agent-verifiable (static, no browser)

```bash
# Copy is untouched — expect no user-facing string changes
git diff -- . ':!*.config.*' ':!*.css' | rg '^[+-]' | rg -v '^[+-]{3}' | rg -i '[a-z]{4,}\s+[a-z]{4,}'

# No arbitrary grey hex values remain
rg 'text-\[#(27231f|2c2824|4d453e|5f554c|5f574f|6d6258|74685e)\]'   # expect: no matches

# Type scale exposes the new steps
rg -n '32px|40px|2rem|2\.5rem' tailwind.config.*                     # expect: both present

# Spacing tokens defined and referenced
rg -n 'section-y' --stats                                            # expect: definition + 8 usages

# No sub-12px type remains
rg 'text-\[(9|10|11)px\]'                                            # expect: no matches
```

Additionally confirm by reading source: exactly two distinct content-start values (Task 1), one font weight on all headings ≥40px (Task 4), symmetric padding on every section (Task 6).

### 7.2 Owner-verifiable (rendered, requires a browser)

**Not to be run by the implementing agent** — see §0. Recorded here so the owner can produce the evidence and attach it to the work item. Launches with the sandbox intact.

```js
import { chromium } from 'playwright';

const URL = process.env.VERIFY_URL ?? 'http://localhost:5173/';
const browser = await chromium.launch();              // sandbox left enabled — never add --no-sandbox
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto(URL, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500);

const heads = await page.evaluate(() =>
  [...document.querySelectorAll('h1,h2')]
    .filter(h => h.getBoundingClientRect().width > 0)
    .map(h => {
      const r = h.getBoundingClientRect();
      const cs = getComputedStyle(h);
      return {
        x: Math.round(r.left),
        w: Math.round(r.width),
        size: parseFloat(cs.fontSize),
        weight: cs.fontWeight,
        lines: Math.round(r.height / parseFloat(cs.lineHeight)),
        text: h.textContent.trim().slice(0, 44),
      };
    })
);

let fail = 0;
const bad = (m) => { console.error('FAIL ' + m); fail++; };

const axes = [...new Set(heads.map(h => h.x))].sort((a, b) => a - b);
console.log('distinct heading axes:', axes);          // baseline was [120,178,224,504,528,887]
if (axes.length > 2) bad(`expected 2 heading axes, found ${axes.length}: ${axes}`);

for (const h of heads) {
  if (h.size >= 56 && h.w < 640) bad(`${h.size}px heading in ${h.w}px column — "${h.text}"`);
  if (h.size >= 40 && h.lines > 3) bad(`heading wraps to ${h.lines} lines — "${h.text}"`);
  if (h.size >= 40 && h.weight !== '600') bad(`display weight ${h.weight} ≠ 600 — "${h.text}"`);
}

const pads = await page.evaluate(() =>
  [...document.querySelectorAll('section')].map(s => {
    const cs = getComputedStyle(s);
    return [cs.paddingTop, cs.paddingBottom];
  })
);
pads.forEach(([t, b], i) => {
  if (t === '0px' || b === '0px') bad(`section ${i + 1} has zero vertical padding (${t}/${b})`);
  if (t !== b) bad(`section ${i + 1} padding asymmetric (${t}/${b})`);
});

console.log(fail === 0 ? '\nAll grid assertions passed.' : `\n${fail} assertion(s) failed.`);
await browser.close();
process.exit(fail === 0 ? 0 : 1);
```

Manual checks for the same pass, matching the `AGENTS.md` Merge Gate requirement to verify desktop, mobile, light and dark states:

1. **Both themes.** Page height identical light vs dark (currently 5743px both), no text losing contrast.
2. **Mobile untouched.** At 390×844, visually unchanged from the current deployment.
3. **Contrast.** WCAG AA pass with `oklab()` resolved to sRGB; the two known failures resolved, no new ones.

### 7.3 Quality railguard self-check

Before handoff, run the Phase-2 inspection in Agent OS `policies/QUALITY_RAILGUARDS.md` against the changed scope only: `task → produce → mechanical check → anti-slop inspection → minimal correction → diff review → human acceptance`. The inspection is not permission to reopen product strategy or redesign unrelated surfaces.

## 8. Definition of done

Agent asserts:

- [ ] Exactly two distinct content-start axes across sections
- [ ] No heading ≥56px in a column narrower than 640px
- [ ] Type scale includes 32px and 40px; prose body is 16px
- [ ] All headings ≥40px share one font weight
- [ ] Every section uses symmetric padding from the two spacing tokens
- [ ] Seven hardcoded greys replaced by three semantic tokens with `dark:` variants
- [ ] No sub-12px type remains
- [ ] Header reduced to 3 primary nav links with a ~40px navigation/actions separator
- [ ] Header ink occupancy at 1440px is at or below 72%
- [ ] Hamburger breakpoint raised to ~1000px
- [ ] Zero copy changes in `git diff`
- [ ] Quality-railguard self-check completed

Owner asserts (§7.2):

- [ ] No display heading wraps beyond 3 lines at 1440px
- [ ] Light and dark render at identical page height
- [ ] Mobile layout unchanged
- [ ] Two known contrast failures resolved, no new ones
- [ ] Assertion script exits 0

Gate:

- [ ] **Owner has ratified this direction** (it is currently a working hypothesis)
- [ ] **Owner has recorded visual acceptance.** Not assertable by any agent.

## 9. Return

Emit an `outcome-event` per Agent OS `contracts/outcome-event.schema.json` with status, artifacts, verification results, resolved file paths, and the acceptance state of the human gates.
