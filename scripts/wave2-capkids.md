# Wave 2 Fix Script — Captain Culinary Kids (CapKids)

Priority: BUILD — stabilize; COPPA is a hard launch gate.

## Critical constraints
- NO PII collected from under-13 users. Zero. Not even anonymised device IDs linked to age.
- On-device Gemma fallback must work when network is absent.
- VoiceProvider must be abstracted (not locked to a single vendor SDK).
- DO NOT auto-ship — COPPA legal review required before any production release.

## Audit checklist

```bash
# PII risk scan — any user data collection
grep -rn "email\|phone\|name\|dob\|age\|birthday\|collect\|track\|analytics" --include="*.py" --include="*.js" --include="*.jsx" .

# Gemma fallback
grep -rn "gemma\|on.device\|offline\|fallback" --include="*.py" --include="*.js" --include="*.jsx" .

# VoiceProvider abstraction
grep -rn "VoiceProvider\|voice\|speech\|tts\|stt" --include="*.py" --include="*.js" --include="*.jsx" .

# Emergent refs
grep -rn "emergent\|emergentagent" --include="*.py" --include="*.js" --include="*.jsx" --include="*.html" .

# CORS
grep -n "allow_origins\|allow_credentials" backend/server.py 2>/dev/null
```

## Fixes

### CORS (same pattern)
```python
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "http://localhost:3000").split(",") if o.strip()]
```

### PII gate — add to any data collection endpoint
```python
if user_age and user_age < 13:
    raise HTTPException(status_code=403, detail="COPPA: data collection not permitted for users under 13")
```

### VoiceProvider abstraction pattern
```js
// VoiceProvider.js — swap implementation without touching consumers
const PROVIDER = process.env.REACT_APP_VOICE_PROVIDER || 'web-speech';
export const speak = (text) => providers[PROVIDER].speak(text);
export const listen = () => providers[PROVIDER].listen();
```

## DoD
- [ ] Cap voice/gesture demo runs locally
- [ ] Gemma fallback confirmed (disable network, demo still works)
- [ ] Zero PII from under-13 path (audit trail documented)
- [ ] No Emergent refs
- [ ] CORS clean
- [ ] COPPA legal review flagged in NOW_AND_LATER.md as launch gate — NOT auto-shipped
