from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import aiosqlite
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

DB_PATH = os.environ.get("DB_PATH", str(ROOT_DIR / "restaunteur.db"))

app = FastAPI(title="Restaurateur Pro API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== DATABASE LAYER ====================

JSON_FIELDS = {
    "business_profiles": ["concept", "location", "financial", "operational", "menu", "team", "branding"],
    "menu_items": ["dietary_tags"],
}

BOOL_FIELDS = {
    "users": ["onboarding_completed"],
    "business_profiles": ["onboarding_completed"],
    "menu_items": ["is_signature", "is_active"],
    "notifications": ["read"],
}

def parse_row(table: str, row) -> Optional[dict]:
    if row is None:
        return None
    d = dict(row)
    for field in JSON_FIELDS.get(table, []):
        if field in d and isinstance(d[field], str):
            try:
                d[field] = json.loads(d[field])
            except (json.JSONDecodeError, TypeError):
                pass
    for field in BOOL_FIELDS.get(table, []):
        if field in d and d[field] is not None:
            d[field] = bool(d[field])
    return d

def _serialize(table: str, data: dict) -> dict:
    result = dict(data)
    for field in JSON_FIELDS.get(table, []):
        if field in result and not isinstance(result[field], str):
            result[field] = json.dumps(result[field])
    return result

async def db_get(table: str, where: dict) -> Optional[dict]:
    conditions = " AND ".join(f"{k} = ?" for k in where)
    sql = f"SELECT * FROM {table} WHERE {conditions} LIMIT 1"
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        async with conn.execute(sql, tuple(where.values())) as cur:
            return parse_row(table, await cur.fetchone())

async def db_list(table: str, where: dict = None, or_where: list = None,
                  order_by: str = None, desc: bool = False, limit: int = 200) -> List[dict]:
    parts, params = [], []
    if where:
        for k, v in where.items():
            parts.append(f"{k} = ?")
            params.append(v)
    if or_where:
        parts.append(f"({' OR '.join(f'{k} = ?' for k, _ in or_where)})")
        params += [v for _, v in or_where]
    sql = f"SELECT * FROM {table}"
    if parts:
        sql += f" WHERE {' AND '.join(parts)}"
    if order_by:
        sql += f" ORDER BY {order_by} {'DESC' if desc else 'ASC'}"
    sql += f" LIMIT {limit}"
    async with aiosqlite.connect(DB_PATH) as conn:
        conn.row_factory = aiosqlite.Row
        async with conn.execute(sql, tuple(params)) as cur:
            return [parse_row(table, r) for r in await cur.fetchall()]

async def db_insert(table: str, data: dict):
    data = _serialize(table, data)
    cols = ", ".join(data.keys())
    placeholders = ", ".join("?" * len(data))
    async with aiosqlite.connect(DB_PATH) as conn:
        await conn.execute(f"INSERT INTO {table} ({cols}) VALUES ({placeholders})", tuple(data.values()))
        await conn.commit()

async def db_update(table: str, where: dict, data: dict):
    data = _serialize(table, data)
    set_clause = ", ".join(f"{k} = ?" for k in data)
    where_clause = " AND ".join(f"{k} = ?" for k in where)
    async with aiosqlite.connect(DB_PATH) as conn:
        await conn.execute(
            f"UPDATE {table} SET {set_clause} WHERE {where_clause}",
            tuple(data.values()) + tuple(where.values())
        )
        await conn.commit()

async def db_delete(table: str, where: dict):
    where_clause = " AND ".join(f"{k} = ?" for k in where)
    async with aiosqlite.connect(DB_PATH) as conn:
        await conn.execute(f"DELETE FROM {table} WHERE {where_clause}", tuple(where.values()))
        await conn.commit()

async def db_count(table: str, where: dict) -> int:
    where_clause = " AND ".join(f"{k} = ?" for k in where)
    async with aiosqlite.connect(DB_PATH) as conn:
        async with conn.execute(f"SELECT COUNT(*) FROM {table} WHERE {where_clause}", tuple(where.values())) as cur:
            row = await cur.fetchone()
            return row[0] if row else 0

async def init_db():
    async with aiosqlite.connect(DB_PATH) as conn:
        await conn.execute("PRAGMA journal_mode=WAL")
        await conn.executescript("""
CREATE TABLE IF NOT EXISTS users (
    user_id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    picture TEXT,
    password_hash TEXT,
    onboarding_completed INTEGER DEFAULT 0,
    subscription_plan TEXT,
    subscription_status TEXT DEFAULT 'none',
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS user_sessions (
    session_token TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at TEXT,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS business_profiles (
    profile_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    concept TEXT DEFAULT '{}',
    location TEXT DEFAULT '{}',
    financial TEXT DEFAULT '{}',
    operational TEXT DEFAULT '{}',
    menu TEXT DEFAULT '{}',
    team TEXT DEFAULT '{}',
    branding TEXT DEFAULT '{}',
    onboarding_completed INTEGER DEFAULT 0,
    onboarding_step INTEGER DEFAULT 0,
    created_at TEXT,
    updated_at TEXT
);
CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT,
    location TEXT,
    phase TEXT DEFAULT 'concept',
    completion INTEGER DEFAULT 0,
    budget_total REAL DEFAULT 0,
    budget_invested REAL DEFAULT 0,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS tasks (
    task_id TEXT PRIMARY KEY,
    project_id TEXT,
    user_id TEXT NOT NULL,
    title TEXT,
    description TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    category TEXT DEFAULT 'general',
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS team_members (
    member_id TEXT PRIMARY KEY,
    project_id TEXT,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    name TEXT,
    role TEXT,
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    avatar_color TEXT DEFAULT 'purple',
    status TEXT DEFAULT 'active',
    hire_date TEXT,
    notes TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS budget_items (
    budget_id TEXT PRIMARY KEY,
    project_id TEXT,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    category TEXT,
    subcategory TEXT DEFAULT '',
    planned REAL,
    spent REAL DEFAULT 0,
    notes TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id TEXT PRIMARY KEY,
    project_id TEXT,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    name TEXT,
    category TEXT DEFAULT '',
    specs TEXT,
    vendor TEXT DEFAULT '',
    cost REAL DEFAULT 0,
    status TEXT DEFAULT 'pending',
    notes TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS permits (
    permit_id TEXT PRIMARY KEY,
    project_id TEXT,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    name TEXT,
    issuing_authority TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    submitted_date TEXT,
    approved_date TEXT,
    expiry_date TEXT,
    cost REAL DEFAULT 0,
    notes TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS candidates (
    candidate_id TEXT PRIMARY KEY,
    project_id TEXT,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    name TEXT,
    position TEXT,
    stage TEXT DEFAULT 'application',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    resume_notes TEXT DEFAULT '',
    interview_notes TEXT DEFAULT '',
    salary_expectation REAL DEFAULT 0,
    start_date TEXT
);
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id TEXT PRIMARY KEY,
    project_id TEXT,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    name TEXT,
    category TEXT,
    contact_name TEXT DEFAULT '',
    email TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    payment_terms TEXT DEFAULT '',
    status TEXT DEFAULT 'active',
    delivery_status TEXT DEFAULT 'on_time',
    notes TEXT DEFAULT ''
);
CREATE TABLE IF NOT EXISTS menu_items (
    menu_item_id TEXT PRIMARY KEY,
    project_id TEXT,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    name TEXT,
    description TEXT DEFAULT '',
    cost REAL,
    price REAL,
    category TEXT,
    dietary_tags TEXT DEFAULT '[]',
    is_signature INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1
);
CREATE TABLE IF NOT EXISTS lease_clauses (
    clause_id TEXT PRIMARY KEY,
    project_id TEXT,
    profile_id TEXT,
    user_id TEXT NOT NULL,
    title TEXT,
    original_text TEXT DEFAULT '',
    proposed_text TEXT DEFAULT '',
    status TEXT DEFAULT 'reviewing',
    priority TEXT DEFAULT 'medium',
    notes TEXT
);
CREATE TABLE IF NOT EXISTS units (
    unit_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    profile_id TEXT,
    name TEXT,
    location TEXT,
    status TEXT DEFAULT 'active',
    monthly_revenue REAL DEFAULT 0,
    open_date TEXT
);
CREATE TABLE IF NOT EXISTS notifications (
    notification_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    message TEXT,
    type TEXT DEFAULT 'info',
    read INTEGER DEFAULT 0,
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    campaign_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    profile_id TEXT,
    name TEXT,
    type TEXT,
    platform TEXT DEFAULT '',
    content TEXT,
    status TEXT DEFAULT 'draft',
    created_at TEXT
);
CREATE TABLE IF NOT EXISTS payment_transactions (
    transaction_id TEXT PRIMARY KEY,
    session_id TEXT,
    user_id TEXT,
    plan_id TEXT,
    plan_name TEXT,
    amount REAL,
    payment_status TEXT DEFAULT 'pending',
    created_at TEXT,
    updated_at TEXT
);
CREATE TABLE IF NOT EXISTS donations (
    donation_id TEXT PRIMARY KEY,
    session_id TEXT,
    donor_name TEXT DEFAULT 'Anonymous',
    message TEXT DEFAULT '',
    amount REAL,
    currency TEXT DEFAULT 'usd',
    status TEXT DEFAULT 'pending',
    created_at TEXT,
    updated_at TEXT
);
        """)
        await conn.commit()

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
    task_type: str
    platform: Optional[str] = None
    context: Optional[str] = None
    tone: Optional[str] = None

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

    session = await db_get("user_sessions", {"session_token": session_token})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")

    user = await db_get("users", {"user_id": session["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return User(**{k: v for k, v in user.items() if k in User.model_fields})

async def get_user_profile(user: User) -> dict:
    profile = await db_get("business_profiles", {"user_id": user.user_id})
    if not profile:
        new_profile = BusinessProfile(user_id=user.user_id)
        doc = new_profile.model_dump()
        doc["created_at"] = doc["created_at"].isoformat()
        doc["updated_at"] = doc["updated_at"].isoformat()
        await db_insert("business_profiles", doc)
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

    existing = await db_get("users", {"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = f"user_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    new_user = {
        "user_id": user_id,
        "email": data.email.lower(),
        "name": data.name or data.email.split("@")[0],
        "password_hash": hash_password(data.password),
        "picture": None,
        "onboarding_completed": False,
        "created_at": now
    }
    await db_insert("users", new_user)

    new_profile = BusinessProfile(user_id=user_id)
    doc = new_profile.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    doc["updated_at"] = doc["updated_at"].isoformat()
    await db_insert("business_profiles", doc)

    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db_insert("user_sessions", {
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at, "created_at": now
    })

    _set_session_cookie(response, session_token)
    return {k: v for k, v in new_user.items() if k != "password_hash"}

@api_router.post("/auth/login")
async def login(data: LoginRequest, response: Response):
    if not data.email or not data.password:
        raise HTTPException(status_code=400, detail="Email and password required")

    user = await db_get("users", {"email": data.email.lower()})
    if not user or user.get("password_hash") != hash_password(data.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = user["user_id"]
    now = datetime.now(timezone.utc).isoformat()
    session_token = f"sess_{uuid.uuid4().hex}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()

    await db_delete("user_sessions", {"user_id": user_id})
    await db_insert("user_sessions", {
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at, "created_at": now
    })

    _set_session_cookie(response, session_token)
    return {k: v for k, v in user.items() if k not in ["password_hash"]}

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
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

    email = auth_data.get("email")
    existing_user = await db_get("users", {"email": email})
    now = datetime.now(timezone.utc).isoformat()

    if existing_user:
        user_id = existing_user["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        new_user = {
            "user_id": user_id,
            "email": email,
            "name": auth_data.get("name", "User"),
            "picture": auth_data.get("picture"),
            "onboarding_completed": False,
            "created_at": now
        }
        await db_insert("users", new_user)

        new_profile = BusinessProfile(user_id=user_id)
        pdoc = new_profile.model_dump()
        pdoc["created_at"] = pdoc["created_at"].isoformat()
        pdoc["updated_at"] = pdoc["updated_at"].isoformat()
        await db_insert("business_profiles", pdoc)

        await db_insert("projects", {
            "project_id": f"proj_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "name": "My First Restaurant",
            "location": "New York, NY",
            "phase": "concept",
            "completion": 15,
            "budget_total": 500000,
            "budget_invested": 75000,
            "created_at": now
        })

    session_token = auth_data.get("session_token", f"sess_{uuid.uuid4().hex}")
    expires_at = (datetime.now(timezone.utc) + timedelta(days=7)).isoformat()
    await db_delete("user_sessions", {"user_id": user_id})
    await db_insert("user_sessions", {
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at, "created_at": now
    })

    user = await db_get("users", {"user_id": user_id})
    _set_session_cookie(response, session_token)
    return {k: v for k, v in user.items() if k != "password_hash"}

SECRET_ACCESS_CODE = "restaurateur2026"

@api_router.post("/auth/secret")
async def secret_login(request: Request, response: Response):
    body = await request.json()
    if body.get("code") != SECRET_ACCESS_CODE:
        raise HTTPException(status_code=401, detail="Invalid access code")

    admin_email = "admin@restaurateurpro.com"
    now = datetime.now(timezone.utc).isoformat()
    existing_user = await db_get("users", {"email": admin_email})

    if existing_user:
        user_id = existing_user["user_id"]
    else:
        user_id = f"admin_{uuid.uuid4().hex[:8]}"
        await db_insert("users", {
            "user_id": user_id,
            "email": admin_email,
            "name": "Admin Access",
            "picture": None,
            "onboarding_completed": True,
            "created_at": now
        })

        new_profile = BusinessProfile(user_id=user_id)
        new_profile.onboarding_completed = True
        new_profile.concept = ConceptBasics(
            restaurant_name="Demo Restaurant",
            concept_type="casual",
            cuisine_types=["American", "Contemporary"],
            tagline="Fresh & Local"
        )
        pdoc = new_profile.model_dump()
        pdoc["created_at"] = pdoc["created_at"].isoformat()
        pdoc["updated_at"] = pdoc["updated_at"].isoformat()
        await db_insert("business_profiles", pdoc)

        await db_insert("projects", {
            "project_id": f"proj_{uuid.uuid4().hex[:12]}",
            "user_id": user_id,
            "name": "Demo Restaurant",
            "location": "New York, NY",
            "phase": "concept",
            "completion": 35,
            "budget_total": 500000,
            "budget_invested": 175000,
            "created_at": now
        })

    session_token = f"secret_{uuid.uuid4().hex}"
    expires_at = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()
    await db_delete("user_sessions", {"user_id": user_id})
    await db_insert("user_sessions", {
        "user_id": user_id, "session_token": session_token,
        "expires_at": expires_at, "created_at": now
    })

    user = await db_get("users", {"user_id": user_id})
    _set_session_cookie(response, session_token, days=14)
    return {**{k: v for k, v in user.items() if k != "password_hash"}, "expires_in_days": 14}

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
        await db_delete("user_sessions", {"session_token": session_token})
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out"}

# ==================== BUSINESS PROFILE ENDPOINTS ====================

@api_router.get("/profile")
async def get_profile(user: User = Depends(get_current_user)):
    return await get_user_profile(user)

@api_router.put("/profile")
async def update_profile(data: BusinessProfileUpdate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    valid_sections = ["concept", "location", "financial", "operational", "menu", "team", "branding"]
    if data.section not in valid_sections:
        raise HTTPException(status_code=400, detail=f"Invalid section. Must be one of: {valid_sections}")
    await db_update("business_profiles",
        {"profile_id": profile["profile_id"]},
        {data.section: data.data, "updated_at": datetime.now(timezone.utc).isoformat()}
    )
    return await db_get("business_profiles", {"profile_id": profile["profile_id"]})

@api_router.put("/profile/onboarding-step")
async def update_onboarding_step(data: dict, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    step = data.get("step", 0)
    completed = data.get("completed", False)
    await db_update("business_profiles",
        {"profile_id": profile["profile_id"]},
        {"onboarding_step": step, "onboarding_completed": completed,
         "updated_at": datetime.now(timezone.utc).isoformat()}
    )
    if completed:
        await db_update("users", {"user_id": user.user_id}, {"onboarding_completed": True})
    return {"step": step, "completed": completed}

@api_router.get("/profile/summary")
async def get_profile_summary(user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    pid = profile["profile_id"]

    team_count = await db_count("team_members", {"profile_id": pid})
    menu_count = await db_count("menu_items", {"profile_id": pid})
    vendor_count = await db_count("vendors", {"profile_id": pid})
    equipment_count = await db_count("equipment", {"profile_id": pid})
    permit_count = await db_count("permits", {"profile_id": pid})

    budget_items = await db_list("budget_items", where={"profile_id": pid})
    total_planned = sum(item.get("planned", 0) for item in budget_items)
    total_spent = sum(item.get("spent", 0) for item in budget_items)

    concept = profile.get("concept") or {}
    location = profile.get("location") or {}
    financial = profile.get("financial") or {}
    operational = profile.get("operational") or {}

    return {
        "profile_id": pid,
        "restaurant_name": concept.get("restaurant_name", ""),
        "concept_type": concept.get("concept_type", ""),
        "location": f"{location.get('city', '')}, {location.get('state', '')}",
        "total_budget": financial.get("total_budget", 0),
        "budget_spent": total_spent,
        "budget_planned": total_planned,
        "team_count": team_count,
        "menu_count": menu_count,
        "vendor_count": vendor_count,
        "equipment_count": equipment_count,
        "permit_count": permit_count,
        "target_open_date": operational.get("target_open_date", ""),
        "onboarding_completed": profile.get("onboarding_completed", False)
    }

# ==================== PROJECTS ====================

@api_router.get("/projects")
async def get_projects(user: User = Depends(get_current_user)):
    return await db_list("projects", where={"user_id": user.user_id})

@api_router.post("/projects")
async def create_project(data: ProjectCreate, user: User = Depends(get_current_user)):
    project = Project(user_id=user.user_id, name=data.name, location=data.location, budget_total=data.budget_total)
    doc = project.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db_insert("projects", doc)
    return doc

@api_router.put("/projects/{project_id}")
async def update_project(project_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("user_id", None)
    await db_update("projects", {"project_id": project_id, "user_id": user.user_id}, data)
    return await db_get("projects", {"project_id": project_id})

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user: User = Depends(get_current_user)):
    await db_delete("projects", {"project_id": project_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== TASKS ====================

@api_router.get("/tasks")
async def get_tasks(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    where = {"user_id": user.user_id}
    if project_id:
        where["project_id"] = project_id
    return await db_list("tasks", where=where)

@api_router.post("/tasks")
async def create_task(data: TaskCreate, user: User = Depends(get_current_user)):
    task = Task(project_id=data.project_id, user_id=user.user_id, title=data.title,
                description=data.description, status=data.status, priority=data.priority,
                due_date=data.due_date, category=data.category)
    doc = task.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    await db_insert("tasks", doc)
    return doc

@api_router.put("/tasks/{task_id}")
async def update_task(task_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("task_id", None)
    await db_update("tasks", {"task_id": task_id, "user_id": user.user_id}, data)
    return await db_get("tasks", {"task_id": task_id})

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str, user: User = Depends(get_current_user)):
    await db_delete("tasks", {"task_id": task_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== TEAM ====================

@api_router.get("/team")
async def get_team(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        return await db_list("team_members", where={"project_id": project_id, "user_id": user.user_id})
    profile = await get_user_profile(user)
    return await db_list("team_members", or_where=[("profile_id", profile["profile_id"]), ("user_id", user.user_id)])

@api_router.post("/team")
async def add_team_member(data: TeamMemberCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    member = TeamMember(project_id=data.project_id, profile_id=profile["profile_id"],
                        user_id=user.user_id, name=data.name, role=data.role, email=data.email,
                        phone=data.phone, avatar_color=data.avatar_color, hire_date=data.hire_date, notes=data.notes)
    doc = member.model_dump()
    await db_insert("team_members", doc)
    return doc

@api_router.put("/team/{member_id}")
async def update_team_member(member_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("member_id", None)
    await db_update("team_members", {"member_id": member_id, "user_id": user.user_id}, data)
    return await db_get("team_members", {"member_id": member_id})

@api_router.delete("/team/{member_id}")
async def delete_team_member(member_id: str, user: User = Depends(get_current_user)):
    await db_delete("team_members", {"member_id": member_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== BUDGET ====================

@api_router.get("/budget")
async def get_budget(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        return await db_list("budget_items", where={"project_id": project_id, "user_id": user.user_id})
    profile = await get_user_profile(user)
    return await db_list("budget_items", or_where=[("profile_id", profile["profile_id"]), ("user_id", user.user_id)])

@api_router.post("/budget")
async def create_budget_item(data: BudgetItemCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    item = BudgetItem(project_id=data.project_id, profile_id=profile["profile_id"],
                      user_id=user.user_id, category=data.category, subcategory=data.subcategory,
                      planned=data.planned, spent=data.spent, notes=data.notes)
    doc = item.model_dump()
    await db_insert("budget_items", doc)
    return doc

@api_router.put("/budget/{budget_id}")
async def update_budget_item(budget_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("budget_id", None)
    await db_update("budget_items", {"budget_id": budget_id, "user_id": user.user_id}, data)
    return await db_get("budget_items", {"budget_id": budget_id})

@api_router.delete("/budget/{budget_id}")
async def delete_budget_item(budget_id: str, user: User = Depends(get_current_user)):
    await db_delete("budget_items", {"budget_id": budget_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== EQUIPMENT ====================

@api_router.get("/equipment")
async def get_equipment(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        return await db_list("equipment", where={"project_id": project_id, "user_id": user.user_id})
    profile = await get_user_profile(user)
    return await db_list("equipment", or_where=[("profile_id", profile["profile_id"]), ("user_id", user.user_id)])

@api_router.post("/equipment")
async def add_equipment(data: EquipmentCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    eq = Equipment(project_id=data.project_id, profile_id=profile["profile_id"],
                   user_id=user.user_id, name=data.name, category=data.category,
                   specs=data.specs, vendor=data.vendor, cost=data.cost, status=data.status, notes=data.notes)
    doc = eq.model_dump()
    await db_insert("equipment", doc)
    return doc

@api_router.put("/equipment/{equipment_id}")
async def update_equipment(equipment_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("equipment_id", None)
    await db_update("equipment", {"equipment_id": equipment_id, "user_id": user.user_id}, data)
    return await db_get("equipment", {"equipment_id": equipment_id})

@api_router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str, user: User = Depends(get_current_user)):
    await db_delete("equipment", {"equipment_id": equipment_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== PERMITS ====================

@api_router.get("/permits")
async def get_permits(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        return await db_list("permits", where={"project_id": project_id, "user_id": user.user_id})
    profile = await get_user_profile(user)
    return await db_list("permits", or_where=[("profile_id", profile["profile_id"]), ("user_id", user.user_id)])

@api_router.post("/permits")
async def add_permit(data: PermitCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    permit = Permit(project_id=data.project_id, profile_id=profile["profile_id"],
                    user_id=user.user_id, name=data.name, issuing_authority=data.issuing_authority,
                    status=data.status, submitted_date=data.submitted_date, cost=data.cost, notes=data.notes)
    doc = permit.model_dump()
    await db_insert("permits", doc)
    return doc

@api_router.put("/permits/{permit_id}")
async def update_permit(permit_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("permit_id", None)
    await db_update("permits", {"permit_id": permit_id, "user_id": user.user_id}, data)
    return await db_get("permits", {"permit_id": permit_id})

@api_router.delete("/permits/{permit_id}")
async def delete_permit(permit_id: str, user: User = Depends(get_current_user)):
    await db_delete("permits", {"permit_id": permit_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== HIRING ====================

@api_router.get("/candidates")
async def get_candidates(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        return await db_list("candidates", where={"project_id": project_id, "user_id": user.user_id})
    profile = await get_user_profile(user)
    return await db_list("candidates", or_where=[("profile_id", profile["profile_id"]), ("user_id", user.user_id)])

@api_router.post("/candidates")
async def add_candidate(data: HiringCandidateCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    candidate = HiringCandidate(project_id=data.project_id, profile_id=profile["profile_id"],
                                user_id=user.user_id, name=data.name, position=data.position,
                                stage=data.stage, email=data.email, phone=data.phone,
                                resume_notes=data.resume_notes, salary_expectation=data.salary_expectation)
    doc = candidate.model_dump()
    await db_insert("candidates", doc)
    return doc

@api_router.put("/candidates/{candidate_id}")
async def update_candidate(candidate_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("candidate_id", None)
    await db_update("candidates", {"candidate_id": candidate_id, "user_id": user.user_id}, data)
    return await db_get("candidates", {"candidate_id": candidate_id})

@api_router.delete("/candidates/{candidate_id}")
async def delete_candidate(candidate_id: str, user: User = Depends(get_current_user)):
    await db_delete("candidates", {"candidate_id": candidate_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== VENDORS ====================

@api_router.get("/vendors")
async def get_vendors(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        return await db_list("vendors", where={"project_id": project_id, "user_id": user.user_id})
    profile = await get_user_profile(user)
    return await db_list("vendors", or_where=[("profile_id", profile["profile_id"]), ("user_id", user.user_id)])

@api_router.post("/vendors")
async def add_vendor(data: VendorCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    vendor = Vendor(project_id=data.project_id, profile_id=profile["profile_id"],
                    user_id=user.user_id, name=data.name, category=data.category,
                    contact_name=data.contact_name, email=data.email, phone=data.phone,
                    payment_terms=data.payment_terms, notes=data.notes)
    doc = vendor.model_dump()
    await db_insert("vendors", doc)
    return doc

@api_router.put("/vendors/{vendor_id}")
async def update_vendor(vendor_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("vendor_id", None)
    await db_update("vendors", {"vendor_id": vendor_id, "user_id": user.user_id}, data)
    return await db_get("vendors", {"vendor_id": vendor_id})

@api_router.delete("/vendors/{vendor_id}")
async def delete_vendor(vendor_id: str, user: User = Depends(get_current_user)):
    await db_delete("vendors", {"vendor_id": vendor_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== MENU ITEMS ====================

@api_router.get("/menu-items")
async def get_menu_items(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        return await db_list("menu_items", where={"project_id": project_id, "user_id": user.user_id})
    profile = await get_user_profile(user)
    return await db_list("menu_items", or_where=[("profile_id", profile["profile_id"]), ("user_id", user.user_id)])

@api_router.post("/menu-items")
async def add_menu_item(data: MenuItemCreate, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    item = MenuItem(project_id=data.project_id, profile_id=profile["profile_id"],
                    user_id=user.user_id, name=data.name, description=data.description,
                    cost=data.cost, price=data.price, category=data.category,
                    dietary_tags=data.dietary_tags, is_signature=data.is_signature)
    doc = item.model_dump()
    await db_insert("menu_items", doc)
    return doc

@api_router.put("/menu-items/{menu_item_id}")
async def update_menu_item(menu_item_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("menu_item_id", None)
    await db_update("menu_items", {"menu_item_id": menu_item_id, "user_id": user.user_id}, data)
    return await db_get("menu_items", {"menu_item_id": menu_item_id})

@api_router.delete("/menu-items/{menu_item_id}")
async def delete_menu_item(menu_item_id: str, user: User = Depends(get_current_user)):
    await db_delete("menu_items", {"menu_item_id": menu_item_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== LEASE CLAUSES ====================

@api_router.get("/lease-clauses")
async def get_lease_clauses(project_id: Optional[str] = None, user: User = Depends(get_current_user)):
    if project_id:
        return await db_list("lease_clauses", where={"project_id": project_id, "user_id": user.user_id})
    profile = await get_user_profile(user)
    return await db_list("lease_clauses", or_where=[("profile_id", profile["profile_id"]), ("user_id", user.user_id)])

@api_router.post("/lease-clauses")
async def add_lease_clause(data: dict, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    clause = LeaseClause(project_id=data.get("project_id"), profile_id=profile["profile_id"],
                         user_id=user.user_id, title=data["title"],
                         original_text=data.get("original_text", ""), proposed_text=data.get("proposed_text", ""),
                         status=data.get("status", "reviewing"), priority=data.get("priority", "medium"),
                         notes=data.get("notes"))
    doc = clause.model_dump()
    await db_insert("lease_clauses", doc)
    return doc

@api_router.put("/lease-clauses/{clause_id}")
async def update_lease_clause(clause_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("clause_id", None)
    await db_update("lease_clauses", {"clause_id": clause_id, "user_id": user.user_id}, data)
    return await db_get("lease_clauses", {"clause_id": clause_id})

@api_router.delete("/lease-clauses/{clause_id}")
async def delete_lease_clause(clause_id: str, user: User = Depends(get_current_user)):
    await db_delete("lease_clauses", {"clause_id": clause_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== UNITS ====================

@api_router.get("/units")
async def get_units(user: User = Depends(get_current_user)):
    return await db_list("units", where={"user_id": user.user_id})

@api_router.post("/units")
async def add_unit(data: dict, user: User = Depends(get_current_user)):
    profile = await get_user_profile(user)
    unit = Unit(user_id=user.user_id, profile_id=profile["profile_id"],
                name=data["name"], location=data["location"],
                status=data.get("status", "active"), monthly_revenue=data.get("monthly_revenue", 0),
                open_date=data.get("open_date"))
    doc = unit.model_dump()
    await db_insert("units", doc)
    return doc

@api_router.put("/units/{unit_id}")
async def update_unit(unit_id: str, data: dict, user: User = Depends(get_current_user)):
    data.pop("unit_id", None)
    await db_update("units", {"unit_id": unit_id, "user_id": user.user_id}, data)
    return await db_get("units", {"unit_id": unit_id})

@api_router.delete("/units/{unit_id}")
async def delete_unit(unit_id: str, user: User = Depends(get_current_user)):
    await db_delete("units", {"unit_id": unit_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== NOTIFICATIONS ====================

@api_router.get("/notifications")
async def get_notifications(user: User = Depends(get_current_user)):
    return await db_list("notifications", where={"user_id": user.user_id}, order_by="created_at", desc=True, limit=50)

@api_router.post("/notifications/read")
async def mark_notifications_read(user: User = Depends(get_current_user)):
    async with aiosqlite.connect(DB_PATH) as conn:
        await conn.execute("UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0", (user.user_id,))
        await conn.commit()
    return {"message": "Marked as read"}

# ==================== AI ANALYSIS ====================

@api_router.post("/ai/analyze")
async def ai_analysis(data: AIAnalysisRequest, user: User = Depends(get_current_user)):
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    profile = await get_user_profile(user)
    concept = profile.get("concept") or {}
    financial = profile.get("financial") or {}
    menu_info = profile.get("menu") or {}

    restaurant_name = concept.get("restaurant_name", "the restaurant")
    concept_type = concept.get("concept_type", "")
    food_cost_pct = financial.get("target_food_cost_percent", 30)
    price_range = menu_info.get("price_range", "")
    total_budget = financial.get("total_budget", 0)

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
    target_food_cost = (profile.get("financial") or {}).get("target_food_cost_percent", 30)

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
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="AI service not configured")

    profile = await get_user_profile(user)
    concept = profile.get("concept") or {}
    branding = profile.get("branding") or {}
    menu_info = profile.get("menu") or {}
    location = profile.get("location") or {}

    restaurant_name = concept.get("restaurant_name", "our restaurant")
    concept_type = concept.get("concept_type", "restaurant")
    cuisine_types = ", ".join(concept.get("cuisine_types", []))
    tagline = concept.get("tagline", "")
    brand_voice = branding.get("brand_voice", data.tone or "professional")
    target_demographic = branding.get("target_demographic", "food lovers")
    price_range = menu_info.get("price_range", "$$")
    city = location.get("city", "")
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
Include: tone guidelines, word choices to use/avoid, sample phrases, social media personality, and how to handle different scenarios.""",

        "competitor_analysis": f"""You are a restaurant competitive intelligence expert. Help {restaurant_name} ({concept_type}{location_str}) analyze its competitive positioning.
Cuisine: {cuisine_types or 'unique offerings'}. Price range: {price_range}. Target: {target_demographic}.
Provide: competitive landscape overview, differentiation opportunities, positioning recommendations, and messaging that highlights unique advantages.""",

        "promo_copy": f"""You are a promotional copywriter specializing in restaurants. Write compelling promotional copy for {restaurant_name}.
Concept: {concept_type}. Cuisine: {cuisine_types or 'signature dishes'}. Brand voice: {brand_voice}. Price range: {price_range}.
Create multiple versions: headline, tagline, short description (50 words), full description (150 words), and a special offer hook.""",

        "marketing_calendar": f"""You are a restaurant marketing calendar expert. Build a 90-day marketing calendar for {restaurant_name} ({concept_type}{location_str}).
Cuisine: {cuisine_types or 'diverse menu'}. Target: {target_demographic}. Brand voice: {brand_voice}.
Include: monthly themes, weekly content pillars, key dates/holidays to leverage, promotional events, and content mix."""
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
    await db_insert("marketing_campaigns", campaign_doc)
    return {"content": result_text, "task_type": data.task_type, "campaign_id": campaign_doc["campaign_id"]}

@api_router.get("/marketeer/campaigns")
async def get_campaigns(user: User = Depends(get_current_user)):
    return await db_list("marketing_campaigns", where={"user_id": user.user_id}, order_by="created_at", desc=True, limit=50)

@api_router.delete("/marketeer/campaigns/{campaign_id}")
async def delete_campaign(campaign_id: str, user: User = Depends(get_current_user)):
    await db_delete("marketing_campaigns", {"campaign_id": campaign_id, "user_id": user.user_id})
    return {"message": "Deleted"}

# ==================== SITE DEMOGRAPHICS ====================

@api_router.get("/site/demographics")
async def get_site_demographics(lat: float = 40.7128, lng: float = -74.0060, user: User = Depends(get_current_user)):
    import random
    profile = await get_user_profile(user)
    coords = (profile.get("location") or {}).get("coordinates", {})
    if coords.get("lat", 0) != 0:
        lat = coords["lat"]
    if coords.get("lng", 0) != 0:
        lng = coords["lng"]

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
            "1 Restaurant Project", "Command Center Access", "Site Strategist",
            "Ground Up Module", "Ops Launchpad", "Marketeer Agent", "Email Support"
        ]
    },
    "multi_unit": {
        "name": "Multi-Unit",
        "price": 18.00,
        "price_id": "price_1TEsogHAM0vSVVVHFPc8kY5T",
        "features": [
            "Unlimited Restaurant Projects", "All Single Unit Features", "Expansion Toolkit",
            "Lease Negotiation Module", "AI-Powered Analysis", "Priority Support", "Franchise Readiness Tools"
        ]
    }
}

class SubscriptionRequest(BaseModel):
    plan_id: str
    origin_url: str

@api_router.get("/subscriptions/plans")
async def get_subscription_plans():
    return {"plans": [{"id": pid, "name": p["name"], "price": p["price"], "features": p["features"]}
                      for pid, p in SUBSCRIPTION_PLANS.items()]}

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
        await db_insert("payment_transactions", {
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
            existing = await db_get("payment_transactions", {"session_id": session_id})
            if existing and existing.get("payment_status") != "paid":
                await db_update("users", {"user_id": user.user_id},
                    {"subscription_plan": existing.get("plan_id"), "subscription_status": "active"})
            await db_update("payment_transactions", {"session_id": session_id},
                {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()})
        return {"status": session.status, "payment_status": session.payment_status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/subscriptions/my-subscription")
async def get_my_subscription(user: User = Depends(get_current_user)):
    user_doc = await db_get("users", {"user_id": user.user_id})
    return {"plan": user_doc.get("subscription_plan"), "status": user_doc.get("subscription_status", "none")}

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
            await db_update("payment_transactions", {"session_id": sid},
                {"payment_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()})

    return {"received": True}

# ==================== DONATIONS ====================

class DonationRequest(BaseModel):
    amount: float
    donor_name: str = "Anonymous"
    message: str = ""
    origin_url: str

@api_router.post("/donations/checkout")
async def create_donation_checkout(data: DonationRequest):
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
            metadata={"donor_name": data.donor_name, "message": data.message, "amount": str(data.amount)},
        )
        await db_insert("donations", {
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
    stripe_api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_api_key:
        raise HTTPException(status_code=500, detail="Payment service not configured")

    stripe.api_key = stripe_api_key
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        if session.payment_status == "paid":
            await db_update("donations", {"session_id": session_id},
                {"status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()})
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

@app.on_event("startup")
async def startup():
    await init_db()
