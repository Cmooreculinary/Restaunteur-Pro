from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

# ==================== MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Project(BaseModel):
    project_id: str = Field(default_factory=lambda: f"proj_{uuid.uuid4().hex[:12]}")
    user_id: str
    name: str
    location: str
    phase: str = "concept"
    completion: int = 0
    budget_total: float = 0
    budget_invested: float = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    name: str
    location: str
    budget_total: float = 0

class Task(BaseModel):
    task_id: str = Field(default_factory=lambda: f"TSK-{uuid.uuid4().hex[:8].upper()}")
    project_id: str
    user_id: str
    title: str
    status: str = "pending"  # pending, active, urgent, completed
    due_date: Optional[str] = None
    category: str = "general"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    project_id: str
    title: str
    status: str = "pending"
    due_date: Optional[str] = None
    category: str = "general"

class TeamMember(BaseModel):
    member_id: str = Field(default_factory=lambda: f"mem_{uuid.uuid4().hex[:8]}")
    project_id: str
    user_id: str
    name: str
    role: str
    avatar_color: str = "purple"
    status: str = "active"

class TeamMemberCreate(BaseModel):
    project_id: str
    name: str
    role: str
    avatar_color: str = "purple"

class BudgetItem(BaseModel):
    budget_id: str = Field(default_factory=lambda: f"bgt_{uuid.uuid4().hex[:8]}")
    project_id: str
    user_id: str
    category: str
    planned: float
    spent: float = 0

class Equipment(BaseModel):
    equipment_id: str = Field(default_factory=lambda: f"EQ-{uuid.uuid4().hex[:6].upper()}")
    project_id: str
    user_id: str
    name: str
    specs: str
    status: str = "pending"  # pending, ordered, delivered, installed

class EquipmentCreate(BaseModel):
    project_id: str
    name: str
    specs: str
    status: str = "pending"

class Permit(BaseModel):
    permit_id: str = Field(default_factory=lambda: f"pmt_{uuid.uuid4().hex[:8]}")
    project_id: str
    user_id: str
    name: str
    status: str = "pending"  # pending, submitted, approved, rejected
    submitted_date: Optional[str] = None

class HiringCandidate(BaseModel):
    candidate_id: str = Field(default_factory=lambda: f"cnd_{uuid.uuid4().hex[:8]}")
    project_id: str
    user_id: str
    name: str
    position: str
    stage: str = "application"  # application, interview, onboarding, hired
    email: Optional[str] = None

class HiringCandidateCreate(BaseModel):
    project_id: str
    name: str
    position: str
    stage: str = "application"
    email: Optional[str] = None

class Vendor(BaseModel):
    vendor_id: str = Field(default_factory=lambda: f"vnd_{uuid.uuid4().hex[:8]}")
    project_id: str
    user_id: str
    name: str
    category: str
    status: str = "active"
    delivery_status: str = "on_time"  # on_time, delayed, pending

class MenuItem(BaseModel):
    menu_item_id: str = Field(default_factory=lambda: f"mnu_{uuid.uuid4().hex[:8]}")
    project_id: str
    user_id: str
    name: str
    cost: float
    price: float
    category: str

class LeaseClause(BaseModel):
    clause_id: str = Field(default_factory=lambda: f"cls_{uuid.uuid4().hex[:8]}")
    project_id: str
    user_id: str
    title: str
    status: str = "reviewing"  # accepted, reviewing, counter_offered, attention
    notes: Optional[str] = None

class Unit(BaseModel):
    unit_id: str = Field(default_factory=lambda: f"unit_{uuid.uuid4().hex[:8]}")
    user_id: str
    name: str
    location: str
    status: str = "active"
    monthly_revenue: float = 0

class AIAnalysisRequest(BaseModel):
    project_id: str
    analysis_type: str  # lease, menu, cost, site
    content: str

class Notification(BaseModel):
    notification_id: str = Field(default_factory=lambda: f"ntf_{uuid.uuid4().hex[:8]}")
    user_id: str
    title: str
    message: str
    type: str = "info"  # info, warning, success, error
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH ENDPOINTS ====================

async def get_current_user(request: Request) -> User:
    """Extract and validate user from session token"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return User(**user)

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for a session token"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth to get user data
    async with httpx.AsyncClient() as client_http:
        resp = await client_http.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session_id")
        
        auth_data = resp.json()
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    email = auth_data.get("email")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        # Create new user
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": auth_data.get("name", "User"),
            "picture": auth_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)
        
        # Create default project for new user
        default_project = {
            "project_id": f"proj_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "name": "My First Restaurant",
            "location": "New York, NY",
            "phase": "concept",
            "completion": 15,
            "budget_total": 500000,
            "budget_invested": 75000,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.projects.insert_one(default_project)
    
    # Create session
    session_token = auth_data.get("session_token", f"sess_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return user

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    """Get current authenticated user"""
    return user.model_dump()

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== PROJECTS ====================

@api_router.get("/projects", response_model=List[dict])
async def get_projects(user: User = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return projects

@api_router.post("/projects")
async def create_project(data: ProjectCreate, user: User = Depends(get_current_user)):
    project = Project(
        user_id=user.user_id,
        name=data.name,
        location=data.location,
        budget_total=data.budget_total
    )
    doc = project.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("user_id", None)
    await db.projects.update_one(
        {"project_id": project_id, "user_id": user.user_id},
        {"$set": data}
    )
    project = await db.projects.find_one({"project_id": project_id}, {"_id": 0})
    return project

# ==================== TASKS ====================

@api_router.get("/tasks")
async def get_tasks(project_id: str, user: User = Depends(get_current_user)):
    tasks = await db.tasks.find(
        {"project_id": project_id, "user_id": user.user_id}, 
        {"_id": 0}
    ).to_list(100)
    return tasks

@api_router.post("/tasks")
async def create_task(data: TaskCreate, user: User = Depends(get_current_user)):
    task = Task(
        project_id=data.project_id,
        user_id=user.user_id,
        title=data.title,
        status=data.status,
        due_date=data.due_date,
        category=data.category
    )
    doc = task.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    await db.tasks.update_one(
        {"task_id": task_id, "user_id": user.user_id},
        {"$set": data}
    )
    return {"message": "Updated"}

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user)):
    await db.tasks.delete_one({"task_id": task_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== TEAM ====================

@api_router.get("/team")
async def get_team(project_id: str, user: User = Depends(get_current_user)):
    members = await db.team_members.find(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    return members

@api_router.post("/team")
async def add_team_member(data: TeamMemberCreate, user: User = Depends(get_current_user)):
    member = TeamMember(
        project_id=data.project_id,
        user_id=user.user_id,
        name=data.name,
        role=data.role,
        avatar_color=data.avatar_color
    )
    doc = member.model_dump()
    await db.team_members.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ==================== BUDGET ====================

@api_router.get("/budget")
async def get_budget(project_id: str, user: User = Depends(get_current_user)):
    items = await db.budget_items.find(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    return items

@api_router.post("/budget")
async def create_budget_item(data: dict, user: User = Depends(get_current_user)):
    item = BudgetItem(
        project_id=data["project_id"],
        user_id=user.user_id,
        category=data["category"],
        planned=data["planned"],
        spent=data.get("spent", 0)
    )
    doc = item.model_dump()
    await db.budget_items.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ==================== EQUIPMENT ====================

@api_router.get("/equipment")
async def get_equipment(project_id: str, user: User = Depends(get_current_user)):
    items = await db.equipment.find(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    return items

@api_router.post("/equipment")
async def add_equipment(data: EquipmentCreate, user: User = Depends(get_current_user)):
    equipment = Equipment(
        project_id=data.project_id,
        user_id=user.user_id,
        name=data.name,
        specs=data.specs,
        status=data.status
    )
    doc = equipment.model_dump()
    await db.equipment.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/equipment/{equipment_id}")
async def update_equipment(equipment_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    await db.equipment.update_one(
        {"equipment_id": equipment_id, "user_id": user.user_id},
        {"$set": data}
    )
    return {"message": "Updated"}

# ==================== PERMITS ====================

@api_router.get("/permits")
async def get_permits(project_id: str, user: User = Depends(get_current_user)):
    permits = await db.permits.find(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    return permits

@api_router.post("/permits")
async def add_permit(data: dict, user: User = Depends(get_current_user)):
    permit = Permit(
        project_id=data["project_id"],
        user_id=user.user_id,
        name=data["name"],
        status=data.get("status", "pending")
    )
    doc = permit.model_dump()
    await db.permits.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ==================== HIRING ====================

@api_router.get("/candidates")
async def get_candidates(project_id: str, user: User = Depends(get_current_user)):
    candidates = await db.candidates.find(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    return candidates

@api_router.post("/candidates")
async def add_candidate(data: HiringCandidateCreate, user: User = Depends(get_current_user)):
    candidate = HiringCandidate(
        project_id=data.project_id,
        user_id=user.user_id,
        name=data.name,
        position=data.position,
        stage=data.stage,
        email=data.email
    )
    doc = candidate.model_dump()
    await db.candidates.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/candidates/{candidate_id}")
async def update_candidate(candidate_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    await db.candidates.update_one(
        {"candidate_id": candidate_id, "user_id": user.user_id},
        {"$set": data}
    )
    return {"message": "Updated"}

# ==================== VENDORS ====================

@api_router.get("/vendors")
async def get_vendors(project_id: str, user: User = Depends(get_current_user)):
    vendors = await db.vendors.find(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    return vendors

@api_router.post("/vendors")
async def add_vendor(data: dict, user: User = Depends(get_current_user)):
    vendor = Vendor(
        project_id=data["project_id"],
        user_id=user.user_id,
        name=data["name"],
        category=data["category"],
        status=data.get("status", "active"),
        delivery_status=data.get("delivery_status", "on_time")
    )
    doc = vendor.model_dump()
    await db.vendors.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ==================== MENU ITEMS ====================

@api_router.get("/menu-items")
async def get_menu_items(project_id: str, user: User = Depends(get_current_user)):
    items = await db.menu_items.find(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    return items

@api_router.post("/menu-items")
async def add_menu_item(data: dict, user: User = Depends(get_current_user)):
    item = MenuItem(
        project_id=data["project_id"],
        user_id=user.user_id,
        name=data["name"],
        cost=data["cost"],
        price=data["price"],
        category=data["category"]
    )
    doc = item.model_dump()
    await db.menu_items.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ==================== LEASE CLAUSES ====================

@api_router.get("/lease-clauses")
async def get_lease_clauses(project_id: str, user: User = Depends(get_current_user)):
    clauses = await db.lease_clauses.find(
        {"project_id": project_id, "user_id": user.user_id},
        {"_id": 0}
    ).to_list(100)
    return clauses

@api_router.post("/lease-clauses")
async def add_lease_clause(data: dict, user: User = Depends(get_current_user)):
    clause = LeaseClause(
        project_id=data["project_id"],
        user_id=user.user_id,
        title=data["title"],
        status=data.get("status", "reviewing"),
        notes=data.get("notes")
    )
    doc = clause.model_dump()
    await db.lease_clauses.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/lease-clauses/{clause_id}")
async def update_lease_clause(clause_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    await db.lease_clauses.update_one(
        {"clause_id": clause_id, "user_id": user.user_id},
        {"$set": data}
    )
    return {"message": "Updated"}

# ==================== UNITS (EXPANSION) ====================

@api_router.get("/units")
async def get_units(user: User = Depends(get_current_user)):
    units = await db.units.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return units

@api_router.post("/units")
async def add_unit(data: dict, user: User = Depends(get_current_user)):
    unit = Unit(
        user_id=user.user_id,
        name=data["name"],
        location=data["location"],
        status=data.get("status", "active"),
        monthly_revenue=data.get("monthly_revenue", 0)
    )
    doc = unit.model_dump()
    await db.units.insert_one(doc)
    doc.pop("_id", None)
    return doc

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(user: User = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications

@api_router.post("/notifications/read")
async def mark_notifications_read(user: User = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    return {"message": "Marked as read"}

# ==================== AI ANALYSIS ====================

@api_router.post("/ai/analyze")
async def ai_analysis(data: AIAnalysisRequest, user: User = Depends(get_current_user)):
    """AI-powered analysis using GPT-5.2"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    system_messages = {
        "lease": "You are an expert restaurant lease analyst. Analyze lease terms and identify potential issues, favorable clauses, and negotiation points. Provide actionable recommendations.",
        "menu": "You are a restaurant menu engineering expert. Analyze menu items for profitability, pricing strategy, and cost optimization. Provide specific recommendations.",
        "cost": "You are a restaurant cost analyst. Calculate food costs, suggest pricing, and identify opportunities for cost reduction while maintaining quality.",
        "site": "You are a restaurant site analysis expert. Evaluate location potential based on demographics, foot traffic, competition, and market conditions."
    }
    
    system_message = system_messages.get(data.analysis_type, "You are a helpful restaurant business assistant.")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"analysis_{user.user_id}_{data.project_id}",
        system_message=system_message
    ).with_model("openai", "gpt-5.2")
    
    user_message = UserMessage(text=data.content)
    response = await chat.send_message(user_message)
    
    return {"analysis": response, "type": data.analysis_type}

@api_router.post("/ai/cost-calculator")
async def ai_cost_calculator(data: dict, user: User = Depends(get_current_user)):
    """AI-powered recipe cost calculator"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")
    
    chat = LlmChat(
        api_key=api_key,
        session_id=f"cost_calc_{user.user_id}",
        system_message="""You are a restaurant cost calculator. Given ingredient costs and quantities, calculate:
1. Total recipe cost
2. Cost per serving
3. Suggested menu price (targeting 30% food cost)
4. Profit margin analysis
Respond in a structured format."""
    ).with_model("openai", "gpt-5.2")
    
    ingredients = data.get("ingredients", "")
    servings = data.get("servings", 1)
    
    prompt = f"Calculate costs for this recipe:\n{ingredients}\nNumber of servings: {servings}"
    user_message = UserMessage(text=prompt)
    response = await chat.send_message(user_message)
    
    return {"calculation": response}

# ==================== SITE DEMOGRAPHICS (SIMULATED LIVE DATA) ====================

@api_router.get("/site/demographics")
async def get_site_demographics(lat: float = 40.7128, lng: float = -74.0060):
    """Get simulated live demographics for a location"""
    import random
    
    # Simulated live data that varies slightly each call
    base_foot_traffic = 12500
    variation = random.randint(-500, 500)
    
    return {
        "foot_traffic": {
            "daily": base_foot_traffic + variation,
            "trend": "+8.2%",
            "peak_hours": "12pm - 2pm, 6pm - 9pm"
        },
        "competition": {
            "count": random.randint(18, 24),
            "density": "medium",
            "nearest_competitor": "0.3 mi"
        },
        "income": {
            "median": 78500 + random.randint(-2000, 2000),
            "bracket": "$75k-$100k",
            "trend": "+4.1%"
        },
        "walkability": {
            "score": random.randint(85, 95),
            "grade": "A",
            "transit_score": random.randint(80, 90)
        },
        "population": {
            "density": 28500,
            "growth": "+2.3%",
            "age_median": 34
        }
    }

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Restaurateur Pro API", "status": "operational"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Include router and middleware
app.include_router(api_router)

ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in ALLOWED_ORIGINS if o.strip()],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
