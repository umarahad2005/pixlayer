---
name: Frontend React Development
description: React component patterns, Zustand state management, Canvas rendering, and UI conventions for PIXLAYER
---

# Frontend React Development

## Component Patterns

### File Structure
```
components/
├── layout/         # TopBar, Sidebar — structural, always visible
├── editor/         # CanvasEditor, LayerPanel, PropertiesPanel — editor-specific
├── export/         # ExportModal — export flow
└── ui/             # Button, Badge, Tooltip, Modal — reusable primitives
```

### Naming Conventions
- **Components**: PascalCase — `LayerPanel.jsx`, `ExportModal.jsx`
- **Hooks**: camelCase with `use` prefix — `useCanvas.js`, `useLayers.js`
- **Utils/Libs**: camelCase — `apiClient.js`, `psdExporter.js`
- **Stores**: camelCase with `Store` suffix — `editorStore.js`

### Component Template
```jsx
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';

export default function ComponentName({ prop1, prop2, onAction }) {
  const [localState, setLocalState] = useState(null);

  const handleAction = useCallback(() => {
    // Always use useCallback for event handlers passed to children
    onAction?.(localState);
  }, [localState, onAction]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {/* Component content */}
    </motion.div>
  );
}
```

### Import Order
```jsx
// 1. React core
import { useState, useEffect, useCallback } from 'react';
// 2. Third-party libraries
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Lock, GripVertical } from 'lucide-react';
// 3. Store / hooks
import { useEditorStore } from '../store/editorStore';
import { useCanvas } from '../hooks/useCanvas';
// 4. Components
import Button from '../ui/Button';
// 5. Utils / constants
import { formatFileSize } from '../lib/helpers';
```

## Zustand State Management

### Store Structure (editorStore.js)
```js
import { create } from 'zustand';

export const useEditorStore = create((set, get) => ({
  // Image state
  currentImage: null,        // { src, width, height, base64 }
  imageEmbedding: null,      // Cached SAM2 embedding

  // Layers state
  layers: [],                // [{ id, name, visible, locked, imageData, bounds }]
  activeLayerId: null,

  // Tool state
  activeTool: 'select',     // 'select' | 'segment' | 'ai-select' | 'move'
  segmentPoints: [],         // [{ x, y, label }] — 1=positive, 0=negative
  currentMask: null,

  // Export state
  exportModalOpen: false,
  exportFormat: 'svg',       // 'svg' | 'psd' | 'figma'

  // History (undo)
  history: [],               // Last 10 layer snapshots
  historyIndex: -1,

  // Actions
  setImage: (image) => set({ currentImage: image, layers: [], imageEmbedding: null }),
  addLayer: (layer) => {
    const { layers, history } = get();
    const newLayers = [...layers, layer];
    set({
      layers: newLayers,
      history: [...history.slice(-9), layers], // Keep last 10
    });
  },
  removeLayer: (id) => set((s) => ({ layers: s.layers.filter(l => l.id !== id) })),
  toggleLayerVisibility: (id) => set((s) => ({
    layers: s.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l)
  })),
  undo: () => {
    const { history } = get();
    if (history.length > 0) {
      const prev = history[history.length - 1];
      set({ layers: prev, history: history.slice(0, -1) });
    }
  },
}));
```

### Selector Pattern
```jsx
// GOOD — only re-renders when layers change
const layers = useEditorStore((s) => s.layers);

// BAD — re-renders on ANY store change
const { layers } = useEditorStore();
```

## Canvas Rendering

### DPI-Aware Canvas Setup
```jsx
const setupCanvas = (canvasEl, width, height) => {
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width = width * dpr;
  canvasEl.height = height * dpr;
  canvasEl.style.width = `${width}px`;
  canvasEl.style.height = `${height}px`;
  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
};
```

### Checkerboard Pattern
```jsx
const drawCheckerboard = (ctx, width, height, size = 8) => {
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      ctx.fillStyle = (x / size + y / size) % 2 === 0 ? '#1a1a1e' : '#222226';
      ctx.fillRect(x, y, size, size);
    }
  }
};
```

## Animation Patterns (Framer Motion)

```jsx
// Layer panel item slide-in
const layerVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
};

// All transitions use 150ms for consistency
const transition = { duration: 0.15, ease: 'easeOut' };
```

## Routing Setup
```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';

const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Editor = lazy(() => import('./pages/Editor'));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/editor/:projectId?" element={<Editor />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
```

## TailwindCSS Custom Theme
All PIXLAYER-specific tokens are defined in `tailwind.config.js`:
```js
{
  theme: {
    extend: {
      colors: {
        px: {
          bg: '#0D0D0F',
          surface: '#141416',
          border: '#1E1E22',
          accent: '#6C63FF',
          'accent-hover': '#8B85FF',
          text: '#E4E4E7',
          'text-muted': '#71717A',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        body: ['Inter', 'sans-serif'],
      }
    }
  }
}
```
