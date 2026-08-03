# ALVIRA Logo Fidelity Fix Brief

## Status

- This is an implementation recommendation based on the owner's selected `Context Frame v3` logo direction.
- This brief does not change the Revision 11 owner-ratified product strategy.
- Any product-positioning assumptions from Revision 15 remain working hypotheses; this task is limited to visual identity fidelity and responsive logo behavior.

## Objective

Update the live ALVIRA header logo so it visibly matches the selected Context Frame v3 direction instead of appearing as a generic bold wordmark with a simplified focus-frame icon.

## Source of Truth

- Visual reference: `/Users/TKAP/Documents/ALVIRA/assets/brand/alvira-logo-context-frame-v3.png`
- Live site: `https://alvira.ctonew.app/`
- Current deployed assets:
  - `/brand/alvira-logo-lockup-dark.svg`
  - `/brand/alvira-logo-lockup-light.svg`
  - `/brand/alvira-logo-mark-dark.svg`
  - `/brand/alvira-logo-mark-light.svg`

Use the PNG as a visual reference only. Do not ship the full 1920 × 819 presentation image as the header logo because it includes a black background and large surrounding whitespace.

## Confirmed Problems in the Current Implementation

### 1. The full logo disappears too early

At the observed 591 px viewport, the header uses `sm:hidden` to replace the full lockup with the icon-only mark. This is why the site can appear not to contain the selected logo at all.

### 2. The deployed wordmark does not match the reference

The deployed dark SVG currently uses live SVG text with approximately these settings:

```svg
font-family="Inter, 'Helvetica Neue', Arial, sans-serif"
font-size="58"
font-weight="600"
letter-spacing="0.01em"
```

This creates a heavy, conventional sans-serif wordmark. The selected reference uses a lighter, wider, more editorial geometric construction with substantially more breathing room.

External SVG files loaded through `<img>` cannot safely rely on the site's webfont. The wordmark may therefore fall back to Helvetica or Arial and render differently across environments.

### 3. The symbol has been over-simplified

The current human form reads as a regular diagonal capsule. In the reference it is an irregular, softly asymmetrical organic form. That asymmetry is what balances the technical frame with a sense of human complexity.

### 4. The context point is nearly lost

The current dot is extremely small and uses a muted gray-brown. At header size it becomes visually insignificant. The reference uses a clearly visible warm context point.

### 5. The desktop lockup is underscaled

At the observed desktop viewport, the lockup renders at roughly `131 × 28 px`. The icon and wordmark lose the proportion, spacing, and presence of the reference at that size.

## Required Changes

### A. Rebuild the production SVGs from the selected visual

1. Recreate the Context Frame mark as vector geometry.
2. Preserve the four separate open corner brackets; never connect them into a box.
3. Recreate the teal human form as an irregular organic shape, not a symmetrical pill or capsule.
4. Preserve a visible warm context point near the upper-right of the human form.
5. Recreate the wordmark with the thin, geometric, editorial proportions shown in the reference.
6. Convert the finished wordmark letters to vector paths.
7. Do not leave the wordmark as an SVG `<text>` element.
8. Use a transparent SVG canvas with a tight viewBox around the artwork.
9. Do not add texture, glow, gradients, shadows, or a black rectangle to the production asset.

### B. Preserve the intended proportions

The lockup should retain these visual relationships from the reference:

- The framed mark is approximately twice the visual height of the wordmark's capital letters.
- The wordmark is light and spacious, not bold or condensed.
- The gap between the symbol and the `A` is deliberate and generous.
- The context point remains legible at the smallest supported logo size.
- The `A` and `V` retain sharp geometric diagonals; the `R` should not look like a default system-font glyph.

### C. Correct responsive behavior

- Show the full horizontal lockup at `sm` and larger as currently intended.
- Recommended improvement: keep the full lockup visible down to approximately `480 px` when the header has enough horizontal space.
- Use the icon-only mark only below that compact breakpoint.
- Do not hide the wordmark merely because the viewport is narrower than `640 px`.
- Confirm that the logo never collides with the CTA, theme control, or mobile menu.

Recommended sizing targets:

```text
Desktop lockup: 32 px high, approximately 150–175 px wide
Tablet lockup: 28–30 px high
Compact/mobile mark: 34–36 px square
Minimum clear space: at least 12 px around the visible artwork
```

These are starting targets, not rigid dimensions. Adjust within the existing header grid to preserve balance.

### D. Match the existing ALVIRA palette

- Use the site's existing off-white foreground token for the dark-mode wordmark and frame.
- Use the site's existing dark foreground token for the light-mode wordmark and frame.
- Use the existing ALVIRA teal token for the organic human form.
- For the context point, use the closest existing warm/clay accent token. Do not introduce a second unrelated orange.
- Ensure the light and dark variants remain visually equivalent rather than merely inverting every color.

### E. Preserve semantics and interaction

- Keep the logo linked to `/`.
- Keep the link's accessible name as `ALVIRA home`.
- Decorative logo images should remain `alt=""` and `aria-hidden="true"` because the link already supplies the accessible name.
- Preserve the current focus-visible treatment and minimum 44 × 44 px interactive target.

## Do Not

- Do not use the reference PNG directly in the header.
- Do not approximate the logo with CSS art, text symbols, or a generic icon library.
- Do not use live `<text>` inside the production logo SVG.
- Do not replace the organic form with a standard rounded rectangle.
- Do not make the wordmark bold to improve small-size legibility; increase the overall logo size instead.
- Do not redesign the surrounding navigation or homepage as part of this task.

## Responsive Test Matrix

Verify the homepage header in both light and dark modes at:

| Viewport | Expected logo |
|---|---|
| 375 px | Icon-only mark, fully legible |
| 480 px | Full lockup if controls fit; otherwise icon-only mark |
| 591 px | Full lockup |
| 768 px | Full lockup |
| 1440 px | Full lockup with intended editorial presence |

## Acceptance Criteria

- The live logo is immediately recognizable as the selected Context Frame v3 concept.
- The desktop wordmark is thin, geometric, and spacious rather than bold or system-font-like.
- The teal form is visibly organic and asymmetrical.
- The warm context point is visible at all supported sizes.
- The full lockup remains visible at 591 px.
- All letters are vector paths; the SVG contains no `<text>` element.
- SVG viewBoxes are tightly cropped and backgrounds are transparent.
- Dark and light variants use existing site color tokens or their exact exported values.
- The header has no overlap or layout shift at the tested breakpoints.
- The home link retains its accessible name, keyboard focus visibility, and 44 × 44 px minimum target.

## Verification Deliverables

Before declaring the task complete, provide:

1. The four final production SVG files.
2. A side-by-side image showing the selected reference and the final desktop header.
3. Header screenshots at 375 px, 591 px, and 1440 px in dark mode.
4. At least one light-mode screenshot.
5. Confirmation that the final SVG source contains no `<text>` elements.
