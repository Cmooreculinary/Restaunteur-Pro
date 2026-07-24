# Restaurateur Pro - Product Requirements Document

## Original Problem Statement
Build a full-stack, live Restaurateur Pro restaurant management platform.

## User Choices
- All live features (real-time data, live map, real-time notifications)
- AI-powered features using GPT-5.2
- Google social login
- Match exact dark theme from uploaded HTML design

## User Personas
1. **Restaurant Entrepreneurs** - Building their first restaurant
2. **Multi-Unit Operators** - Managing multiple locations
3. **Franchise Developers** - Scaling restaurant concepts

## Core Requirements (Static)
- 6 Dashboard Modules: Command Center, Site Strategist, Ground Up, Ops Launchpad, Expansion Toolkit, Lease Negotiation
- Google OAuth authentication
- GPT-5.2 AI Integration (lease analysis, cost calculator)
- Live demographics data
- Interactive OpenStreetMap integration
- Dark sophisticated UI theme

## What's Been Implemented (Jan 2026)

### Backend (FastAPI + MongoDB)
- ✅ Complete auth system with Google OAuth
- ✅ Projects CRUD with user association
- ✅ Tasks management with status tracking
- ✅ Team members management
- ✅ Budget items tracking
- ✅ Equipment tracking with status
- ✅ Permits compliance tracking
- ✅ Hiring candidates pipeline
- ✅ Vendors/supply chain management
- ✅ Menu items management
- ✅ Lease clauses management
- ✅ Multi-unit management
- ✅ Notifications system
- ✅ AI analysis endpoints (GPT-5.2)
- ✅ Live demographics API

### Frontend (React + Tailwind)
- ✅ Landing page with Google Sign In
- ✅ Dashboard with 6 tabbed modules
- ✅ Command Center with phase stepper, tasks, budget, team
- ✅ Site Strategist with Leaflet map and demographics
- ✅ Ground Up with floor plan, permits, equipment
- ✅ Ops Launchpad with hiring pipeline, AI cost calculator
- ✅ Expansion Toolkit with unit performance, franchise readiness
- ✅ Lease Negotiation with clause checklist, AI analyzer
- ✅ Dark sophisticated theme matching design reference
- ✅ Responsive design with mobile support

## Prioritized Backlog

### P0 (Critical)
- All implemented ✅

### P1 (High Priority)
- Real-time WebSocket notifications
- Document upload for lease analysis (PDF processing)
- Project creation modal/wizard
- Actual Google Maps integration (requires API key)

### P2 (Medium Priority)
- Dashboard overview with analytics charts
- Export reports to PDF
- Team member invitations via email
- Calendar integration for task due dates
- Mobile app (React Native)

## Next Action Items
1. Add project creation wizard with step-by-step flow
2. Implement real-time notifications with WebSocket
3. Add PDF upload for lease document analysis
4. Integrate calendar component for task scheduling
5. Add dashboard analytics with Recharts
