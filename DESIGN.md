# Restaunteur Pro Design System

Status: locked modernization target. Existing production pages remain unchanged
until their capability contracts are covered by tests.

## Direction

Restaunteur Pro is a working operator's command surface. It must feel like the
ticket rail, pass, steel, heat, and disciplined organization of a real
hospitality operation. It must not resemble a generic pastel or rounded SaaS
dashboard.

## Audience

Restaurant founders, operators, chefs, general managers, and project leaders
working through opening, stabilization, and expansion.

## Primary job

Show the operator what requires attention, provide the evidence behind it, and
let the operator complete the next action without losing context.

## Tone

Utilitarian, premium industrial, direct, controlled, and operational.

## Canonical tokens

```css
:root {
  --color-obsidian: #0d0d0d;
  --color-surface-1: #141414;
  --color-surface-2: #1e1e1e;
  --color-surface-3: #2a2a2a;
  --color-fire: #ec5b13;
  --color-text: #f5f5f2;
  --color-text-muted: #a3a3a0;
  --color-border: #343434;
  --color-focus: #ec5b13;
  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

Fire Orange is heat, not paint. Use it for focus, active state, critical emphasis,
and a small number of primary actions. Never use it as a broad page fill.

## Typography

- Display and section headers: **Bebas Neue**
- Body and controls: **DM Sans**
- Money, quantities, timestamps, IDs, and technical data: **IBM Plex Mono**

Headings are compact and decisive. Body copy is plain language. Operational data
must align and scan cleanly.

## Structure

- Dark-first.
- Square, hard-edged composition.
- Maximum radius: 8px.
- One-pixel borders.
- Minimal shadows.
- No glassmorphism.
- No decorative gradients across application surfaces.
- Subtle grain may appear in the public hero only.
- Desktop tables must become usable mobile records, not squeezed desktop tables.

## Interaction contract

Every interactive control must implement:

1. Default
2. Hover
3. Focus-visible
4. Active
5. Disabled
6. Loading
7. Error
8. Success

Focus-visible uses a clear Fire Orange ring. Motion must respect
`prefers-reduced-motion`. Animation communicates state or hierarchy; it is never
continuous decoration.

## Application states

Every capability must provide deliberate loading, empty, partial-data, error,
permission-denied, offline, and success states. Errors must state what failed,
what data was preserved, and the next safe action.

## Safety

Never use color as the only status signal. Financial, lease, AI, and operational
recommendations must expose their source or calculation basis. The interface
must never imply that an AI result is guaranteed.
