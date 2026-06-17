# Restaunteur-Pro

Full-stack restaurant management SaaS. React frontend (`frontend/src/`) + Python backend.

## Stack
- **Frontend**: React (CRA), React Router, Tailwind CSS, shadcn/ui, Axios
- **Backend**: Python (FastAPI/Flask), `/api` prefix
- **Auth**: OAuth session exchange via `/api/auth/session` + `/api/auth/me`
- **Env**: `REACT_APP_BACKEND_URL` for API base

## Design System (Vault / Founder Command)
- Colors: primary `#4cd6ff`, secondary-container `#7000ff`, tertiary `#00dce5`
- Surfaces: `#0c0e12` → `#1c1e22` → `#25272b` → `#2e3035` → `#333539`
- Text: onSurface `#e2e2e8`, onSurfaceVariant `#c4c6d0`
- Fonts: Space Grotesk (headlines), Inter (body) — Space Grotesk NOT in global index.css, inject via inline `<style>` in components
- Glass panels: `rgba(51,53,57,0.4)` + `backdrop-filter: blur(20px)`
- Electric gradient: `linear-gradient(135deg, #4cd6ff 0%, #7000ff 100%)`

## Key Pages
- `/` or `/dashboard` → Dashboard (auth-gated)
- `/marketeer` → Marketeer (auth-gated) — full marketing agent, 5 tabs

## Branch
Always develop on `claude/nice-bardeen-gvjsc3`, push with `-u origin`.

## Marketeer Files
- `marketeer.html` — standalone SPA (no build step, open directly)
- `frontend/src/pages/Marketeer.jsx` — React integration page
