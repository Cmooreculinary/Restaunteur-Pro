# Wave 2 Fix Script — Maestro + VaultSpace 2.0 (peaks-altitude-os)

## Maestro

### Naming collision flag
Maestro conflicts with the Wix mobile testing tool "Maestro" — flag before any brand spend.
Options: rename to "Conductor", "Baton", "Orchestr8", or add a suffix ("Maestro by BCA").
Do NOT resolve here; raise with Chef as a decision gate.

### Audit
```bash
grep -rn "emergent\|emergentagent" --include="*.py" --include="*.js" --include="*.jsx" --include="*.html" .
grep -n "allow_origins\|allow_credentials" backend/server.py 2>/dev/null
```

### Read/write path DoD check
- [ ] Create record → persists in DB → reload retrieves it
- [ ] No Emergent refs
- [ ] CORS clean
- [ ] Naming collision flagged for decision

## VaultSpace 2.0 (peaks-altitude-os)

### Backup confirmation (CRITICAL — do this first)
```bash
# Confirm current vault data is backed up before any changes
mongodump --uri="$MONGO_URL" --db="$DB_NAME" --out=./backup_$(date +%Y%m%d)
# Or: export from Atlas UI → Backup → On-Demand Snapshot
```

### Version check
```bash
# Confirm version tag exists
git tag | grep -E "v[0-9]"
# If none: git tag v2.0.0 && git push origin v2.0.0
```

### Audit
```bash
grep -rn "emergent\|emergentagent" --include="*.py" --include="*.js" --include="*.jsx" --include="*.html" .
grep -n "allow_origins\|allow_credentials" backend/server.py 2>/dev/null
```

### DoD
- [ ] Read/write path works end-to-end
- [ ] MongoDB backup confirmed and timestamped
- [ ] Version tag on deployed commit
- [ ] No Emergent refs
- [ ] CORS clean
- [ ] Maestro naming collision flagged
