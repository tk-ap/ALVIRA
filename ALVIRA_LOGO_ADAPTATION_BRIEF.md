# ALVIRA Logo Adaptation Brief

**Prepared:** 2026-08-02  
**Status:** User-selected design direction; production adaptation required  
**Reference asset:** `assets/brand/alvira-logo-context-frame-v3.png`

> This visual direction was selected from exploratory concepts. It should be treated as the approved direction for an implementation pass, not as finished production artwork. The broader brand interpretation remains based on the post–Revision 11 working product hypothesis rather than owner-ratified product strategy.

## Objective

Adapt the ALVIRA website and product interface to use the selected **Context Frame** logo direction.

The logo should communicate:

```text
Technical structure around an irreducibly human center.
```

Preserve the clean, elevated, product-focused design of the current site. This is a focused brand-identity update, not authorization to redesign unrelated pages or components.

## Source of Truth

Use this local reference image:

```text
/Users/TKAP/Documents/ALVIRA/assets/brand/alvira-logo-context-frame-v3.png
```

The reference contains:

- Four open corner brackets forming a context frame
- One asymmetrical human form using ALVIRA's existing primary accent
- One smaller context point using an existing neutral or a second tone of the same accent
- The uppercase wordmark `ALVIRA`
- A deep ink-black presentation background

Do not use the full 1920 × 819 concept image directly in the navigation. It includes presentation spacing and a background and is not optimized as a production logo asset.

## Brand Meaning

### Context Frame

The four open corners represent ALVIRA's technical structure, boundaries, and ability to organize context.

The frame must remain open. It should not become a closed square, camera icon, scanning reticle, QR-code motif, or surveillance symbol.

### Human Form

The larger irregular accent-colored form represents lived human experience: contextual, evolving, and not reducible to perfect geometry.

It should remain intentionally asymmetrical but visually balanced.

### Emerging Context Point

The smaller point represents new, unresolved, or adjacent context. Its color must come from ALVIRA's existing palette rather than introducing the concept image's clay hue as a new brand color.

It is secondary to the main human form and must not resemble a notification badge, status error, planet, or decorative dot.

### Wordmark

The wordmark should feel:

```text
Contemporary
Humanist
Precise
Quietly editorial
Technically credible
```

Avoid generic geometric SaaS lettering, futuristic display fonts, traditional luxury serif typography, and excessive letter spacing.

## Required Production Assets

Create the following assets from the selected direction:

```text
public/brand/alvira-logo-lockup-dark.svg
public/brand/alvira-logo-lockup-light.svg
public/brand/alvira-logo-mark-dark.svg
public/brand/alvira-logo-mark-light.svg
public/brand/alvira-logo-monochrome.svg
public/favicon.svg
public/favicon-32x32.png
public/apple-touch-icon.png
```

Adapt paths if the project uses a different public-asset convention, but keep the filenames descriptive and centralized under one brand directory.

### Asset Definitions

#### Dark Lockup

- Transparent background
- Warm mineral-white frame and wordmark
- Human form using the site's existing primary accent token
- Context point using an existing neutral or an accessible second tone of the same accent
- Intended for the current dark website

#### Light Lockup

- Transparent background
- Deep ink frame and wordmark
- Existing ALVIRA accent colors retained only when contrast remains sufficient
- Intended for light mode

#### Logo Mark

- Symbol only
- No wordmark
- Simplified and optically corrected for small sizes
- Must remain recognizable at 24 × 24 pixels

#### Monochrome Mark

- One foreground color only
- No dependence on color differences to remain understandable
- Suitable for printing, email signatures, and restricted-color environments

## Vector Adaptation Requirements

- Reconstruct the mark as clean vector geometry.
- Use the concept image as visual reference rather than tracing its background or raster artifacts.
- Preserve the four open corners and two internal forms.
- Simplify internal forms enough to remain legible at favicon size.
- Use as few vector paths as practical.
- Remove unused groups, masks, filters, metadata, and hidden elements.
- Use `currentColor` where appropriate in monochrome assets.
- Provide a meaningful SVG `<title>` only when the SVG itself is exposed as semantic content.
- Avoid embedded raster images inside SVG files.
- Avoid gradients, glow, filters, shadows, bevels, strokes that blur at small sizes, and unnecessary animation.

## Color-System Requirements

The production logo must use the website's existing color palette. The colors shown in the generated concept are compositional references, not new approved brand tokens.

Before creating the final logo assets:

1. Inspect the site's theme, CSS variables, Tailwind configuration, design-token files, and existing component colors.
2. Identify the actual dark background, light background, primary foreground, muted foreground, border, and primary accent tokens.
3. Map every logo color to those existing semantic tokens.
4. Document the mapping in the implementation handoff.

Use this semantic mapping:

```text
Logo background presentation → existing page or navigation background
Frame and wordmark          → existing primary foreground
Human form                  → existing primary brand/accent color
Context point               → existing neutral highlight or a second
                              accessible tone of the same accent
```

Requirements:

- Do not introduce the concept image's clay/orange hue unless an equivalent color already exists in the production design system.
- Do not create a new accent palette solely for the logo.
- Prefer one site accent plus foreground and neutral tones.
- Preserve the logo's meaning through size, shape, and position rather than depending on two different accent hues.
- If SVG assets require fixed colors, use values sourced from the existing tokens and document their token origins.
- If the logo is rendered as an inline component, use semantic CSS variables or `currentColor` where practical.
- Ensure light-mode and dark-mode variants use the corresponding existing theme tokens.
- Verify contrast in the actual navigation, footer, onboarding, and metadata contexts.

## Wordmark Adaptation

### Preferred Approach

Use a properly licensed humanist sans-serif already available in the project or from an approved project dependency.

Inspect the current typography before adding a new font. Prefer reuse when it can approximate the reference without weakening the identity.

### Requirements

- Render `ALVIRA` exactly in uppercase.
- Use optically balanced letter spacing.
- Ensure the `I` remains visibly separate from the `V` and `R`.
- Do not outline or distort a font without retaining a maintainable source.
- Do not use an AI-generated raster wordmark as production text.
- If the selected font cannot reproduce the concept convincingly, use live text for the initial implementation and document the remaining custom-lettering work.

## Website Placement

### Desktop Navigation

Use the horizontal logo lockup.

Recommended visible height:

```text
28–34px
```

Requirements:

- Preserve existing navigation height unless the logo demonstrably requires a small adjustment.
- Maintain sufficient clear space around the lockup.
- Link the logo to the homepage.
- Do not allow the wordmark to wrap.
- Do not add the tagline to the navigation logo.

### Mobile Navigation

Use either:

```text
Symbol + compact ALVIRA wordmark
```

or, at the narrowest supported width:

```text
Symbol only
```

Do not shrink the complete lockup until it becomes illegible. Preserve a minimum 44 × 44-pixel interactive target for the home link even if the visible mark is smaller.

### Footer

Use the horizontal lockup or a restrained stacked arrangement.

The footer may include the descriptor as separate HTML text:

```text
Human context for AI.
```

Do not bake the descriptor into the logo asset.

### App and Onboarding

- Replace the existing generic `A` icon where it functions as the ALVIRA brand mark.
- Use the symbol-only asset for compact app surfaces.
- Use the full lockup on entry, authentication, and onboarding pages when space permits.
- Do not replace unrelated interface icons with the brand mark.

### Metadata and Sharing

- Update the favicon.
- Update the Apple touch icon.
- Inspect the web manifest and update applicable app icons.
- Inspect Open Graph and social-sharing assets.
- If a branded social card exists, update it using the new lockup without redesigning unrelated content.

## Accessibility Requirements

- Give linked logo images an accessible name such as `ALVIRA home`.
- Treat purely decorative repeats as hidden from assistive technology.
- Do not rely on color differences alone to communicate meaning.
- Verify visible focus treatment around the logo link.
- Check the light and dark variants against their actual backgrounds.
- Ensure the mark remains identifiable under grayscale and increased-contrast conditions.
- Do not place essential text inside a raster image.

## Responsive Requirements

Test at minimum:

```text
1440px desktop
1280px desktop
768px tablet
390px mobile
320px narrow mobile
```

Verify:

- The logo does not collide with navigation actions.
- The wordmark never wraps.
- The navigation does not become taller because of the logo.
- The mark remains crisp on high-density displays.
- The home-link target remains at least 44 × 44 pixels on touch devices.
- Light-mode and dark-mode assets switch correctly.

## Constraints

- Do not redesign the homepage, pricing, MeOS, or onboarding experience as part of this task.
- Do not change approved product copy.
- Do not reuse the previous layered-`A` or arch concepts.
- Do not reinterpret the frame as a camera, scanner, target, or surveillance icon.
- Do not add a logo animation in the first implementation.
- Do not introduce glow, particles, gradients, 3D effects, or cyberpunk styling.
- Do not use the concept PNG as the final navigation asset.
- Do not overwrite the original concept files.
- Do not delete existing assets until all references have been migrated and verified.

## Implementation Sequence

1. Inspect the existing logo component, header, footer, metadata, manifest, theme tokens, and current asset paths.
2. Identify every existing ALVIRA logo and favicon reference.
3. Create production-ready vector variants from the Context Frame direction.
4. Implement the horizontal lockup in the desktop navigation.
5. Implement the responsive mobile treatment.
6. Update the footer, app entry, and onboarding brand placements.
7. Update favicon, touch icon, manifest, and applicable metadata.
8. Verify light and dark themes.
9. Run the project’s lint, type, build, and relevant test commands.
10. Capture desktop and mobile screenshots for visual review.
11. Report all changed files, any unresolved typography licensing issue, and any remaining raster-to-vector refinement needed.

## Acceptance Criteria

- The live site uses the selected Context Frame direction.
- The previous generic `A` mark is removed from active brand placements.
- The logo is implemented as production vector artwork, not the full concept PNG.
- The symbol has four open corners, one primary-accent human form, and one secondary context point using the existing palette.
- No unapproved hue is introduced by the logo implementation.
- Every production logo color is mapped to and documented against an existing site token.
- `ALVIRA` is spelled correctly and remains legible at navigation size.
- Dark, light, symbol-only, and monochrome variants exist.
- Desktop and mobile navigation remain balanced and uncluttered.
- The logo link is accessible and keyboard focus is visible.
- Favicon and applicable app metadata use the new mark.
- No unrelated page redesign or copy change is introduced.
- The implementation passes existing lint, type, build, and relevant tests.
- Desktop and mobile screenshots are included in the handoff.

## Handoff Format

Report:

```md
## Files Changed

- `path/to/file` — summary

## Assets Created

- `path/to/asset` — intended use

## Verification

- Lint: pass/fail
- Types: pass/fail
- Build: pass/fail
- Desktop visual check: pass/fail
- Mobile visual check: pass/fail
- Light mode: pass/fail
- Dark mode: pass/fail

## Remaining Brand Work

- Any custom lettering, licensing, or optical refinement still required
```
