---
description: Phase 5 — Authentication, user dashboard, and Lemon Squeezy billing
---

# Phase 5 — Auth, Dashboard & Billing

// turbo-all

## Prerequisites
Read these skills:
- `.agent/skills/auth-billing/SKILL.md`
- `.agent/skills/security/SKILL.md`
- `.agent/skills/backend-express/SKILL.md`
- `.agent/skills/frontend-react/SKILL.md`

---

## Step 5.1: Auth API Routes
Location: `server/routes/auth.js`

Follow auth-billing + security skills:
- `POST /api/auth/register` → Zod validate → bcrypt hash (12 rounds) → create User → JWT (7d expiry)
- `POST /api/auth/login` → verify password → JWT
- `GET /api/auth/me` → authMiddleware → return user
- Rate limit: 10 attempts per 15 min

## Step 5.2: Auth UI
Build `client/src/pages/Auth.jsx`:
- Toggle between Login / Register forms
- Dark themed, centered card layout
- On success: store JWT as `px_token` in localStorage
- Redirect to `/dashboard`

## Step 5.3: User Dashboard
Build `client/src/pages/Dashboard.jsx`:
- User greeting + plan badge (FREE/PREMIUM with indigo glow)
- Credits circular progress indicator
- Recent projects grid (thumbnails + metadata)
- "New Project" button → `/editor`
- Upgrade CTA card (free users only)

## Step 5.4: Projects API
Location: `server/routes/projects.js`

- `GET /api/projects` → user's projects
- `POST /api/projects` → create new
- `PATCH /api/projects/:id` → update (auto-save)
- `DELETE /api/projects/:id` → delete

## Step 5.5: Lemon Squeezy Integration
Install:
```bash
cd d:\pixlayer\server && npm install @lemonsqueezy/lemonsqueezy.js
```

Build `server/services/lemonsqueezyService.js` (see auth-billing skill):
- `createCheckoutUrl(userId, email)` → Lemon Squeezy checkout URL
- Webhook handler with signature verification

Build `server/routes/billing.js`:
- `POST /api/billing/checkout` → (protected) create checkout URL
- `POST /api/billing/webhook` → (public, raw body) handle events

CRITICAL: Register `express.raw()` for webhook route BEFORE `express.json()`.

## Step 5.6: Credit System
Build `server/middleware/creditCheck.js` (see auth-billing skill):
- Premium users: pass through
- Free users: check credits ≥ 1, decrement, or 403

Monthly reset via node-cron:
- 1st of each month: reset free users to 10 credits

## Step 5.7: Auto-Save
In Editor, every 30 seconds:
- Serialize layers (upload heavy data to Cloudinary, save URLs)
- PATCH `/api/projects/:id`
- Show "Saved" indicator in TopBar (fade out after 2s)

## Step 5.8: Verify Phase 5
- Register/Login works, JWT persists on refresh
- Dashboard shows plan badge + credits
- Projects grid shows saved projects
- Lemon Squeezy checkout opens
- Webhook upgrades plan
- Free users blocked at 0 credits
- Auto-save triggers with indicator
