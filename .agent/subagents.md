# PIXLAYER Subagent Architecture

## Overview
PIXLAYER uses browser subagents for visual verification, API testing, and export validation. Each subagent is a focused task executed via the `browser_subagent` tool.

---

## Design Review Agent

### Purpose
Verify UI rendering, dark theme compliance, layout correctness, and visual polish.

### Tasks

#### Landing Page Review
```
TaskName: "Landing Page Design Review"
Task: Navigate to http://localhost:5173. Verify:
1. Background color is #0D0D0F (dark obsidian)
2. Hero heading uses Syne font: "From flat AI output to layered design file. Instantly."
3. CTA "Start for Free" button has #6C63FF background
4. Body text uses Inter font
5. No horizontal scrollbar
6. Smooth hover transitions on buttons (150ms)
7. No console errors
Return: Pass/fail for each check with screenshot.
```

#### Editor Layout Review
```
TaskName: "Editor Layout Review"
Task: Navigate to http://localhost:5173/editor. Verify:
1. Three-panel layout: left (≈240px), center (flex), right (≈260px)
2. Left panel: Layer list with thumbnails, eye icons, lock icons
3. Center: Canvas with checkerboard pattern
4. Right panel: Properties/metadata display
5. TopBar: Logo, project name, tool toggles, export button
6. All panels use #141416 background with #1E1E22 borders
7. Export button opens modal with 3 tabs
Return: Pass/fail with screenshot.
```

#### Dashboard Review
```
TaskName: "Dashboard Design Review"
Task: Navigate to http://localhost:5173/dashboard (must be logged in). Verify:
1. User greeting shown
2. Plan badge (FREE or PREMIUM)
3. Credits indicator (circular progress)
4. Project grid with thumbnails
5. "New Project" button visible
6. Dark theme consistent
Return: Pass/fail with screenshot.
```

---

## API Testing Agent

### Purpose
Validate all backend API endpoints for correctness, auth enforcement, and error handling.

### Tasks

#### Auth Flow Test
```
TaskName: "Auth API Testing"
Task: Test the following endpoints:
1. POST http://localhost:5000/api/auth/register with { email: "test@test.com", password: "TestPass123!", name: "Test User" }
   Expect: 201 with token
2. POST http://localhost:5000/api/auth/login with { email: "test@test.com", password: "TestPass123!" }
   Expect: 200 with token
3. GET http://localhost:5000/api/auth/me with Authorization header
   Expect: 200 with user object
4. GET http://localhost:5000/api/auth/me without token
   Expect: 401
Return: Status code + response body for each.
```

#### Health Check Test
```
TaskName: "Health Check Test"
Task: GET http://localhost:5000/api/health
Expect: 200 with { status: "ok", timestamp, version }
Return: Response body.
```

---

## Export Validation Agent

### Purpose
Verify exported files are valid and renderable.

### Tasks

#### SVG Validation
```
TaskName: "SVG Export Validation"
Task: After exporting SVG from the editor:
1. Open the downloaded SVG file in the browser
2. Verify it renders without errors
3. Inspect SVG source for <g> groups per layer
4. Check viewBox matches original dimensions
Return: Render result + SVG structure analysis.
```

#### PSD Structure Check
```
TaskName: "PSD Export Check"
Task: Navigate to https://www.photopea.com and:
1. Open the exported PSD file
2. Verify layer count matches expected
3. Verify layer names are correct
4. Verify layer positions are correct (not all at 0,0)
5. Check transparency is preserved
Return: Screenshot of Photopea layers panel + pass/fail.
```

---

## Performance Testing Agent

### Purpose
Run Lighthouse and verify load times.

### Tasks

#### Landing Page Performance
```
TaskName: "Landing Performance Test"
Task: Navigate to http://localhost:5173. Run Lighthouse performance audit.
Target: Score > 85
Check: First Contentful Paint < 2s, Largest Contentful Paint < 3s
Return: Lighthouse scores.
```

#### Editor Load Time
```
TaskName: "Editor Load Time Test"
Task: Navigate to http://localhost:5173/editor.
Measure time from navigation start to canvas rendering.
Target: < 3 seconds on standard connection.
Return: Load time measurement.
```
