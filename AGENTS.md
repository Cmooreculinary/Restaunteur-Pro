# Agent Roadmap

Priority tiers: **Core** (restaurant-specific, high ROI) → **Platform** (cross-app, sellable) → **Market** (standalone SaaS product)

---

## Core — Restaunteur-Pro

| Agent | What it does | Data needed |
|---|---|---|
| **Marketeer** ✅ | Campaigns, content, promotions, analytics, audience | Menu, customer list, POS events |
| **ReservationBot** | Handles bookings via SMS/web chat, confirms & reminds | Reservation system, Twilio |
| **MenuEngineer** | Analyzes sales data, surfaces high-margin winners, flags dead items | POS sales history |
| **ReviewResponder** | Monitors Google/Yelp, drafts on-brand replies, flags negatives | Google Business API, Yelp API |
| **ShiftScheduler** | Drafts weekly schedules from availability + forecasted covers | Staff DB, historical cover data |
| **InventoryAlert** | Predicts stock-outs, auto-drafts purchase orders | Inventory DB, supplier list |
| **LoyaltyCoach** | Segments guests by RFM, triggers personalized offers | Customer DB, order history |
| **HealthInspector** | Checklist bot — staff logs compliance items daily, flags issues | Custom checklist config |

---

## Platform — Sellable Across Apps

| Agent | What it does | Target buyers |
|---|---|---|
| **ContentAgent** | Social + email + SMS copy from a brand brief — any industry | Any SMB |
| **AnalyticsNarrator** | Turns raw metrics into a weekly plain-English summary email | Any SaaS dashboard |
| **OnboardingGuide** | Interactive in-app assistant that walks new users through setup | Any SaaS product |
| **SupportDeflector** | Answers common support questions from your own docs/FAQs | Any product with a help center |
| **BillingAdvisor** | Alerts on unusual spend, explains invoices, suggests plan changes | Any Stripe-billed SaaS |
| **CompetitorWatcher** | Weekly brief: pricing/feature changes from competitor sites | Any SaaS |

---

## Market — Standalone SaaS Products

| Product | Core agent | Monetisation |
|---|---|---|
| **Marketeer Pro** | ContentAgent + SchedulePublisher | $49/mo per location |
| **ReviewHQ** | ReviewResponder + SentimentTracker | $29/mo per location |
| **ShiftAI** | ShiftScheduler + SwapNegotiator | $39/mo per location |
| **MenuLab** | MenuEngineer + PricingOptimiser | $59/mo per location |
| **GuestIQ** | LoyaltyCoach + ChurnPredictor | $79/mo per location |

---

## Build Order

1. **ReservationBot** — highest customer-visible impact, Twilio already in deps
2. **ReviewResponder** — Google Business API straightforward, high perceived value
3. **MenuEngineer** — needs POS integration (Square / Toast webhook)
4. **ContentAgent** — extract from Marketeer, make it industry-agnostic
5. **LoyaltyCoach** — requires customer DB to be populated first
