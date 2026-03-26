---
description: Phase 2 — Image upload, Canvas rendering, and SAM 2 client-side segmentation
---

# Phase 2 — Image Upload & SAM 2 Segmentation

// turbo-all

## Prerequisites
Read these skills:
- `.agent/skills/ai-ml-integration/SKILL.md`
- `.agent/skills/canvas-rendering/SKILL.md`
- `.agent/skills/state-management/SKILL.md`
- `.agent/skills/performance/SKILL.md`

---

## Step 2.1: Drag-and-Drop Upload Zone
- Show upload zone in canvas area when no image loaded
- Accept: PNG, JPEG, WEBP (max 20MB)
- On upload: store in Zustand (`setImage`), render on canvas via `drawImage()`
- Show metadata in Properties Panel: filename, dimensions, file size

## Step 2.2: Download SAM 2 ONNX Models
```bash
mkdir d:\pixlayer\client\public\models
```
Download from HuggingFace:
- `sam2_hiera_tiny_encoder.onnx` → `client/public/models/`
- `sam2_hiera_tiny_decoder.onnx` → `client/public/models/`

Install ONNX Runtime (exact version):
```bash
cd d:\pixlayer\client && npm install onnxruntime-web@1.19.0
```

## Step 2.3: Build useSegmentation Hook
Location: `client/src/hooks/useSegmentation.js`

Follow ai-ml-integration skill patterns:
1. `loadModel()` — load encoder + decoder ONNX sessions (WebGPU → WASM fallback)
2. `encodeImage(imageData)` — prepare Float32 tensor [1,3,1024,1024], run encoder
3. `decodeMask(points, embedding)` — normalize coords, run decoder
4. Return: `{ isModelLoaded, isEncoding, isMasking, currentMask, loadModel, encodeImage, decodeMask }`

## Step 2.4: Interactive Point Prompting
When "Segment" tool is active:
- Left-click → positive point (green marker, label=1)
- Right-click → negative point (red marker, label=0)
- After each click → debounce 150ms → call `decodeMask()`
- Render mask as semi-transparent indigo overlay (#6C63FF at 40%)
- Follow canvas-rendering skill for marker and overlay rendering

## Step 2.5: Confirm Segment Flow
"Confirm Segment" button:
1. Extract masked pixels from canvas → new ImageData
2. Calculate bounding box
3. Create layer: `{ name: "Layer N", imageData, bounds: {x,y,w,h} }`
4. `addLayer()` to Zustand
5. Clear points and mask

## Step 2.6: High-Resolution Tiling
If image > 1024×1024:
1. Tile into 1024×1024 patches with 64px overlap (see ai-ml-integration skill)
2. Encode each patch separately
3. Show progress bar: "Processing large image... (patch X/Y)"
4. Stitch masks with weighted blending at seams

## Step 2.7: Embedding Cache
- Cache embeddings in Zustand via `setImageEmbedding()`
- Only call `encodeImage()` once per image load
- Use LRU cache (max 3) for switching between recent images

## Step 2.8: Verify Phase 2
Use browser subagent:
- Drag-drop image → renders on canvas
- SAM 2 model loads (loading indicator in TopBar)
- Click on image → green dot + mask overlay appears
- Right-click → red dot + refined mask
- "Confirm Segment" → layer added to panel
- High-res image → tiled without crash
