---
name: AI/ML Integration
description: SAM 2 ONNX model loading, onnxruntime-web WebGPU, Replicate API service, image tiling, and embedding caching for PIXLAYER
---

# AI/ML Integration

## SAM 2 ONNX Client-Side Setup

### Model Files
Store in `client/public/models/`:
- `sam2_hiera_tiny_encoder.onnx` — Image encoder (~30MB)
- `sam2_hiera_tiny_decoder.onnx` — Mask decoder (~4MB)
Source: `https://huggingface.co/sam2-hf/sam2-hiera-tiny-onnx`

### ONNX Runtime Configuration
```js
import * as ort from 'onnxruntime-web';
// CRITICAL: Use exactly version 1.19.0 — newer versions have WebGPU issues
// npm install onnxruntime-web@1.19.0

// WebGPU with WASM fallback
const sessionOptions = {
  executionProviders: ['webgpu', 'wasm'],
  graphOptimizationLevel: 'all',
};

const encoderSession = await ort.InferenceSession.create(
  '/models/sam2_hiera_tiny_encoder.onnx',
  sessionOptions
);
```

### Image Preprocessing for Encoder
```js
/**
 * Prepare image tensor for SAM 2 encoder.
 * Input: 1024x1024 Float32 RGB normalized to [0,1]
 */
function prepareImageTensor(imageData, targetSize = 1024) {
  const { width, height, data } = imageData;

  // Resize to target using OffscreenCanvas
  const canvas = new OffscreenCanvas(targetSize, targetSize);
  const ctx = canvas.getContext('2d');
  ctx.putImageData(imageData, 0, 0);

  const resized = ctx.getImageData(0, 0, targetSize, targetSize);
  const pixels = resized.data;

  // Convert RGBA → RGB Float32 normalized [0,1]
  // Channel order: [1, 3, H, W] (batch, channels, height, width)
  const float32 = new Float32Array(3 * targetSize * targetSize);
  for (let i = 0; i < targetSize * targetSize; i++) {
    float32[i]                              = pixels[i * 4]     / 255.0; // R
    float32[i + targetSize * targetSize]     = pixels[i * 4 + 1] / 255.0; // G
    float32[i + 2 * targetSize * targetSize] = pixels[i * 4 + 2] / 255.0; // B
  }

  return new ort.Tensor('float32', float32, [1, 3, targetSize, targetSize]);
}
```

### Point Prompting Decoder
```js
/**
 * Decode mask from points using SAM 2 decoder.
 * @param {ort.Tensor} embedding - Cached image embedding
 * @param {Array<{x: number, y: number, label: number}>} points
 *   label: 1 = positive (include), 0 = negative (exclude)
 */
async function decodeMask(decoderSession, embedding, points, imageSize) {
  // Normalize point coordinates to [0, 1]
  const coords = new Float32Array(points.length * 2);
  const labels = new Int32Array(points.length);

  points.forEach((pt, i) => {
    coords[i * 2]     = pt.x / imageSize.width;
    coords[i * 2 + 1] = pt.y / imageSize.height;
    labels[i] = pt.label;
  });

  const feeds = {
    image_embeddings: embedding,
    point_coords: new ort.Tensor('float32', coords, [1, points.length, 2]),
    point_labels: new ort.Tensor('int32', labels, [1, points.length]),
    mask_input: new ort.Tensor('float32', new Float32Array(256 * 256), [1, 1, 256, 256]),
    has_mask_input: new ort.Tensor('float32', [0], [1]),
  };

  const results = await decoderSession.run(feeds);
  return results.masks; // Binary mask tensor
}
```

## Image Tiling (High-Resolution)
```js
/**
 * Tile images > 1024px into overlapping patches.
 * @param {ImageData} imageData
 * @param {number} patchSize - 1024
 * @param {number} overlap - 64
 * @returns {Array<{ patch: ImageData, x: number, y: number }>}
 */
function tileImage(imageData, patchSize = 1024, overlap = 64) {
  const { width, height } = imageData;
  const tiles = [];
  const step = patchSize - overlap;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const w = Math.min(patchSize, width - x);
      const h = Math.min(patchSize, height - y);
      // Extract patch using OffscreenCanvas
      const canvas = new OffscreenCanvas(patchSize, patchSize);
      const ctx = canvas.getContext('2d');
      // Draw the patch region (pad with zeros if at edge)
      const srcCanvas = new OffscreenCanvas(width, height);
      srcCanvas.getContext('2d').putImageData(imageData, 0, 0);
      ctx.drawImage(srcCanvas, x, y, w, h, 0, 0, w, h);
      tiles.push({ patch: ctx.getImageData(0, 0, patchSize, patchSize), x, y });
    }
  }
  return tiles;
}
```

## Replicate API Service (Backend)
```js
// server/services/replicateService.js
import Replicate from 'replicate';

const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

export async function groundedSam(imageUrl, textPrompt) {
  const output = await replicate.run(
    'idea-research/grounded-sam-2',
    { input: { image: imageUrl, text_prompt: textPrompt } }
  );
  return output; // [{ label, mask_base64, bbox }]
}

export async function lamaInpaint(imageUrl, maskUrl) {
  const output = await replicate.run(
    'zylim0702/remove-object',
    { input: { image_url: imageUrl, mask_url: maskUrl } }
  );
  return output; // Inpainted image URL
}

export async function sdInpaint(imageUrl, maskUrl, prompt) {
  const output = await replicate.run(
    'stability-ai/stable-diffusion-3.5-large',
    { input: { image: imageUrl, mask: maskUrl, prompt } }
  );
  return output; // Generated image URL
}
```

## Embedding Cache (LRU)
```js
// Simple LRU cache for SAM2 embeddings (max 3)
class EmbeddingCache {
  constructor(maxSize = 3) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value); // Move to end (most recent)
    return value;
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  }
}
```
