# Now & Later

## NOW — Active / In Progress

### Deployment
- [ ] Connect `render.yaml` to Render dashboard (render.com → New → Blueprint)
- [ ] Set env vars in Render: `MONGO_URL`, `DB_NAME`, `REACT_APP_BACKEND_URL`
- [ ] Remove any Vercel config / `vercel.json` if it appears
- [ ] Test health endpoint: `GET /api/health` returns 200

### Marketeer
- [ ] Wire real AI call in Content Studio (currently shows static copy)
- [ ] Campaign builder — save/load campaigns to MongoDB
- [ ] Analytics tab — connect to real data source (POS or manual entry)
- [ ] Audience tab — import customer CSV / loyalty list

### Auth
- [ ] OAuth refresh token handling (session expiry edge case)
- [ ] Add logout route that clears session cookie

---

## LATER — Queued / Planned

### Agents to Build (Internal + Sellable)
See `AGENTS.md` for full list and build order.

### Skills
See `.claude/skills/` for reusable Claude Code skills.

### Infra
- [ ] MongoDB Atlas → Render-managed Postgres migration (optional)
- [ ] Add Redis for session caching
- [ ] CDN for `marketeer.html` static assets
- [ ] Staging environment on Render (branch deploys)

### Product
- [ ] Mobile app (React Native) sharing the same backend
- [ ] White-label mode: swap logo/colors via tenant config
- [ ] Stripe billing integration (already in requirements.txt)
- [ ] Multi-location support (location_id on all DB records)
