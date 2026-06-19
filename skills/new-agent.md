# Skill: new-agent

Scaffold a new agent page for Restaunteur-Pro.

## Usage
/new-agent <AgentName>

## What this does
1. Creates `frontend/src/pages/<AgentName>.jsx` using the Vault design system
2. Creates `backend/agents/<agent_name>.py` with a FastAPI router stub
3. Wires the route into `frontend/src/App.js`
4. Adds the agent to `AGENTS.md` as ✅ built

## Template — Frontend (Vault design system)

```jsx
import { useState } from "react";

const surface = "#1c1e22";
const surfaceHigh = "#2e3035";
const primary = "#4cd6ff";
const onSurface = "#e2e2e8";
const onSurfaceVariant = "#c4c6d0";

export default function AGENT_NAME() {
  const [activeTab, setActiveTab] = useState("overview");

  const TABS = [
    { id: "overview", label: "Overview" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0c0e12", color: onSurface, fontFamily: "Inter, sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');`}</style>
      {/* Header */}
      <div style={{ borderBottom: `1px solid ${surfaceHigh}`, padding: "16px 24px", display: "flex", alignItems: "center", gap: 12 }}>
        <span className="material-symbols-outlined" style={{ color: primary }}>smart_toy</span>
        <span style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 18 }}>AGENT_NAME</span>
      </div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, padding: "16px 24px 0", overflowX: "auto", scrollbarWidth: "none" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            style={{ padding: "8px 16px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, flexShrink: 0,
              background: activeTab === t.id ? primary : surfaceHigh,
              color: activeTab === t.id ? "#0c0e12" : onSurfaceVariant }}>
            {t.label}
          </button>
        ))}
      </div>
      {/* Content */}
      <div style={{ padding: 24 }}>
        <p style={{ color: onSurfaceVariant }}>AGENT_NAME content goes here.</p>
      </div>
    </div>
  );
}
```

## Template — Backend

```python
from fastapi import APIRouter
router = APIRouter(prefix="/api/AGENT_NAME_LOWER", tags=["AGENT_NAME_LOWER"])

@router.get("/status")
async def status():
    return {"agent": "AGENT_NAME_LOWER", "status": "ok"}
```

## Steps to execute

1. Copy frontend template → `frontend/src/pages/<AgentName>.jsx`, replace `AGENT_NAME`
2. Copy backend template → `backend/agents/<agent_name>.py`, replace names
3. In `App.js`: add import + `<Route path="/<agent_name>" element={user ? <AgentName /> : <Landing />} />`
4. In `backend/server.py`: `from agents.<agent_name> import router as <agent_name>_router` + `api_router.include_router(<agent_name>_router)`
5. Commit + push to `claude/nice-bardeen-gvjsc3`
