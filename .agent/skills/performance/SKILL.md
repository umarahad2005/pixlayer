---
name: Performance Optimization
description: Code splitting, Web Workers, debouncing, LRU caching, image compression, and backend optimization for PIXLAYER
---

# Performance Optimization

## Frontend Code Splitting
```jsx
import { lazy, Suspense } from 'react';

// Heavy pages lazy-loaded
const Editor = lazy(() => import('./pages/Editor'));
const Dashboard = lazy(() => import('./pages/Dashboard'));

// Loading fallback (matches dark theme)
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen bg-[#0D0D0F]">
      <div className="w-8 h-8 border-2 border-[#6C63FF] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// Usage
<Suspense fallback={<LoadingScreen />}>
  <Routes>
    <Route path="/editor" element={<Editor />} />
  </Routes>
</Suspense>
```

## Web Worker Offloading
Use Web Workers for all heavy operations to avoid blocking the UI:

```js
// Pattern: Create worker, post message, listen for result
function runInWorker(workerPath, data) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(workerPath, { type: 'module' });
    worker.onmessage = (e) => {
      if (e.data.success) resolve(e.data.result);
      else reject(new Error(e.data.error));
      worker.terminate();
    };
    worker.onerror = (e) => { reject(e); worker.terminate(); };
    worker.postMessage(data);
  });
}

// Workers needed:
// 1. vtracerWorker.js — SVG vectorization via VTracer WASM
// 2. compressionWorker.js — Image compression (toBlob)
// 3. encoderWorker.js — SAM2 encoding (if supported)
```

## Debouncing
```js
// 150ms debounce for canvas click events (SAM2 decoding)
function useDebouncedCallback(callback, delay = 150) {
  const timeoutRef = useRef(null);
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

// Usage
const debouncedDecode = useDebouncedCallback((points) => {
  decodeMask(points, imageEmbedding);
}, 150);
```

## Image Compression
```js
// Compress layer data before Zustand storage
async function compressLayerData(canvas, hasTransparency) {
  const blob = await canvas.convertToBlob({
    type: hasTransparency ? 'image/png' : 'image/jpeg',
    quality: hasTransparency ? undefined : 0.85,
  });
  return blob;
}
```

## LRU Cache for Embeddings
```js
// Cache last 3 image embeddings to avoid re-encoding
class LRUCache {
  constructor(maxSize = 3) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  get(key) {
    if (!this.cache.has(key)) return undefined;
    const val = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, val);
    return val;
  }
  set(key, val) {
    if (this.cache.size >= this.maxSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, val);
  }
}
```

## Virtual Scrolling
```jsx
// For layer panel with > 20 layers
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={panelHeight}
  itemCount={layers.length}
  itemSize={64}
  width="100%"
>
  {({ index, style }) => (
    <LayerItem key={layers[index].id} layer={layers[index]} style={style} />
  )}
</FixedSizeList>
```

## Backend Optimizations

### Response Compression
```js
import compression from 'compression';
app.use(compression()); // gzip all responses > 1KB
```

### API Response Caching
```js
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 3600 }); // 1 hour TTL

// Cache Replicate API responses by content hash
async function cachedGroundedSam(imageUrl, prompt) {
  const key = `gsam:${hashString(imageUrl + prompt)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  const result = await groundedSam(imageUrl, prompt);
  cache.set(key, result);
  return result;
}
```

### Mongoose Connection Pooling
```js
mongoose.connect(uri, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

## Performance Targets
| Metric | Target |
|--------|--------|
| Landing page Lighthouse | > 85 |
| Editor initial load | < 3 seconds |
| SAM2 mask decode (per click) | < 500ms |
| PSD export (10 layers) | < 5 seconds |
| SVG export (10 layers) | < 10 seconds |
| Auto-save round-trip | < 1 second |
