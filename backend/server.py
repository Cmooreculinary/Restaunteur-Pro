from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import hashlib
import json
import stripe
import anthropic
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Restaurateur Pro API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== BUSINESS PROFILE MODELS ====================

class ConceptBasics(BaseModel):
    restaurant_name: str = ""
    concept_type: str = ""
    cuisine_types: List[str] = []
    tagline: str = ""
    description: str = ""
    unique_selling_points: List[str] = []

class LocationInfo(BaseModel):
    address: str = ""
    city: str = ""
    state: str = ""
    zip_code: str = ""
    country: str = "USA"
    coordinates: Dict[str, float] = {"lat": 0, "lng": 0}
    square_footage: int = 0
    seating_capacity: int = 0
    has_patio: bool = False
    patio_seats: int = 0
    parking_spaces: int = 0

class FinancialInfo(BaseModel):
    total_budget: float = 0
    construction_budget: float = 0
    equipment_budget: float = 0
    working_capital: float = 0
    funding_sources: List[str] = []
    target_revenue_monthly: float = 0
    target_food_cost_percent: float = 30
    target_labor_cost_percent: float = 30

class OperationalInfo(BaseModel):
    target_open_date: str = ""
    operating_hours: Dict[str, Dict[str, str]] = {}
    service_types: List[str] = []
    pos_system: str = ""
    reservation_system: str = ""
    delivery_partners: List[str] = []

class MenuInfo(BaseModel):
    price_range: str = ""
    signature_dishes: List[Dict[str, Any]] = []
    dietary_options: List[str] = []
    beverage_program: str = ""

class TeamInfo(BaseModel):
    owner_name: str = ""
    owner_experience: str = ""
    key_positions_needed: List[str] = []
    total_staff_needed: int = 0
    management_structure: str = ""

class BrandingInfo(BaseModel):
    brand_colors: List[str] = []
    brand_voice: str = ""
    target_demographic: str = ""
    target_age_range: str = ""
    social_media_handles: Dict[str, str] = {}
    website_url: str = ""

class BusinessProfile(BaseModel):
    profile_id: str = Field(default_factory=lambda: f"bp_{uuid.uuid4().hex[:12]}")
    user_id: str
    concept: ConceptBasics = Field(default_factory=ConceptBasics)
    location: LocationInfo = Field(default_factory=LocationInfo)
    financial: FinancialInfo = Field(default_factory=FinancialInfo)
    operational: OperationalInfo = Field(default_factory=OperationalInfo)
    menu: MenuInfo = Field(default_factory=MenuInfo)
    team: TeamInfo = Field(default_factory=TeamInfo)
    branding: BrandingInfo = Field(default_factory=BrandingInfo)
    onboarding_completed: bool = False
    onboarding_step: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BusinessProfileUpdate(BaseModel):
    section: str
    data: Dict[str, Any]

# ==================== USER MODELS ====================

class User(BaseModel):
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    onboarding_completed: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== PROJECT MODELS ====================

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
    description: str = ""
    status: str = "pending"
    priority: str = "medium"
    due_date: Optional[str] = None
    category: str = "general"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TaskCreate(BaseModel):
    project_id: str
    title: str
    description: str = ""
    status: str = "pending"
    priority: str = "medium"
    due_date: Optional[str] = None
    category: str = "general"

class TeamMember(BaseModel):
    member_id: str = Field(default_factory=lambda: f"mem_{uuid.uuid4().hex[:8]}")
    project_id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: str
    name: str
    role: str
    email: str = ""
    phone: str = ""
    avatar_color: str = "purple"
    status: str = "active"
    hire_date: Optional[str] = None
    notes: str = ""

class TeamMemberCreate(BaseModel):
    project_id: Optional[str] = None
    name: str
    role: str
    email: str = ""
    phone: str = ""
    avatar_color: str = "purple"
    hire_date: Optional[str] = None
    notes: str = ""

class BudgetItem(BaseModel):
    budget_id: str = Field(default_factory=lambda: f"bgt_{uuid.uuid4().hex[:8]}")
    project_id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: str
    category: str
    subcategory: str = ""
    planned: float
    spent: float = 0
    notes: str = ""

class BudgetItemCreate(BaseModel):
    project_id: Optional[str] = None
    category: str
    subcategory: str = ""
    planned: float
    spent: float = 0
    notes: str = ""

class Equipment(BaseModel):
    equipment_id: str = Field(default_factory=lambda: f"EQ-{uuid.uuid4().hex[:6].upper()}")
    project_id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: str
    name: str
    category: str = ""
    specs: str
    vendor: str = ""
    cost: float = 0
    status: str = "pending"
    notes: str = ""

class EquipmentCreate(BaseModel):
    project_id: Optional[str] = None
    name: str
    category: str = ""
    specs: str
    vendor: str = ""
    cost: float = 0
    status: str = "pending"
    notes: str = ""

class Permit(BaseModel):
    permit_id: str = Field(default_factory=lambda: f"pmt_{uuid.uuid4().hex[:8]}")
    project_id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: str
    name: str
    issuing_authority: str = ""
    status: str = "pending"
    submitted_date: Optional[str] = None
    approved_date: Optional[str] = None
    expiry_date: Optional[str] = None
    cost: float = 0
    notes: str = ""

class PermitCreate(BaseModel):
    project_id: Optional[str] = None
    name: str
    issuing_authority: str = ""
    status: str = "pending"
    submitted_date: Optional[str] = None
    cost: float = 0
    notes: str = ""

class HiringCandidate(BaseModel):
    candidate_id: str = Field(default_factory=lambda: f"cnd_{uuid.uuid4().hex[:8]}")
    project_id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: str
    name: str
    position: str
    stage: str = "application"
    email: str = ""
    phone: str = ""
    resume_notes: str = ""
    interview_notes: str = ""
    salary_expectation: float = 0
    start_date: Optional[str] = None

class HiringCandidateCreate(BaseModel):
    project_id: Optional[str] = None
    name: str
    position: str
    stage: str = "application"
    email: str = ""
    phone: str = ""
    resume_notes: str = ""
    salary_expectation: float = 0

class Vendor(BaseModel):
    vendor_id: str = Field(default_factory=lambda: f"vnd_{uuid.uuid4().hex[:8]}")
    project_id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: str
    name: str
    category: str
    contact_name: str = ""
    email: str = ""
    phone: str = ""
    address: str = ""
    payment_terms: str = ""
    status: str = "active"
    delivery_status: str = "on_time"
    notes: str = ""

class VendorCreate(BaseModel):
    project_id: Optional[str] = None
    name: str
    category: str
    contact_name: str = ""
    email: str = ""
    phone: str = ""
    payment_terms: str = ""
    notes: str = ""

class MenuItem(BaseModel):
    menu_item_id: str = Field(default_factory=lambda: f"mnu_{uuid.uuid4().hex[:8]}")
    project_id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: str
    name: str
    description: str = ""
    cost: float
    price: float
    category: str
    dietary_tags: List[str] = []
    is_signature: bool = False
    is_active: bool = True

class MenuItemCreate(BaseModel):
    project_id: Optional[str] = None
    name: str
    description: str = ""
    cost: float
    price: float
    category: str
    dietary_tags: List[str] = []
    is_signature: bool = False

class LeaseClause(BaseModel):
    clause_id: str = Field(default_factory=lambda: f"cls_{uuid.uuid4().hex[:8]}")
    project_id: Optional[str] = None
    profile_id: Optional[str] = None
    user_id: str
    title: str
    original_text: str = ""
    proposed_text: str = ""
    status: str = "reviewing"
    priority: str = "medium"
    notes: Optional[str] = None

class Unit(BaseModel):
    unit_id: str = Field(default_factory=lambda: f"unit_{uuid.uuid4().hex[:8]}")
    user_id: str
    profile_id: Optional[str] = None
    name: str
    location: str
    status: str = "active"
    monthly_revenue: float = 0
    open_date: Optional[str] = None

class Notification(BaseModel):
    notification_id: str = Field(default_factory=lambda: f"ntf_{uuid.uuid4().hex[:8]}")
    user_id: str
    title: str
    message: str
    type: str = "info"
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIAnalysisRequest(BaseModel):
    project_id: Optional[str] = None
    analysis_type: str
    content: str
    context: Optional[Dict[str, Any]] = None

# ==================== MARKETEER AGENT MODELS ====================

class MarketeerRequest(BaseModel):
    task_type: str  # social_post, email_campaign, launch_strategy, brand_voice, competitor_analysis, promo_copy, marketing_calendar
    platform: Optional[str] = None  # instagram, facebook, tiktok, twitter, email
    context: Optional[str] = None
    tone: Optional[str] = None  # professional, casual, playful, luxurious

class MarketeerCampaign(BaseModel):
    campaign_id: str = Field(default_factory=lambda: f"cmp_{uuid.uuid4().hex[:8]}")
    user_id: str
    profile_id: Optional[str] = None
    name: str
    type: str
    content: str
    platform: str = ""
    status: str = "draft"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str = ""

class LoginRequest(BaseModel):
    email: str
    password: str

async def get_current_user(request: Request) -> User:
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

async def get_user_profile(user: User) -> dict:
    profile = await db.business_profiles.find_one({"user_id": user.user_id}, {"_id": 0})
    if not profile:
        new_profile = BusinessProfile(user_id=user.user_id)
        doc = new_profile.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db.business_profiles.insert_one(doc)
        doc.pop("_id", None)
        profile = doc
    return profile

def _set_session_cookie(response: Response, token: str, days: int = 7):
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=days * 24 * 60 * 60
    )

# ==================== AUTH ENDPOINTS ====================

@api_router.post("/auth/register")
async def register(data: RegisterRequest, response: Response):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password required")
    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    existing_user = await db.users.find_one({"email": data.email.lower()})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    new_user = {
        "user_id": user_id,
        "email": data.email.lower(),
        "name": data.name or data.email.split("@")[0],
        "password_hash": hash_password(data.password),
        "picture": None,
        "onboarding_completed": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(new_user)

    new_profile = BusinessProfile(user_id=user_id)
    profile_doc = new_profile.model_dump()
    profile_doc["created_at"] = profile_doc["created_at"].isoformat()
    profile_doc["updated_at"] = profile_doc["updated_at"].isoformat()
    await db.business_profiles.insert_one(profile_doc)

    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    _set_session_cookie(response, session_token)
    return {k: v for k, v in new_user.items() if k != "password_hash"}

@api_router.post("/auth/login")
async def login(data: LoginRequest, response: Response):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    user = await db.users.find_one({"email": data.email.lower()})
    if not user or user.get("password_hash") != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = user["user_id"]
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)

    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    _set_session_cookie(response, session_token)
    return {k: v for k, v in user.items() if k not in ["password_hash", "_id"]}

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange session_id from Emergent Auth for a session token"""
    body = await request.json()
    session_id = body.get("session_id")

    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")

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

    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
    else:
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": auth_data.get("name", "User"),
            "picture": auth_data.get("picture"),
            "onboarding_completed": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)

        new_profile = BusinessProfile(user_id=user_id)
        profile_doc = new_profile.model_dump()
        profile_doc["created_at"] = profile_doc["created_at"].isoformat()
        profile_doc["updated_at"] = profile_doc["updated_at"].isoformat()
        await db.business_profiles.insert_one(profile_doc)

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
    _set_session_cookie(response, session_token)
    return user

SECRET_ACCESS_CODE = "restaurateur2026"

@api_router.post("/auth/secret")
async def secret_login(request: Request, response: Response):
    body = await request.json()
    if body.get("code") != SECRET_ACCESS_CODE:
        raise HTTPException(status_code=401, detail="Invalid access code")

    admin_email = "admin@restaurateurpro.com"
    existing_user = await db.users.find_one({"email": admin_email}, {"_id": 0})

    if existing_user:
        user_id = existing_user["user_id"]
    else:
        user_id = f"admin_{uuid.uuid4().hex[:8]}"
        new_user = {
            "user_id": user_id,
            "email": admin_email,
            "name": "Admin Access",
            "picture": None,
            "onboarding_completed": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(new_user)

        new_profile = BusinessProfile(user_id=user_id)
        new_profile.onboarding_completed = True
        new_profile.concept = ConceptBasics(
            restaurant_name="Demo Restaurant",
            concept_type="casual",
            cuisine_types=["American", "Contemporary"],
            tagline="Fresh & Local"
        )
        profile_doc = new_profile.model_dump()
        profile_doc["created_at"] = profile_doc["created_at"].isoformat()
        profile_doc["updated_at"] = profile_doc["updated_at"].isoformat()
        await db.business_profiles.insert_one(profile_doc)

        default_project = {
            "project_id": f"proj_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "name": "Demo Restaurant",
            "location": "New York, NY",
            "phase": "concept",
            "completion": 35,
            "budget_total": 500000,
            "budget_invested": 175000,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.projects.insert_one(default_project)

    session_token = f"secret_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=14)

    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    _set_session_cookie(response, session_token, days=14)
    return {**user, "expires_in_days": 14}

@api_router.get("/auth/me")
async def get_me(user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    return {
        **user.model_dump(),
        "profile_id": profile.get("profile_id"),
        "onboarding_completed": profile.get("onboarding_completed", False),
        "onboarding_step": profile.get("onboarding_step", 0)
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== BUSINESS PROFILE ENDPOINTS ====================

@api_router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    return profile

@api_router.put("/profile")
async def update_profile(data: BusinessProfileUpdate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    valid_sections = ["concept", "location", "financial", "operational", "menu", "team", "branding"]
    if data.section not in valid_sections:
        raise HTTPException(status_code=400, detail=f"Invalid section. Must be one of: {valid_sections}")

    await db.business_profiles.update_one(
        {"profile_id": profile["profile_id"]},
        {"$set": {data.section: data.data, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    updated = await db.business_profiles.find_one({"profile_id": profile["profile_id"]}, {"_id": 0})
    return updated

@api_router.put("/profile/onboarding-step")
async def update_onboarding_step(data: dict, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    step = data.get("step", 0)
    completed = data.get("completed", False)

    await db.business_profiles.update_one(
        {"profile_id": profile["profile_id"]},
        {"$set": {"onboarding_step": step, "onboarding_completed": completed, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    if completed:
        await db.users.update_one({"user_id": user.user_id}, {"$set": {"onboarding_completed": True}})

    return {"step": step, "completed": completed}

@api_router.get("/profile/summary")
async def get_profile_summary(user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    pid = profile["profile_id"]

    team_count = await db.team_members.count_documents({"profile_id": pid})
    menu_count = await db.menu_items.count_documents({"profile_id": pid})
    vendor_count = await db.vendors.count_documents({"profile_id": pid})
    equipment_count = await db.equipment.count_documents({"profile_id": pid})
    permit_count = await db.permits.count_documents({"profile_id": pid})

    budget_items = await db.budget_items.find({"profile_id": pid}, {"_id": 0}).to_list(100)
    total_planned = sum(item.get("planned", 0) for item in budget_items)
    total_spent = sum(item.get("spent", 0) for item in budget_items)

    return {
        "profile_id": pid,
        "restaurant_name": profile.get("concept", {}).get("restaurant_name", ""),
        "concept_type": profile.get("concept", {}).get("concept_type", ""),
        "location": f"{profile.get('location', {}).get('city', '')}, {profile.get('location', {}).get('state', '')}",
        "total_budget": profile.get("financial", {}).get("total_budget", 0),
        "budget_spent": total_spent,
        "budget_planned": total_planned,
        "team_count": team_count,
        "menu_count": menu_count,
        "vendor_count": vendor_count,
        "equipment_count": equipment_count,
        "permit_count": permit_count,
        "target_open_date": profile.get("operational", {}).get("target_open_date", ""),
        "onboarding_completed": profile.get("onboarding_completed", False)
    }

# ==================== PROJECTS ====================

@api_router.get("/projects", response_model=List[dict])
async def get_projects(user: User = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return projects

@api_router.post("/projects")
async def create_project(data: ProjectCreate, user: User = Depends(get_current_user)):
    project = Project(user_id=user.user_id, name=data.name, location=data.location, budget_total=data.budget_total)
    doc = project.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("user_id", None)
    await db.projects.update_one({"project_id": project_id, "user_id": user.user_id}, {"$set": data})
    return await db.projects.find_one({"project_id": project_id}, {"_id": 0})

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(get_current_user)):
    await db.projects.delete_one({"project_id": project_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== TASKS ====================

@api_router.get("/tasks")
async def get_tasks(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    query = {"user_id": user.user_id}
    if project_id:
        query["project_id"] = project_id
    tasks = await db.tasks.find(query, {"_id": 0}).to_list(200)
    return tasks

@api_router.post("/tasks")
async def create_task(data: TaskCreate, user: User = Depends(get_current_user)):
    task = Task(project_id=data.project_id, user_id=user.user_id, title=data.title,
                description=data.description, status=data.status, priority=data.priority,
                due_date=data.due_date, category=data.category)
    doc = task.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db.tasks.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("task_id", None)
    await db.tasks.update_one({"task_id": task_id, "user_id": user.user_id}, {"$set": data})
    return await db.tasks.find_one({"task_id": task_id}, {"_id": 0})

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user)):
    await db.tasks.delete_one({"task_id": task_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== TEAM ====================

@api_router.get("/team")
async def get_team(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        members = await db.team_members.find({"project_id": project_id, "user_id": user.user_id}, {"_id": 0}).to_list(100)
    else:
        profile = await get_user_profile(user)
        members = await db.team_members.find(
            {"$or": [{"profile_id": profile["profile_id"]}, {"user_id": user.user_id}]}, {"_id": 0}
        ).to_list(100)
    return members

@api_router.post("/team")
async def add_team_member(data: TeamMemberCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    member = TeamMember(
        project_id=data.project_id,
        profile_id=profile["profile_id"],
        user_id=user.user_id,
        name=data.name, role=data.role, email=data.email, phone=data.phone,
        avatar_color=data.avatar_color, hire_date=data.hire_date, notes=data.notes
    )
    doc = member.model_dump()
    await db.team_members.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/team/{member_id}")
async def update_team_member(member_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("member_id", None)
    await db.team_members.update_one({"member_id": member_id, "user_id": user.user_id}, {"$set": data})
    return await db.team_members.find_one({"member_id": member_id}, {"_id": 0})

@api_router.delete("/team/{member_id}")
async def delete_team_member(member_id: str, user: User = Depends(get_current_user)):
    await db.team_members.delete_one({"member_id": member_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== BUDGET ====================

@api_router.get("/budget")
async def get_budget(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        items = await db.budget_items.find({"project_id": project_id, "user_id": user.user_id}, {"_id": 0}).to_list(100)
    else:
        profile = await get_user_profile(user)
        items = await db.budget_items.find(
            {"$or": [{"profile_id": profile["profile_id"]}, {"user_id": user.user_id}]}, {"_id": 0}
        ).to_list(100)
    return items

@api_router.post("/budget")
async def create_budget_item(data: BudgetItemCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    item = BudgetItem(
        project_id=data.project_id, profile_id=profile["profile_id"],
        user_id=user.user_id, category=data.category, subcategory=data.subcategory,
        planned=data.planned, spent=data.spent, notes=data.notes
    )
    doc = item.model_dump()
    await db.budget_items.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/budget/{budget_id}")
async def update_budget_item(budget_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("budget_id", None)
    await db.budget_items.update_one({"budget_id": budget_id, "user_id": user.user_id}, {"$set": data})
    return await db.budget_items.find_one({"budget_id": budget_id}, {"_id": 0})

@api_router.delete("/budget/{budget_id}")
async def delete_budget_item(budget_id: str, user: User = Depends(get_current_user)):
    await db.budget_items.delete_one({"budget_id": budget_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== EQUIPMENT ====================

@api_router.get("/equipment")
async def get_equipment(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        items = await db.equipment.find({"project_id": project_id, "user_id": user.user_id}, {"_id": 0}).to_list(100)
    else:
        profile = await get_user_profile(user)
        items = await db.equipment.find(
            {"$or": [{"profile_id": profile["profile_id"]}, {"user_id": user.user_id}]}, {"_id": 0}
        ).to_list(100)
    return items

@api_router.post("/equipment")
async def add_equipment(data: EquipmentCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    equipment = Equipment(
        project_id=data.project_id, profile_id=profile["profile_id"],
        user_id=user.user_id, name=data.name, category=data.category,
        specs=data.specs, vendor=data.vendor, cost=data.cost, status=data.status, notes=data.notes
    )
    doc = equipment.model_dump()
    await db.equipment.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/equipment/{equipment_id}")
async def update_equipment(equipment_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("equipment_id", None)
    await db.equipment.update_one({"equipment_id": equipment_id, "user_id": user.user_id}, {"$set": data})
    return await db.equipment.find_one({"equipment_id": equipment_id}, {"_id": 0})

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str, user: User = Depends(get_current_user)):
    await db.equipment.delete_one({"equipment_id": equipment_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== PERMITS ====================

@api_router.get("/permits")
async def get_permits(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        permits = await db.permits.find({"project_id": project_id, "user_id": user.user_id}, {"_id": 0}).to_list(100)
    else:
        profile = await get_user_profile(user)
        permits = await db.permits.find(
            {"$or": [{"profile_id": profile["profile_id"]}, {"user_id": user.user_id}]}, {"_id": 0}
        ).to_list(100)
    return permits

@api_router.post("/permits")
async def add_permit(data: PermitCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    permit = Permit(
        project_id=data.project_id, profile_id=profile["profile_id"],
        user_id=user.user_id, name=data.name, issuing_authority=data.issuing_authority,
        status=data.status, submitted_date=data.submitted_date, cost=data.cost, notes=data.notes
    )
    doc = permit.model_dump()
    await db.permits.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/permits/{permit_id}")
async def update_permit(permit_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("permit_id", None)
    await db.permits.update_one({"permit_id": permit_id, "user_id": user.user_id}, {"$set": data})
    return await db.permits.find_one({"permit_id": permit_id}, {"_id": 0})

@api_router.delete("/permits/{permit_id}")
async def delete_permit(permit_id: str, user: User = Depends(get_current_user)):
    await db.permits.delete_one({"permit_id": permit_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== HIRING ====================

@api_router.get("/candidates")
async def get_candidates(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        candidates = await db.candidates.find({"project_id": project_id, "user_id": user.user_id}, {"_id": 0}).to_list(100)
    else:
        profile = await get_user_profile(user)
        candidates = await db.candidates.find(
            {"$or": [{"profile_id": profile["profile_id"]}, {"user_id": user.user_id}]}, {"_id": 0}
        ).to_list(100)
    return candidates

@api_router.post("/candidates")
async def add_candidate(data: HiringCandidateCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    candidate = HiringCandidate(
        project_id=data.project_id, profile_id=profile["profile_id"],
        user_id=user.user_id, name=data.name, position=data.position,
        stage=data.stage, email=data.email, phone=data.phone,
        resume_notes=data.resume_notes, salary_expectation=data.salary_expectation
    )
    doc = candidate.model_dump()
    await db.candidates.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/candidates/{candidate_id}")
async def update_candidate(candidate_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("candidate_id", None)
    await db.candidates.update_one({"candidate_id": candidate_id, "user_id": user.user_id}, {"$set": data})
    return await db.candidates.find_one({"candidate_id": candidate_id}, {"_id": 0})

@api_router.delete("/candidates/{candidate_id}")
async def delete_candidate(candidate_id: str, user: User = Depends(get_current_user)):
    await db.candidates.delete_one({"candidate_id": candidate_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== VENDORS ====================

@api_router.get("/vendors")
async def get_vendors(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        vendors = await db.vendors.find({"project_id": project_id, "user_id": user.user_id}, {"_id": 0}).to_list(100)
    else:
        profile = await get_user_profile(user)
        vendors = await db.vendors.find(
            {"$or": [{"profile_id": profile["profile_id"]}, {"user_id": user.user_id}]}, {"_id": 0}
        ).to_list(100)
    return vendors

@api_router.post("/vendors")
async def add_vendor(data: VendorCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    vendor = Vendor(
        project_id=data.project_id, profile_id=profile["profile_id"],
        user_id=user.user_id, name=data.name, category=data.category,
        contact_name=data.contact_name, email=data.email, phone=data.phone,
        payment_terms=data.payment_terms, notes=data.notes
    )
    doc = vendor.model_dump()
    await db.vendors.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("vendor_id", None)
    await db.vendors.update_one({"vendor_id": vendor_id, "user_id": user.user_id}, {"$set": data})
    return await db.vendors.find_one({"vendor_id": vendor_id}, {"_id": 0})

@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str, user: User = Depends(get_current_user)):
    await db.vendors.delete_one({"vendor_id": vendor_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== MENU ITEMS ====================

@api_router.get("/menu-items")
async def get_menu_items(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        items = await db.menu_items.find({"project_id": project_id, "user_id": user.user_id}, {"_id": 0}).to_list(200)
    else:
        profile = await get_user_profile(user)
        items = await db.menu_items.find(
            {"$or": [{"profile_id": profile["profile_id"]}, {"user_id": user.user_id}]}, {"_id": 0}
        ).to_list(200)
    return items

@api_router.post("/menu-items")
async def add_menu_item(data: MenuItemCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    item = MenuItem(
        project_id=data.project_id, profile_id=profile["profile_id"],
        user_id=user.user_id, name=data.name, description=data.description,
        cost=data.cost, price=data.price, category=data.category,
        dietary_tags=data.dietary_tags, is_signature=data.is_signature
    )
    doc = item.model_dump()
    await db.menu_items.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/menu-items/{menu_item_id}")
async def update_menu_item(menu_item_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("menu_item_id", None)
    await db.menu_items.update_one({"menu_item_id": menu_item_id, "user_id": user.user_id}, {"$set": data})
    return await db.menu_items.find_one({"menu_item_id": menu_item_id}, {"_id": 0})

@api_router.delete("/menu-items/{menu_item_id}")
async def delete_menu_item(menu_item_id: str, user: User = Depends(get_current_user)):
    await db.menu_items.delete_one({"menu_item_id": menu_item_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== LEASE CLAUSES ====================

@api_router.get("/lease-clauses")
async def get_lease_clauses(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        clauses = await db.lease_clauses.find({"project_id": project_id, "user_id": user.user_id}, {"_id": 0}).to_list(100)
    else:
        profile = await get_user_profile(user)
        clauses = await db.lease_clauses.find(
            {"$or": [{"profile_id": profile["profile_id"]}, {"user_id": user.user_id}]}, {"_id": 0}
        ).to_list(100)
    return clauses

@api_router.post("/lease-clauses")
async def add_lease_clause(data: dict, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    clause = LeaseClause(
        project_id=data.get("project_id"), profile_id=profile["profile_id"],
        user_id=user.user_id, title=data["title"],
        original_text=data.get("original_text", ""), proposed_text=data.get("proposed_text", ""),
        status=data.get("status", "reviewing"), priority=data.get("priority", "medium"),
        notes=data.get("notes")
    )
    doc = clause.model_dump()
    await db.lease_clauses.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/lease-clauses/{clause_id}")
async def update_lease_clause(clause_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("clause_id", None)
    await db.lease_clauses.update_one({"clause_id": clause_id, "user_id": user.user_id}, {"$set": data})
    return await db.lease_clauses.find_one({"clause_id": clause_id}, {"_id": 0})

@api_router.delete("/lease-clauses/{clause_id}")
async def delete_lease_clause(clause_id: str, user: User = Depends(get_current_user)):
    await db.lease_clauses.delete_one({"clause_id": clause_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== UNITS ====================

@api_router.get("/units")
async def get_units(user: User = Depends(get_current_user)):
    units = await db.units.find({"user_id": user.user_id}, {"_id": 0}).to_list(100)
    return units

@api_router.post("/units")
async def add_unit(data: dict, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    unit = Unit(
        user_id=user.user_id, profile_id=profile["profile_id"],
        name=data["name"], location=data["location"],
        status=data.get("status", "active"), monthly_revenue=data.get("monthly_revenue", 0),
        open_date=data.get("open_date")
    )
    doc = unit.model_dump()
    await db.units.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api_router.put("/units/{unit_id}")
async def update_unit(unit_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("_id", None)
    data.pop("unit_id", None)
    await db.units.update_one({"unit_id": unit_id, "user_id": user.user_id}, {"$set": data})
    return await db.units.find_one({"unit_id": unit_id}, {"_id": 0})

@api_router.delete("/units/{unit_id}")
async def delete_unit(unit_id: str, user: User = Depends(get_current_user)):
    await db.units.delete_one({"unit_id": unit_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(user: User = Depends(get_current_user)):
    notifications = await db.notifications.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return notifications

@api_router.post("/notifications/read")
async def mark_notifications_read(user: User = Depends(get_current_user)):
    await db.notifications.update_many({"user_id": user.user_id, "read": False}, {"$set": {"read": True}})
    return {"message": "Marked as read"}

# ==================== AI ANALYSIS ====================

@api_router.post("/ai/analyze")
async def ai_analysis(data: AIAnalysisRequest, user: User = Depends(get_current_user)):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    profile = await get_user_profile(user)
    restaurant_name = profile.get("concept", {}).get("restaurant_name", "the restaurant")
    concept_type = profile.get("concept", {}).get("concept_type", "")
    food_cost_pct = profile.get("financial", {}).get("target_food_cost_percent", 30)
    price_range = profile.get("menu", {}).get("price_range", "")
    total_budget = profile.get("financial", {}).get("total_budget", 0)

    system_messages = {
        "lease": f"You are an expert restaurant lease analyst. The restaurant is called '{restaurant_name}', a {concept_type} concept. Analyze lease terms and identify potential issues, favorable clauses, and negotiation points. Provide actionable recommendations.",
        "menu": f"You are a restaurant menu engineering expert. The restaurant is '{restaurant_name}', targeting a {price_range} price point. Analyze menu items for profitability, pricing strategy, and cost optimization. Provide specific recommendations.",
        "cost": f"You are a restaurant cost analyst. Target food cost is {food_cost_pct}%. Calculate food costs, suggest pricing, and identify opportunities for cost reduction while maintaining quality.",
        "site": f"You are a restaurant site analysis expert. The concept is a {concept_type} restaurant called '{restaurant_name}'. Evaluate location potential based on demographics, foot traffic, competition, and market conditions.",
        "business": f"You are a restaurant business consultant. The restaurant is '{restaurant_name}' with a total budget of ${total_budget:,.0f}. Provide strategic advice."
    }

    system_message = system_messages.get(data.analysis_type, "You are a helpful restaurant business assistant.")
    ai_client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await ai_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system_message,
        messages=[{"role": "user", "content": data.content}]
    )
    return {"analysis": message.content[0].text.strip(), "type": data.analysis_type}

@api_router.post("/ai/cost-calculator")
async def ai_cost_calculator(data: dict, user: User = Depends(get_current_user)):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    profile = await get_user_profile(user)
    target_food_cost = profile.get("financial", {}).get("target_food_cost_percent", 30)

    system = f"""You are a restaurant cost calculator. The target food cost percentage is {target_food_cost}%. Given ingredient costs and quantities, calculate:
1. Total recipe cost
2. Cost per serving
3. Suggested menu price (targeting {target_food_cost}% food cost)
4. Profit margin analysis
Respond in a structured format."""

    ai_client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await ai_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=system,
        messages=[{"role": "user", "content": f"Calculate costs for this recipe:\n{data.get('ingredients', '')}\nNumber of servings: {data.get('servings', 1)}"}]
    )
    return {"calculation": message.content[0].text.strip()}

# ==================== MARKETEER AGENT ====================

@api_router.post("/marketeer/generate")
async def marketeer_generate(data: MarketeerRequest, user: User = Depends(get_current_user)):
    """AI-powered marketing content generator"""
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    profile = await get_user_profile(user)
    restaurant_name = profile.get("concept", {}).get("restaurant_name", "our restaurant")
    concept_type = profile.get("concept", {}).get("concept_type", "restaurant")
    cuisine_types = ", ".join(profile.get("concept", {}).get("cuisine_types", []))
    tagline = profile.get("concept", {}).get("tagline", "")
    brand_voice = profile.get("branding", {}).get("brand_voice", data.tone or "professional")
    target_demographic = profile.get("branding", {}).get("target_demographic", "food lovers")
    price_range = profile.get("menu", {}).get("price_range", "$$")
    city = profile.get("location", {}).get("city", "")

    location_str = f" in {city}" if city else ""

    task_prompts = {
        "social_post": f"""You are a social media expert for restaurants. Create an engaging {data.platform or 'social media'} post for {restaurant_name}, a {concept_type} restaurant{location_str} serving {cuisine_types or 'great food'}.
Brand voice: {brand_voice}. Target audience: {target_demographic}. Price range: {price_range}.
Tagline: {tagline}
Include relevant emojis, hashtags, and a call-to-action. Make it authentic and shareable.""",

        "email_campaign": f"""You are an email marketing specialist for restaurants. Create a compelling email campaign for {restaurant_name}.
Concept: {concept_type}{location_str}. Cuisine: {cuisine_types or 'diverse cuisine'}. Brand voice: {brand_voice}.
Include: subject line, preview text, email body with sections, and a clear CTA button text.
Target: {target_demographic}.""",

        "launch_strategy": f"""You are a restaurant marketing strategist. Create a 30-day pre-launch marketing strategy for {restaurant_name}, a {concept_type} restaurant{location_str}.
Brand voice: {brand_voice}. Cuisine: {cuisine_types or 'signature dishes'}. Target: {target_demographic}.
Include: week-by-week social media plan, influencer outreach, PR tactics, grand opening ideas, and budget recommendations.""",

        "brand_voice": f"""You are a brand strategist for restaurants. Develop a comprehensive brand voice guide for {restaurant_name}.
Concept: {concept_type}. Cuisine: {cuisine_types or 'distinctive menu'}. Current voice: {brand_voice}.
Include: tone guidelines, word choices to use/avoid, sample phrases, social media personality, and how to handle different scenarios (complaints, celebrations, announcements).""",

        "competitor_analysis": f"""You are a restaurant competitive intelligence expert. Help {restaurant_name} ({concept_type}{location_str}) analyze its competitive positioning.
Cuisine: {cuisine_types or 'unique offerings'}. Price range: {price_range}. Target: {target_demographic}.
Provide: competitive landscape overview, differentiation opportunities, positioning recommendations, and messaging that highlights unique advantages.""",

        "promo_copy": f"""You are a promotional copywriter specializing in restaurants. Write compelling promotional copy for {restaurant_name}.
Concept: {concept_type}. Cuisine: {cuisine_types or 'signature dishes'}. Brand voice: {brand_voice}. Price range: {price_range}.
Create multiple versions: headline, tagline, short description (50 words), full description (150 words), and a special offer hook.""",

        "marketing_calendar": f"""You are a restaurant marketing calendar expert. Build a 90-day marketing calendar for {restaurant_name} ({concept_type}{location_str}).
Cuisine: {cuisine_types or 'diverse menu'}. Target: {target_demographic}. Brand voice: {brand_voice}.
Include: monthly themes, weekly content pillars, key dates/holidays to leverage, promotional events, and content mix (educational, promotional, engagement)."""
    }

    system_message = task_prompts.get(data.task_type,
        f"You are a marketing expert for {restaurant_name}. Provide professional marketing advice tailored to a {concept_type} restaurant.")

    user_content = data.context or f"Create {data.task_type.replace('_', ' ')} content for {restaurant_name}."

    ai_client = anthropic.AsyncAnthropic(api_key=api_key)
    message = await ai_client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2048,
        system=system_message,
        messages=[{"role": "user", "content": user_content}]
    )

    result_text = message.content[0].text.strip()

    # Save to campaigns collection
    campaign_doc = {
        "campaign_id": f"cmp_{uuid.uuid4().hex[:8]}",
        "user_id": user.user_id,
        "profile_id": profile.get("profile_id"),
        "name": f"{data.task_type.replace('_', ' ').title()} - {datetime.now(timezone.utc).strftime('%b %d')}",
        "type": data.task_type,
        "platform": data.platform or "",
        "content": result_text,
        "status": "generated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.marketing_campaigns.insert_one(campaign_doc)
    campaign_doc.pop("_id", None)

    return {"content": result_text, "task_type": data.task_type, "campaign_id": campaign_doc["campaign_id"]}

@api_router.get("/marketeer/campaigns")
async def get_campaigns(user: User = Depends(get_current_user)):
    campaigns = await db.marketing_campaigns.find({"user_id": user.user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return campaigns

@api_router.delete("/marketeer/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    await db.marketing_campaigns.delete_one({"campaign_id": campaign_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== SITE DEMOGRAPHICS ====================

@api_router.get("/site/demographics")
async def get_site_demographics(lat: float = 40.7128, lng: float = -74.0060, user: User = Depends(get_current_user)):
    import random
    profile = await get_user_profile(user)
    profile_lat = profile.get("location", {}).get("coordinates", {}).get("lat", lat)
    profile_lng = profile.get("location", {}).get("coordinates", {}).get("lng", lng)
    if profile_lat != 0:
        lat = profile_lat
    if profile_lng != 0:
        lng = profile_lng

    return {
        "foot_traffic": {"daily": 12500 + random.randint(-500, 500), "trend": "+8.2%", "peak_hours": "12pm - 2pm, 6pm - 9pm"},
        "competition": {"count": random.randint(18, 24), "density": "medium", "nearest_competitor": "0.3 mi"},
        "income": {"median": 78500 + random.randint(-2000, 2000), "bracket": "$75k-$100k", "trend": "+4.1%"},
        "walkability": {"score": random.randint(85, 95), "grade": "A", "transit_score": random.randint(80, 90)},
        "population": {"density": 28500, "growth": "+2.3%", "age_median": 34}
    }

# ==================== STRIPE SUBSCRIPTIONS ====================

SUBSCRIPTION_PLANS = {
    "single_unit": {
        "name": "Single Unit",
        "price": 14.00,
        "price_id": "price_1TEsmoHAM0vSVVVHU5WvspOt",
        "features": [
            "1 Restaurant Project",
            "Command Center Access",
            "Site Strategist",
            "Ground Up Module",
            "Ops Launchpad",
            "Marketeer Agent",
            "Email Support"
        ]
    },
    "multi_unit": {
        "name": "Multi-Unit",
        "price": 18.00,
        "price_id": "price_1TEsogHAM0vSVVVHFPc8kY5T",
        "features": [
            "Unlimited Restaurant Projects",
            "All Single Unit Features",
            "Expansion Toolkit",
            "Lease Negotiation Module",
            "AI-Powered Analysis",
            "Priority Support",
            "Franchise Readiness Tools"
        ]
    }
}

class SubscriptionRequest(BaseModel):
    plan_id: str
    origin_url: str

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    return {
        "plans": [
            {"id": pid, "name": p["name"], "price": p["price"], "features": p["features"]}
            for pid, p in SUBSCRIPTION_PLANS.items()
        ]
    }

@api_router.post("/subscriptions/checkout")
async def create_subscription_checkout(data: SubscriptionRequest, user: User = Depends(get_current_user)):
    if data.plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan ID")

    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    plan = SUBSCRIPTION_PLANS[data.plan_id]
    stripe.api_key = stripe_api_key

    try:
        session = stripe.checkout.Session.create(
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{"price": plan["price_id"], "quantity": 1}],
            success_url=f"{data.origin_url}/subscription/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{data.origin_url}/pricing",
            customer_email=user.email,
            metadata={"user_id": user.user_id, "plan_id": data.plan_id}
        )

        await db.payment_transactions.insert_one({
            "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
            "session_id": session.id,
            "user_id": user.user_id,
            "plan_id": data.plan_id,
            "plan_name": plan["name"],
            "amount": plan["price"],
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat()
        })

        return {"url": session.url, "session_id": session.id}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/subscriptions/status/{session_id}")
async def get_subscription_status(session_id: str, user: User = Depends(get_current_user)):
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    stripe.api_key = stripe_api_key
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            existing = await db.payment_transactions.find_one({"session_id": session_id})
            if existing and existing.get("payment_status") != "paid":
                await db.users.update_one(
                    {"user_id": user.user_id},
                    {"$set": {"subscription_plan": existing.get("plan_id"), "subscription_status": "active"}}
                )
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        return {"status": session.status, "payment_status": session.payment_status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/subscriptions/my-subscription")
async def get_my_subscription(user: User = Depends(get_current_user)):
    user_doc = await db.users.find_one({"user_id": user.user_id}, {"_id": 0})
    return {
        "plan": user_doc.get("subscription_plan"),
        "status": user_doc.get("subscription_status", "none")
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Stripe not configured")

    stripe.api_key = stripe_api_key
    body = await request.body()
    signature = request.headers.get("Stripe-Signature", "")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    try:
        if webhook_secret and signature:
            event = stripe.Webhook.construct_event(body, signature, webhook_secret)
        else:
            event = json.loads(body)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event["type"] == "checkout.session.completed":
        sid = event["data"]["object"].get("id")
        if sid:
            await db.payment_transactions.update_one(
                {"session_id": sid},
                {"$set": {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )

    return {"received": True}

# ==================== DONATIONS ====================

class DonationRequest(BaseModel):
    amount: float
    donor_name: str = "Anonymous"
    message: str = ""
    origin_url: str

@api_router.post("/donations/checkout")
async def create_donation_checkout(data: DonationRequest):
    """Create a Stripe checkout session for a one-time donation"""
    if data.amount < 1:
        raise HTTPException(status_code=400, detail="Minimum donation is $1")

    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment service not configured")

    stripe.api_key = stripe_api_key

    try:
        session = stripe.checkout.Session.create(
            mode="payment",
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "usd",
                    "unit_amount": int(data.amount * 100),
                    "product_data": {
                        "name": "Restaurateur Pro Community Support",
                        "description": f"Donation from {data.donor_name}" + (f": {data.message}" if data.message else ""),
                        "images": [],
                    },
                },
                "quantity": 1,
            }],
            success_url=f"{data.origin_url}/donation/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{data.origin_url}/donate",
            metadata={
                "donor_name": data.donor_name,
                "message": data.message,
                "amount": str(data.amount),
            },
        )

        await db.donations.insert_one({
            "donation_id": f"don_{uuid.uuid4().hex[:12]}",
            "session_id": session.id,
            "donor_name": data.donor_name,
            "message": data.message,
            "amount": data.amount,
            "currency": "usd",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

        return {"url": session.url, "session_id": session.id}

    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/donations/status/{session_id}")
async def get_donation_status(session_id: str):
    """Check donation payment status"""
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment service not configured")

    stripe.api_key = stripe_api_key
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            await db.donations.update_one(
                {"session_id": session_id},
                {"$set": {"status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
            )
        return {"status": session.status, "payment_status": session.payment_status, "amount": session.amount_total}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== HEALTH CHECK ====================

@api_router.get("/")
async def root():
    return {"message": "Restaurateur Pro API", "version": "3.0", "status": "operational"}

@api_router.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# ==================== MIDDLEWARE & STARTUP ====================

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
