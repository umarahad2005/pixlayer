---
description: Phase 6 — Performance optimization, UI polish, and production readiness
---

# Phase 6 — Performance, Polish & Production

// turbo-all

## Prerequisites
Read these skills:
- `.agent/skills/performance/SKILL.md`
- `.agent/skills/infrastructure/SKILL.md`
- `.agent/skills/security/SKILL.md`
- `.agent/skills/debug/SKILL.md`
- `.agent/skills/testing-qa/SKILL.md`

---

## Step 6.1: Performance Optimizations
Frontend (see performance skill):
- React.lazy + Suspense for Editor page
- Virtual scrolling in LayerPanel (react-window, if > 20 layers)
- Debounce SAM 2 mask decode (150ms)
- Compress layer imageData via Web Worker
- LRU cache (3 items) for SAM 2 embeddings

Backend:
- node-cache for Replicate API responses (1h TTL)
- compression middleware (gzip)
- Mongoose maxPoolSize: 10
- morgan logging (dev: verbose, prod: minimal)

## Step 6.2: UI Polish
- Right-click context menu on canvas: "Segment Here", "Exclude Point", "Reset Points"
- Keyboard shortcuts: S=Segment, V=Move, E=Export, Ctrl+Z=Undo, Delete=Remove layer
- Drag-and-drop layer reordering (@dnd-kit/core)
- Zoom to fit button + scroll-to-zoom (10%–400%)
- Onboarding tooltips (first-time, store `px_onboarded` in localStorage)
- Layer slide-in animation (framer-motion)

Install:
```bash
cd d:\pixlayer\client && npm install @dnd-kit/core @dnd-kit/sortable react-window
```

## Step 6.3: Environment & Config
Create `.env.example` with all vars (see infrastructure skill).
Ensure no secrets in client code — prefix with `VITE_` for Vite.

## Step 6.4: Docker & Deployment
Build files (see infrastructure skill):
- `client/Dockerfile` — multi-stage (build → nginx)
- `server/Dockerfile` — Node.js production
- `docker-compose.yml` — client + server + mongo
- `client/nginx.conf` — SPA routing, API proxy, WASM caching
- Health endpoint: `/api/health`

## Step 6.5: Security Hardening
Follow security skill:
- helmet.js with CSP (allow WASM, fonts, Cloudinary)
- express-mongo-sanitize
- Zod validation on all routes
- CORS production whitelist
- Filename sanitization
- HTTPS redirect in nginx

## Step 6.6: Error Monitoring
Follow debug skill:
- Sentry client + server integration
- EditorErrorBoundary component
- Unhandled rejection handler
- `/api/admin/stats` route (admin-only)

## Step 6.7: Final Verification
Follow testing-qa skill:
- Lighthouse score > 85 on Landing
- Editor loads < 3s
- Keyboard shortcuts work
- Drag-and-drop reorder works
- Docker compose full stack runs
- `/api/health` returns 200
- Sentry captures test errors
- All .env variables documented
