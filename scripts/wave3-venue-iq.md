# Wave 3 Fix Script — Venue IQ

Priority: HARDEN THEN SHIP — 4 sub-issues, must all pass before live.

## Issue (a) — Walkie-talkie push-to-talk: NO AUDIO BACKEND (mock UI)

### Detect
```bash
grep -rn "walkie\|push.to.talk\|ptt\|audio\|WebRTC\|websocket.*audio\|MediaRecorder" \
  --include="*.py" --include="*.js" --include="*.jsx" .
```

### Fix options (pick one, confirm with Chef)
**Option 1 — Gate the feature (fastest to ship)**
```jsx
// Wrap PTT button in a "coming soon" state
const PTT_ENABLED = process.env.REACT_APP_PTT_ENABLED === 'true';
{PTT_ENABLED ? <PTTButton /> : <ComingSoonBadge feature="Walkie-Talkie" />}
```

**Option 2 — Wire real audio via WebRTC + backend relay**
- Backend: add `/ws/audio` WebSocket endpoint using `websockets` library
- Frontend: `MediaRecorder` → WebSocket → broadcast to room participants
- Requires: `websockets` in requirements.txt

DO NOT ship Option 2 without load testing. Gate with `REACT_APP_PTT_ENABLED=false` in prod until tested.

## Issue (b) — Email/text portal verification
```bash
grep -rn "email\|sms\|twilio\|sendgrid\|smtp\|notify" --include="*.py" . 
# Confirm: endpoint exists, env vars documented, test send works
```
Required env vars: `SENDGRID_API_KEY` or `SMTP_HOST`/`SMTP_PORT`, `TWILIO_SID`/`TWILIO_TOKEN`

## Issue (c) — Light-mode contrast failures
```bash
grep -rn "text-gray-[1-4]00\|text-white.*bg-white\|color.*#fff.*background.*#f\|contrast" \
  --include="*.jsx" --include="*.css" .
```
Fix: audit all text/bg combos in light mode against WCAG AA (4.5:1 for body text, 3:1 for large).
```css
/* Common fixes */
.light .secondary-text { color: #374151; }  /* was #9CA3AF — fails on white */
.light .muted { color: #4B5563; }
```

## Issue (d) — Exec panel responsive breakdown (tablet/mobile)
```bash
grep -rn "exec.*panel\|ExecPanel\|executive\|admin.*panel" --include="*.jsx" .
```
Fix pattern:
```jsx
// Replace fixed-width exec panel with responsive grid
<div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  <div className="lg:col-span-2">{mainContent}</div>
  <div className="lg:col-span-1">{execPanel}</div>
</div>
```

## CORS fix (same pattern as all BCA repos)
```python
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
```

## DoD
- [ ] PTT either gated (feature flag = false) OR wired with real audio backend
- [ ] Email/text portal sends successfully (test receipt confirmed)
- [ ] Light-mode contrast passes WCAG AA on all text elements
- [ ] Exec panel usable at 768px (tablet) and 375px (mobile)
- [ ] No Emergent refs
- [ ] CORS clean
- [ ] No mock-only controls shipped as live
