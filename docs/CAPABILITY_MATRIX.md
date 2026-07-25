# Restaunteur Pro — Capability Matrix

Legend:

- **Connected** — frontend calls a matching backend endpoint.
- **API only** — backend capability exists without a verified production screen.
- **Foundation** — infrastructure behavior rather than a user module.
- **Review** — behavior exists but requires product or security confirmation.

| Capability | Frontend | Backend | Data | Current status | Modernization gate |
|---|---|---|---|---|---|
| Email registration/login | `Landing.jsx` | `/api/auth/register`, `/api/auth/login` | `users`, `user_sessions` | Connected | Cookie-only auth contract tests |
| Google OAuth | `Landing.jsx`, `App.js` | `/api/auth/google/*` | `users`, `oauth_states`, `user_sessions` | Connected | Remove URL/session-storage bearer token |
| Admin access code | `Landing.jsx` | `/api/auth/secret` | `users`, `user_sessions` | Review | Approve, restrict, or remove |
| Onboarding/profile | `Onboarding.jsx` | `/api/profile*` | `business_profiles` | Connected | Schema and step-resume tests |
| Projects | `Dashboard.jsx`, `ProjectWizard.jsx` | `/api/projects*` | `projects` | Connected | CRUD and ownership tests |
| Tasks/opening command | `CommandCenter.jsx` | `/api/tasks*` | `tasks` | Connected | Status-transition contract |
| Team | `CommandCenter.jsx` | `/api/team*` | `team_members` | Connected | Validation and permission contract |
| Budget | `CommandCenter.jsx` | `/api/budget*` | `budget_items` | Connected | Money precision and totals |
| Equipment | `GroundUp.jsx` | `/api/equipment*` | `equipment` | Connected | Lifecycle/status contract |
| Permits | `GroundUp.jsx` | `/api/permits*` | `permits` | Connected | Expiry and evidence handling |
| Hiring | `OpsLaunchpad.jsx` | `/api/candidates*` | `candidates` | Connected | Candidate-stage transition tests |
| Vendors | `OpsLaunchpad.jsx` | `/api/vendors*` | `vendors` | Connected | Deduplication and ownership |
| Menu/costing | `OpsLaunchpad.jsx` | `/api/menu-items*`, `/api/ai/cost-calculator` | `menu_items` | Connected | Decimal math and AI fallback |
| Lease review | `LeaseNegotiation.jsx` | `/api/lease-clauses*`, `/api/ai/analyze` | `lease_clauses` | Connected | Liability language and AI provenance |
| Site strategy | `SiteStrategist.jsx` | `/api/site/demographics`, `/api/ai/analyze` | External/derived | Connected | Source, freshness, and failure states |
| Multi-unit expansion | `ExpansionToolkit.jsx` | `/api/units*` | `units` | Connected | Unit access boundaries |
| Marketing | `MarketeerAgent.jsx` | `/api/marketeer/*` | `marketing_campaigns` | Connected | Draft provenance and deletion tests |
| Notifications | `Dashboard.jsx` | `/api/notifications*` | `notifications` | Connected | Read-state and pagination |
| AP intelligence | `APIntelligence.jsx` | `/api/ap/*` | `ap_invoices`, `ap_vendors`, `ap_alerts` | Connected | Approval, money, and audit trail |
| Subscriptions | `Pricing.jsx`, `SubscriptionSuccess.jsx` | `/api/subscriptions/*`, Stripe webhook | `payment_transactions`, `users` | Connected | Webhook idempotency and reconciliation |
| Donations | `Donations.jsx`, `DonationSuccess.jsx` | `/api/donations/*`, Stripe webhook | `donations` | Connected | Webhook idempotency and receipts |
| Health/readiness | None | `/api/health` | Process/database | Foundation | Separate live and ready checks |

## Required acceptance-test order

1. Authentication and session lifecycle.
2. Onboarding resume and completion.
3. Project creation and ownership isolation.
4. Dashboard reads for tasks, team, and budget.
5. Stripe checkout/webhook reconciliation.
6. AP approval and cash-flow calculations.
7. AI integration failure and timeout behavior.
8. Remaining CRUD modules.
