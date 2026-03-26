---
name: Testing & QA
description: Component testing, API validation, Canvas rendering checks, export format validation, and browser testing for PIXLAYER
---

# Testing & QA

## Browser-Based Verification (Primary Method)
PIXLAYER uses the `browser_subagent` tool for visual and functional verification.

### Landing Page Verification
```
Task: Navigate to http://localhost:5173. Verify:
1. Dark theme (#0D0D0F background) is applied
2. Hero text "From flat AI output to layered design file. Instantly." is visible
3. "Start for Free" CTA button exists with indigo (#6C63FF) color
4. Fonts: Syne for heading, Inter for body text
5. No console errors
Return: Screenshot + pass/fail for each check.
```

### Editor Layout Verification
```
Task: Navigate to http://localhost:5173/editor. Verify:
1. Three-panel layout: left LayerPanel (≈240px), center Canvas, right Properties (≈260px)
2. TopBar shows PIXLAYER logo, project name, tools, export button
3. Canvas shows checkerboard transparency pattern
4. Layer panel shows placeholder layers with eye/lock icons
5. Export button opens modal with SVG/PSD/Figma tabs
Return: Screenshot + pass/fail for each check.
```

### Image Upload Verification
```
Task: Navigate to http://localhost:5173/editor. Verify:
1. Canvas area shows drag-and-drop upload zone when no image loaded
2. Drop zone accepts PNG/JPEG/WEBP files
3. After upload, image renders on canvas
4. Properties panel shows image metadata (filename, dimensions, size)
Return: Screenshot + pass/fail.
```

## API Endpoint Testing

### Auth Endpoints
| Endpoint | Method | Body | Expected |
|----------|--------|------|----------|
| `/api/auth/register` | POST | `{ email, password, name }` | 201 + JWT |
| `/api/auth/register` | POST | duplicate email | 409 error |
| `/api/auth/login` | POST | valid creds | 200 + JWT |
| `/api/auth/login` | POST | wrong password | 401 error |
| `/api/auth/me` | GET | Bearer token | 200 + user |
| `/api/auth/me` | GET | no token | 401 error |

### Project Endpoints
| Endpoint | Method | Auth | Expected |
|----------|--------|------|----------|
| `/api/projects` | GET | yes | 200 + projects array |
| `/api/projects` | POST | yes | 201 + new project |
| `/api/projects/:id` | PATCH | yes | 200 + updated |
| `/api/projects/:id` | DELETE | yes | 204 |
| `/api/health` | GET | no | 200 + status ok |

### AI Endpoints (require credits)
| Endpoint | Method | Auth | Credits | Expected |
|----------|--------|------|---------|----------|
| `/api/segment/text` | POST | yes | ≥1 | 200 + masks |
| `/api/segment/text` | POST | yes | 0 | 403 + upgrade |
| `/api/inpaint/fast` | POST | yes | ≥1 | 200 + image URL |
| `/api/inpaint/prompt` | POST | yes | ≥1 | 200 + image URL |

## Export Format Validation

### SVG Validation
```
1. Download exported SVG
2. Open in browser — should render correctly
3. Check for <g id="layer-X"> groups (one per layer)
4. Verify viewBox matches original image dimensions
5. Open in Inkscape/Figma — layers should be separate
```

### PSD Validation
```
1. Export PSD file
2. Open in Photoshop (or Photopea.com for free testing)
3. Verify layer count matches
4. Verify layer names are correct
5. Verify layer positions are correct (not all at 0,0)
6. Verify transparency is preserved
```

### Figma JSON Validation
```
1. Download JSON file
2. Verify JSON schema: version, pixlayer_export, canvas, nodes[]
3. Each node has: id, type, name, x, y, width, height, imageData
4. Install Figma plugin, import JSON
5. Verify layers appear at correct positions in Figma
```

## Component Testing Checklist
For each React component, verify:
- [ ] Renders without errors
- [ ] Correct dark theme colors applied
- [ ] Hover/focus states work (150ms transitions)
- [ ] Click handlers fire correctly
- [ ] Responsive at different viewport sizes
- [ ] Keyboard accessible (tab navigation, Enter/Space activation)
- [ ] No memory leaks (check for missing useEffect cleanup)

## End-to-End User Flow Test
```
1. Land on / → click "Start for Free"
2. Register with email/password
3. Redirected to /dashboard
4. Click "New Project"
5. Upload an image
6. Use Segment tool (click on image)
7. Confirm segment (layer added)
8. Export as SVG
9. Export as PSD
10. Check credits decreased by operations used
```

## Performance Testing
```bash
# Lighthouse CLI
npx lighthouse http://localhost:5173 --output=json --only-categories=performance

# Target: > 85 for landing page
```
