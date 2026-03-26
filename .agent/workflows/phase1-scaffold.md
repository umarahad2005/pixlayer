---
description: Phase 1 — Project scaffold, design system, and core UI shell for PIXLAYER
---

# Phase 1 — Project Scaffold & Core UI Shell

// turbo-all

## Prerequisites
Read these skills before starting:
- `.agent/skills/frontend-react/SKILL.md`
- `.agent/skills/backend-express/SKILL.md`
- `.agent/skills/design-system/SKILL.md`
- `.agent/skills/canvas-rendering/SKILL.md`
- `.agent/skills/state-management/SKILL.md`

---

## Step 1.1: Initialize Vite React Frontend
```bash
cd d:\pixlayer && npx -y create-vite@latest client --template react
```
Install dependencies:
```bash
cd d:\pixlayer\client && npm install react-router-dom zustand lucide-react framer-motion
```

## Step 1.2: Install & Configure TailwindCSS
```bash
cd d:\pixlayer\client && npm install -D tailwindcss @tailwindcss/vite
```
- Update `vite.config.js` to add Tailwind plugin
- Create `src/styles/global.css` with `@import "tailwindcss"` and PIXLAYER CSS variables (see design-system skill)
- Import global.css in `main.jsx`

## Step 1.3: Initialize Express Backend
```bash
cd d:\pixlayer && mkdir server
```
```bash
cd d:\pixlayer\server && npm init -y
```
```bash
cd d:\pixlayer\server && npm install express mongoose dotenv cors jsonwebtoken bcryptjs multer express-rate-limit morgan helmet express-mongo-sanitize zod node-cron
```
- Add `"type": "module"` to `server/package.json`
- Add `"dev": "node --watch index.js"` script

## Step 1.4: Create Frontend Directory Structure
Create these directories under `client/src/`:
- `components/layout/` — TopBar, Sidebar
- `components/editor/` — CanvasEditor, LayerPanel, PropertiesPanel
- `components/export/` — ExportModal
- `components/ui/` — Button, Modal, Badge, Tooltip, Toast
- `pages/` — Landing, Dashboard, Editor, Auth
- `hooks/` — useCanvas, useLayers, useSegmentation
- `store/` — editorStore.js
- `lib/` — apiClient.js, helpers.js
- `styles/` — global.css

## Step 1.5: Create Backend Directory Structure
Create these directories under `server/`:
- `routes/` — auth.js, projects.js, segmentation.js, export.js, billing.js
- `models/` — User.js, Project.js
- `middleware/` — authMiddleware.js, rateLimiter.js, creditCheck.js
- `services/` — replicateService.js, storageService.js, lemonsqueezyService.js
- `utils/` — errors.js

## Step 1.6: Design System via Stitch MCP
Follow the `design-system` skill:
1. Create Stitch project: `mcp_StitchMCP_create_project({ title: "PIXLAYER" })`
2. Create design system with PIXLAYER tokens
3. Generate Landing page screen
4. Generate Editor page screen
5. Generate Dashboard page screen

## Step 1.7: Build React Components
Follow the `frontend-react` skill patterns:
1. Create `src/styles/global.css` with CSS vars and Tailwind imports
2. Build UI primitives: Button, Modal, Badge, Tooltip
3. Build layout: TopBar (logo, project name, tools, export btn)
4. Build editor: CanvasEditor (HTML5 Canvas + checkerboard from canvas-rendering skill)
5. Build LayerPanel (240px left) with placeholder layers: thumbnails, eye/lock icons, drag handles
6. Build PropertiesPanel (260px right) with metadata display
7. Build ExportModal shell with SVG/PSD/Figma tabs
8. Build Landing page with hero, CTA, features grid
9. Build Dashboard placeholder
10. Set up Zustand store (follow state-management skill)
11. Wire up React Router in App.jsx (follow frontend-react skill routing)

## Step 1.8: Build Backend Stubs
Follow the `backend-express` skill:
1. Create `server/index.js` with full Express setup
2. Create route stubs (return placeholder responses)
3. Create Mongoose models (User, Project)
4. Create auth middleware stub
5. Create rate limiter config
6. Add `/api/health` endpoint

## Step 1.9: Create .env Files
```bash
cp d:\pixlayer\.env.example d:\pixlayer\server\.env
```
Create `.env.example` with all vars (see infrastructure skill).

## Step 1.10: Verify Phase 1
Start both servers:
```bash
cd d:\pixlayer\client && npm run dev
```
```bash
cd d:\pixlayer\server && npm run dev
```

Use browser subagent to verify:
- Landing page renders with dark theme (#0D0D0F bg)
- Correct fonts: Syne headings, Inter body
- Editor 3-panel layout works
- Layer panel shows 3 placeholder layers
- Canvas shows checkerboard
- Export modal opens with tabs
- TopBar displays correctly
