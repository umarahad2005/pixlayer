---
description: Phase 4 — Multi-format export engine (SVG, PSD, Figma JSON)
---

# Phase 4 — Multi-Format Export Engine

// turbo-all

## Prerequisites
Read these skills:
- `.agent/skills/export-engine/SKILL.md`
- `.agent/skills/canvas-rendering/SKILL.md`
- `.agent/skills/performance/SKILL.md`

---

## Step 4.1: SVG Export via VTracer WASM
Install:
```bash
cd d:\pixlayer\client && npm install vtracer
```

Build Web Worker: `client/src/lib/vtracerWorker.js`
- Load vtracer WASM
- Run `trace()` on layer imageData
- Return SVG string

Build SVG composer (see export-engine skill):
- Run VTracer per layer → combine into `<g>` groups
- Set viewBox to match original dimensions

Export Modal SVG tab options:
- Color Mode: Color | Grayscale | Binary
- Path Precision: Draft | Balanced | High
- Curve Fitting: Pixel | Spline | None

## Step 4.2: PSD Export via ag-psd
Install:
```bash
cd d:\pixlayer\client && npm install ag-psd
```

Build `client/src/lib/psdExporter.js` (see export-engine skill):
- CRITICAL: Each layer canvas must be full image dimensions
- Position content at correct x/y offset on transparent canvas
- Set layer names, visibility
- `writePsd()` → ArrayBuffer → download

## Step 4.3: Figma JSON Export
Build `client/src/lib/figmaExporter.js`:
- Generate schema per export-engine skill
- Convert each layer to base64 PNG
- Download as `pixlayer-export.json`

## Step 4.4: Figma Plugin
Create `figma-plugin/` directory:
- `manifest.json` — plugin metadata
- `ui.html` — dark themed file upload UI
- `code.js` — parse JSON, create Figma rectangles with image fills

## Step 4.5: Export Modal UI
Build `client/src/components/export/ExportModal.jsx`:
- 3 tabs: SVG | PSD | Figma
- Layer count badge
- Format-specific options per tab
- Estimated file size indicator
- Primary export button
- Figma tab: download JSON + plugin instructions

## Step 4.6: Verify Phase 4
- SVG downloads, opens in browser correctly
- SVG has `<g>` groups per layer
- PSD opens in Photoshop with named layers at correct positions
- Figma JSON schema is valid
- Figma plugin imports layers correctly
- VTracer runs in Web Worker (UI not blocked)
