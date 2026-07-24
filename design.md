# Design — Restaurateur Pro

A locked interface system for Restaurateur Pro. Every page and module reads this
file before visual changes are made.

## Genre

Modern-minimal luxury, grounded in Blue Collar Apps Trench Design. Luxury comes
from proportion, disciplined typography, clear hierarchy, and quiet surfaces.
Fire Orange is a control signal, never a broad fill.

## Audience and job

Restaurant owners, operators, and hospitality students use the product to move a
restaurant project from concept through site selection, build-out, opening, and
ongoing financial operations. The primary action is to identify the next
operational decision and act on it without losing project context.

## Macrostructure family

- Marketing pages: Marquee Hero with an N9 edge-aligned navigation and Ft5
  statement footer.
- App pages: Workbench with an N3 persistent side rail, compact project context,
  and data-first work surfaces.
- Content and transaction pages: Long Document rhythm with the same tokens and
  compact N9 navigation.

## Theme

- Paper: Obsidian `#0D0D0D`
- Surface 1: `#141414`
- Surface 2: `#1E1E1E`
- Surface 3: `#2A2A2A`
- Ink: warm white `#F4F1EC`
- Accent: Fire Orange `#EC5B13`, capped at roughly five percent per viewport
- Edges: one-pixel neutral rules; shadows only for elevation-critical overlays
- Radius: hard-edged, 6px maximum for large surfaces

## Typography

- Display: Bebas Neue 400, upright
- Body: DM Sans 400–700
- Data: IBM Plex Mono 400–600
- Display tracking: `0.015em`
- Labels: `0.11em`, used only when they improve scanning

## Spacing

Four-point scale defined in `tokens.css`. Production CSS consumes named tokens.

## Motion

- Functional transitions only: opacity and transform
- Standard easing: `--ease-out`
- No looping decorative animation
- Reduced motion: instant state changes or opacity-only transitions under 150ms

## Microinteractions

- Visible Fire Orange focus rings
- Silent success where the changed state is visible; existing transactional
  toasts remain for network actions
- Disabled, loading, error, and success states must remain distinct
- Hover never carries information that keyboard focus cannot expose

## CTA voice

- Primary: Fire Orange, dark ink, square 4px corners, direct verb-led copy
- Secondary: transparent, warm-white text, one-pixel rule
- Destructive: dark red reserved for irreversible or failed actions

## Per-page allowances

- Marketing may use one restrained hero texture.
- App pages use no decorative enrichment; operational data is the visual.
- Success pages may use a single status glyph without celebratory animation.

## What pages MUST share

Wordmark, typography, accent placement, focus treatment, button geometry,
surface hierarchy, table rhythm, and responsive navigation.

## What pages MAY differ on

Information density, module-specific chart colours, page-header controls, and
whether the work surface is table-, form-, or timeline-led.

## Exports

### CSS source of truth

See `tokens.css`.

### Tailwind mapping

Tailwind v3 maps the design tokens through `tailwind.config.js`. Semantic CSS
classes consume `var(--color-*)`, `var(--font-*)`, and the named spacing scale.

### DTCG

See `tokens.json`.

### shadcn/ui mapping

The existing shadcn variables in `frontend/src/index.css` map background,
foreground, card, primary, border, input, and ring to the locked tokens.
