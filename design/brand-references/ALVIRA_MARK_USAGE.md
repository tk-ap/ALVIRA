# ALVIRA Primary and Secondary Mark Usage

## Status and Authority

- **Primary mark direction:** Owner-approved on 2026-08-02.
- **Secondary mark direction:** Owner-approved on 2026-08-02.
- **Implementation status:** Reference-only; no production website assets or components are changed by this guidance.
- **Product-direction note:** These are post–Revision 11 owner-approved brand decisions. They do not modify ALVIRA's owner-ratified product strategy.
- **Working-hypothesis note:** The specific placement examples, minimum-size guidance, and responsive behavior below are implementation recommendations until validated in production.

## Shared Construction

Both marks use the exact visible string:

```text
ALVIRA/>
```

Shared requirements:

- Do not add an opening `<` character.
- `ALVIRA` uses the existing soft MeOS brown.
- `/` uses the existing ALVIRA teal.
- `>` uses the same soft MeOS brown as `ALVIRA`.
- Preserve the wide, geometric, editorial letterforms and established character spacing.
- Do not add gradients, glow, shadows, bevels, textures, outlines, or decorative animation to the core marks.
- Production assets must have transparent backgrounds. The black backgrounds in the PNG references are presentation surfaces only.
- Resolve colors from existing design tokens or CSS variables. Do not introduce approximate hard-coded colors when established tokens exist.

## Primary Mark

### Reference

- File: `source/2026-08-02/alvira-primary-wordmark-balanced-v1.png`
- Role: Default ALVIRA identity.

### Use the primary mark for

- global website navigation;
- product headers and authenticated application chrome;
- login and account surfaces;
- pricing and checkout surfaces;
- compact placements;
- mobile layouts when the full wordmark remains legible;
- routine brand identification where clarity should lead expression.

### Primary-mark requirements

- Keep the mark free of lines or additional motifs.
- Maintain the two-color distribution: brown `ALVIRA`, teal `/`, brown `>`.
- Prefer this mark whenever the secondary axis would appear crowded or resemble a text strikethrough.
- At very small sizes, use an approved compact mark rather than compressing or artificially emboldening this wordmark.

## Secondary Mark

### Reference

- File: `source/2026-08-02/alvira-secondary-axis-wordmark-v1.png`
- Role: Expressive editorial identity.

### Concept

The teal axis represents ALVIRA's living knowledge system: a continuous technical structure moving through human context without flattening it. The soft-brown letterforms represent lived experience and human knowledge. The integrated `/>` connects that human material to ALVIRA's software architecture.

### Use the secondary mark for

- homepage or campaign hero moments;
- product-introduction sections;
- launch graphics and social assets;
- presentation covers;
- editorial dividers or chapter openings;
- onboarding completion or knowledge-compilation milestones;
- other large, intentional brand moments.

### Do not use the secondary mark for

- favicons or app icons;
- small mobile headers;
- dense navigation;
- form controls, buttons, or inline text;
- any placement where the axis becomes visually indistinguishable from a strikethrough;
- light backgrounds until a reviewed light-surface variant exists.

### Secondary-mark construction

- The teal axis must be thin, perfectly horizontal, and aligned through the optical midpoint of the full lockup.
- The axis sits behind the brown `ALVIRA` letterforms and behind the brown `>`; brown strokes remain visually uninterrupted.
- The axis appears only through counters, interior negative spaces, and gaps between brown forms, creating one implied continuous line.
- The teal axis intersects and merges cleanly with the teal `/` without a node, bump, glow, or doubled stroke.
- Preserve the short teal entry segment before the first `A` shown in the approved reference.
- Resolve the right endpoint into the pointed tip of `>`; do not leave a teal tail beyond it.
- Use subtle rounded line caps where exposed.

## Hierarchy Rule

The primary mark identifies ALVIRA. The secondary mark expresses how ALVIRA works.

When uncertain, use the primary mark.

## Production Adaptation

The supplied PNGs are visual references, not production-ready navigation assets.

For implementation:

1. Rebuild both marks as precise SVG assets with transparent backgrounds.
2. Use shared geometry so primary and secondary marks align when swapped in the same layout slot.
3. Preserve the approved color roles using existing site tokens.
4. Keep source references unchanged under `design/brand-references/`.
5. Store reviewed production derivatives under `public/brand/`.
6. Verify desktop, mobile, dark-surface, reduced-motion, and high-density display behavior before merge.

## Accessibility

- Provide an accessible label of `ALVIRA` when either mark functions as a link.
- Treat the SVG as decorative when adjacent accessible text already names the brand.
- Verify contrast against every intended surface.
- Do not use the secondary axis as the only way to communicate state, progress, or meaning.

## Acceptance Criteria

- [ ] Primary and secondary assets display exactly `ALVIRA/>`.
- [ ] Both marks use the same wordmark geometry, spacing, brown, and teal.
- [ ] The primary mark contains no axis.
- [ ] The secondary axis sits behind brown forms and integrates cleanly with `/` and `>`.
- [ ] The secondary axis cannot be mistaken for an accidental strikethrough at intended sizes.
- [ ] Production assets use transparent backgrounds and existing color tokens.
- [ ] Reference PNGs remain unchanged and are not imported by application code.
- [ ] The primary mark remains the default for navigation and compact product surfaces.
- [ ] The secondary mark is reserved for larger editorial brand moments.
