---
description: Phase 3 — Text-prompted segmentation (Grounded-SAM) and background inpainting
---

# Phase 3 — Text Segmentation & Inpainting

// turbo-all

## Prerequisites
Read these skills:
- `.agent/skills/ai-ml-integration/SKILL.md`
- `.agent/skills/backend-express/SKILL.md`
- `.agent/skills/security/SKILL.md`
- `.agent/skills/auth-billing/SKILL.md`

---

## Step 3.1: Replicate API Service
Location: `server/services/replicateService.js`

Install:
```bash
cd d:\pixlayer\server && npm install replicate
```

Build three functions (see ai-ml-integration skill):
- `groundedSam(imageUrl, textPrompt)` → Replicate `idea-research/grounded-sam-2`
- `lamaInpaint(imageUrl, maskUrl)` → Replicate LaMa model
- `sdInpaint(imageUrl, maskUrl, prompt)` → Replicate SD 3.5 inpainting

## Step 3.2: Segmentation API Routes
Location: `server/routes/segmentation.js`

```
POST /api/segment/text   → { imageUrl, prompt } → groundedSam → masks
POST /api/inpaint/fast   → { imageUrl, maskUrl } → lamaInpaint → image
POST /api/inpaint/prompt → { imageUrl, maskUrl, prompt } → sdInpaint → image
```

All routes: `authMiddleware` → `rateLimiter` → `creditCheck` → handler
Validate with Zod schemas (see security skill).

## Step 3.3: Text Prompt UI
In TopBar, when "AI Select" mode active:
- Show text input: "Type what to isolate... e.g. 'the main character'"
- On submit:
  1. Upload current canvas to Cloudinary/S3
  2. POST `/api/segment/text`
  3. Render returned masks as colored overlays with label badges
  4. Click mask → "Add as Layer" button
  5. Confirm → extract + add to Zustand

## Step 3.4: Inpainting Panel
In Properties Panel, after layer extraction:

**Quick Heal (LaMa):**
- Button: "Auto-Heal Background"
- POST `/api/inpaint/fast`
- Replace background layer imageData
- Target: < 3 seconds

**AI Fill (SD):**
- Text input: "Describe what should fill this area..."
- Button: "Generate Fill"
- POST `/api/inpaint/prompt`
- Show spinner: "Generating fill..." (5-15s)
- Costs 1 credit

## Step 3.5: Storage Service
Location: `server/services/storageService.js`
- `uploadImage(buffer, filename)` → upload to Cloudinary, return URL
- `deleteImage(publicId)` → cleanup

Install:
```bash
cd d:\pixlayer\server && npm install cloudinary
```

## Step 3.6: Toast Notification System
Build lightweight toast in `client/src/components/ui/Toast.jsx`:
- Show on API errors, successes
- Auto-dismiss after 5s
- Dark themed, bottom-right positioned

## Step 3.7: Verify Phase 3
- Type "isolate the person" → masks appear
- Click mask → add as layer
- "Auto-Heal Background" fills convincingly
- "AI Fill" generates contextual background
- Rate limiting: free users hit limit → upgrade prompt
- Error toasts appear on API failures
