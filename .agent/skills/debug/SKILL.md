---
name: Debug & Troubleshooting
description: Debugging patterns for Canvas, WASM/ONNX, Express, React errors, and Sentry integration
---

# Debug & Troubleshooting

## Common Issues & Fixes

### 1. WASM/ONNX Model Loading Fails
**Symptoms**: `Failed to load model`, `RuntimeError: memory access out of bounds`
**Fixes**:
- Verify model files exist in `client/public/models/`
- Check `Content-Type` is served as `application/wasm` (Vite does this automatically)
- Use exact version: `onnxruntime-web@1.19.0` — newer versions break WebGPU
- If WebGPU unavailable, fallback to WASM execution provider:
```js
const session = await ort.InferenceSession.create(modelPath, {
  executionProviders: ['webgpu', 'wasm'], // Fallback chain
});
```

### 2. Canvas Rendering Blank
**Symptoms**: Canvas visible but image not showing
**Fixes**:
- Ensure `drawImage` is called AFTER image `onload`:
```js
const img = new Image();
img.onload = () => ctx.drawImage(img, 0, 0);
img.src = base64Data;
```
- Check canvas dimensions match container (DPI scaling issue)
- Verify `ctx` is `2d` not `webgl` unless intentional

### 3. CORS Errors on API Calls
**Symptoms**: `Access to fetch blocked by CORS policy`
**Fixes**:
- Ensure server CORS origin matches Vite dev server (`http://localhost:5173`)
- Check that `credentials: true` is set in both CORS config and fetch calls
- For file uploads, don't manually set `Content-Type` — let browser set multipart boundary

### 4. SAM 2 Tensor Shape Mismatch
**Symptoms**: `Error: input tensor shape mismatch`
**Fixes**:
- Encoder input: `Float32Array`, shape `[1, 3, 1024, 1024]`, values normalized to `[0, 1]`
- Channel order: RGB (not RGBA — strip alpha channel)
- Point coords: normalized to `[0, 1]` range relative to image dimensions
- Point labels: `Int32Array` — 1 for positive, 0 for negative
- First call: `has_mask_input = 0`, `mask_input = Float32Array(256*256).fill(0)`

### 5. MongoDB Connection Issues
**Symptoms**: `MongoServerError: bad auth`, connection timeout
**Fixes**:
- Check `MONGODB_URI` includes username, password, database name
- Whitelist IP in MongoDB Atlas Network Access (or use `0.0.0.0/0` for dev)
- Set `maxPoolSize: 10` in connection options

### 6. JWT Token Expired on Page Refresh
**Symptoms**: 401 after refresh despite logging in
**Fixes**:
- Verify token is stored in `localStorage` under key `px_token`
- Check `Authorization: Bearer <token>` header is sent with every request
- Token expiry is 7d — check server clock vs client clock

## Express Server Debugging

### Enable Detailed Logging
```js
import morgan from 'morgan';
// Dev: shows method, url, status, response time
app.use(morgan('dev'));

// Debug: log request bodies (DON'T use in production)
app.use((req, res, next) => {
  if (process.env.DEBUG) console.log('Body:', JSON.stringify(req.body).slice(0, 200));
  next();
});
```

### Unhandled Promise Rejections
```js
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // In production: Sentry.captureException(reason);
});
```

## React Error Boundaries
```jsx
import { Component } from 'react';

class EditorErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Editor crash:', error, info);
    // Sentry.captureException(error, { extra: info });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen bg-px-bg text-px-text">
          <h2 className="font-display text-2xl mb-4">Something went wrong</h2>
          <p className="text-px-text-muted mb-6">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}
            className="px-4 py-2 bg-px-accent text-white rounded">
            Reload Editor
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

## Sentry Integration

### Client Setup
```js
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

### Server Setup
```js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

// Add as first middleware
app.use(Sentry.Handlers.requestHandler());
// Add as last error middleware
app.use(Sentry.Handlers.errorHandler());
```

## Browser DevTools Tips
- **Canvas debugging**: Use Chrome's "Canvas" tab in DevTools to inspect draw calls
- **WebGPU**: Check `chrome://gpu` for WebGPU support status
- **Memory**: Use Performance tab to profile WASM memory usage during segmentation
- **Network**: Filter by `Fetch/XHR` to see API calls, filter by `Other` to see WASM file loads
