---
name: State Management (Zustand)
description: Zustand store patterns, slice architecture, selectors, undo/redo, auto-save serialization, and computed state for PIXLAYER
---

# State Management (Zustand)

## Store Architecture

PIXLAYER uses a single Zustand store (`editorStore`) with logical slices.

### Complete Store
```js
// client/src/store/editorStore.js
import { create } from 'zustand';
import { v4 as uuid } from 'uuid';

export const useEditorStore = create((set, get) => ({
  // ──────── Image Slice ────────
  currentImage: null,       // { src: string, width: number, height: number, fileName: string, fileSize: number }
  imageEmbedding: null,     // Cached SAM2 ONNX tensor

  setImage: (image) => set({
    currentImage: image,
    layers: [],
    imageEmbedding: null,
    segmentPoints: [],
    currentMask: null,
  }),
  setImageEmbedding: (embedding) => set({ imageEmbedding: embedding }),

  // ──────── Layers Slice ────────
  layers: [],               // Array<Layer>
  activeLayerId: null,

  addLayer: (layerData) => {
    const { layers, history } = get();
    const layer = { id: uuid(), visible: true, locked: false, ...layerData };
    set({
      layers: [...layers, layer],
      activeLayerId: layer.id,
      history: [...history.slice(-9), [...layers]], // Snapshot before change
    });
  },
  removeLayer: (id) => {
    const { layers, history } = get();
    set({
      layers: layers.filter(l => l.id !== id),
      activeLayerId: null,
      history: [...history.slice(-9), [...layers]],
    });
  },
  updateLayer: (id, updates) => set((s) => ({
    layers: s.layers.map(l => l.id === id ? { ...l, ...updates } : l),
  })),
  toggleLayerVisibility: (id) => set((s) => ({
    layers: s.layers.map(l => l.id === id ? { ...l, visible: !l.visible } : l),
  })),
  toggleLayerLock: (id) => set((s) => ({
    layers: s.layers.map(l => l.id === id ? { ...l, locked: !l.locked } : l),
  })),
  reorderLayers: (fromIndex, toIndex) => set((s) => {
    const arr = [...s.layers];
    const [moved] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, moved);
    return { layers: arr };
  }),
  setActiveLayer: (id) => set({ activeLayerId: id }),

  // ──────── Tools Slice ────────
  activeTool: 'select',     // 'select' | 'segment' | 'ai-select' | 'move'
  segmentPoints: [],         // [{ x, y, label }] — 1=positive, 0=negative
  currentMask: null,         // ImageData or null
  aiPrompt: '',              // Text prompt for AI select

  setActiveTool: (tool) => set({ activeTool: tool, segmentPoints: [], currentMask: null }),
  addSegmentPoint: (point) => set((s) => ({ segmentPoints: [...s.segmentPoints, point] })),
  clearSegmentPoints: () => set({ segmentPoints: [], currentMask: null }),
  setCurrentMask: (mask) => set({ currentMask: mask }),
  setAiPrompt: (prompt) => set({ aiPrompt: prompt }),

  // ──────── Export Slice ────────
  exportModalOpen: false,
  exportFormat: 'svg',       // 'svg' | 'psd' | 'figma'
  exportOptions: {
    svg: { colorMode: 'color', precision: 'balanced', curveFitting: 'spline' },
    psd: {},
    figma: {},
  },

  openExportModal: () => set({ exportModalOpen: true }),
  closeExportModal: () => set({ exportModalOpen: false }),
  setExportFormat: (format) => set({ exportFormat: format }),
  setExportOptions: (format, options) => set((s) => ({
    exportOptions: { ...s.exportOptions, [format]: { ...s.exportOptions[format], ...options } },
  })),

  // ──────── History Slice (Undo) ────────
  history: [],               // Last 10 layer state snapshots

  undo: () => {
    const { history } = get();
    if (history.length === 0) return;
    const previousLayers = history[history.length - 1];
    set({
      layers: previousLayers,
      history: history.slice(0, -1),
    });
  },

  // ──────── UI Slice ────────
  isModelLoading: false,
  isEncoding: false,
  isMasking: false,
  isSaving: false,
  lastSaved: null,

  setModelLoading: (v) => set({ isModelLoading: v }),
  setEncoding: (v) => set({ isEncoding: v }),
  setMasking: (v) => set({ isMasking: v }),
  setSaving: (saving, timestamp) => set({
    isSaving: saving,
    ...(timestamp && { lastSaved: timestamp }),
  }),
}));
```

## Selector Patterns

### Specific Selectors (ALWAYS use these)
```jsx
// GOOD — component only re-renders when layers change
const layers = useEditorStore((s) => s.layers);
const activeTool = useEditorStore((s) => s.activeTool);

// GOOD — derived selector
const activeLayer = useEditorStore((s) =>
  s.layers.find(l => l.id === s.activeLayerId)
);

// GOOD — multiple values via shallow compare
import { shallow } from 'zustand/shallow';
const { isEncoding, isMasking } = useEditorStore(
  (s) => ({ isEncoding: s.isEncoding, isMasking: s.isMasking }),
  shallow
);
```

### Anti-Patterns (NEVER do these)
```jsx
// BAD — re-renders on ANY store change
const store = useEditorStore();
const { layers, activeTool, currentImage } = useEditorStore();
```

## Auto-Save Serialization
```js
// Serialize for API (strip heavy imageData, use URLs instead)
function serializeProject(state) {
  return {
    layers: state.layers.map(l => ({
      id: l.id,
      name: l.name,
      visible: l.visible,
      locked: l.locked,
      bounds: l.bounds,
      imageUrl: l.imageUrl, // Pre-uploaded to Cloudinary
    })),
    exportOptions: state.exportOptions,
  };
}

// Auto-save hook
function useAutoSave(projectId) {
  const layers = useEditorStore(s => s.layers);
  const setSaving = useEditorStore(s => s.setSaving);

  useEffect(() => {
    if (!projectId) return;
    const interval = setInterval(async () => {
      setSaving(true);
      try {
        const data = serializeProject(useEditorStore.getState());
        await apiClient.patch(`/projects/${projectId}`, data);
        setSaving(false, new Date().toISOString());
      } catch (err) {
        setSaving(false);
        console.error('Auto-save failed:', err);
      }
    }, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [projectId]);
}
```
