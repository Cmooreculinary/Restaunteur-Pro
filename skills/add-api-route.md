# Skill: add-api-route

Add a new FastAPI endpoint to the backend and wire a matching Axios call in the frontend.

## Usage
/add-api-route <METHOD> <path> <description>

Example: `/add-api-route POST /api/campaigns "Create a new marketing campaign"`

## Steps

### 1. Backend — `backend/server.py`

Add a Pydantic model + route:

```python
class CampaignCreate(BaseModel):
    name: str
    type: str
    scheduled_at: Optional[datetime] = None

@api_router.post("/campaigns")
async def create_campaign(payload: CampaignCreate, request: Request):
    doc = payload.dict()
    doc["created_at"] = datetime.now(timezone.utc)
    result = await db.campaigns.insert_one(doc)
    return {"id": str(result.inserted_id), **doc}
```

### 2. Frontend — call it with Axios

```js
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const createCampaign = async (data) => {
  const res = await axios.post(`${API}/campaigns`, data);
  return res.data;
};
```

### 3. Test locally

```bash
curl -X POST http://localhost:8001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Summer Launch","type":"email"}'
```

### 4. Commit + push

```bash
git add backend/server.py frontend/src/pages/<Page>.jsx
git commit -m "feat: add POST /api/campaigns endpoint"
git push -u origin claude/nice-bardeen-gvjsc3
```
