import { create } from 'zustand';

let layerCounter = 0;

export const useEditorStore = create((set, get) => ({
    // ──────── Image Slice ────────
    currentImage: null,
    imageEmbedding: null,

    setImage: (image) => set({
        currentImage: image,
        layers: [],
        imageEmbedding: null,
        segmentPoints: [],
        currentMask: null,
    }),
    setImageEmbedding: (embedding) => set({ imageEmbedding: embedding }),

    // ──────── Layers Slice ────────
    layers: [],
    activeLayerId: null,

    addLayer: (layerData) => {
        const { layers, history } = get();
        layerCounter++;
        const layer = {
            id: `layer-${Date.now()}-${layerCounter}`,
            name: layerData.name || `Layer ${layers.length + 1}`,
            visible: true,
            locked: false,
            ...layerData,
        };
        set({
            layers: [...layers, layer],
            activeLayerId: layer.id,
            history: [...history.slice(-9), [...layers]],
        });
    },
    removeLayer: (id) => {
        const { layers, history, activeLayerId } = get();
        set({
            layers: layers.filter((l) => l.id !== id),
            activeLayerId: activeLayerId === id ? null : activeLayerId,
            history: [...history.slice(-9), [...layers]],
        });
    },
    updateLayer: (id, updates) =>
        set((s) => ({
            layers: s.layers.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        })),
    toggleLayerVisibility: (id) =>
        set((s) => ({
            layers: s.layers.map((l) =>
                l.id === id ? { ...l, visible: !l.visible } : l
            ),
        })),
    toggleLayerLock: (id) =>
        set((s) => ({
            layers: s.layers.map((l) =>
                l.id === id ? { ...l, locked: !l.locked } : l
            ),
        })),
    reorderLayers: (fromIndex, toIndex) =>
        set((s) => {
            const arr = [...s.layers];
            const [moved] = arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, moved);
            return { layers: arr };
        }),
    setActiveLayer: (id) => set({ activeLayerId: id }),

    // ──────── Tools Slice ────────
    activeTool: 'select',
    segmentPoints: [],
    currentMask: null,
    aiPrompt: '',

    setActiveTool: (tool) =>
        set({ activeTool: tool, segmentPoints: [], currentMask: null }),
    addSegmentPoint: (point) =>
        set((s) => ({ segmentPoints: [...s.segmentPoints, point] })),
    clearSegmentPoints: () => set({ segmentPoints: [], currentMask: null }),
    setCurrentMask: (mask) => set({ currentMask: mask }),
    setAiPrompt: (prompt) => set({ aiPrompt: prompt }),

    // ──────── Export Slice ────────
    exportModalOpen: false,
    exportFormat: 'svg',

    openExportModal: () => set({ exportModalOpen: true }),
    closeExportModal: () => set({ exportModalOpen: false }),
    setExportFormat: (format) => set({ exportFormat: format }),

    // ──────── History Slice ────────
    history: [],

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
    setSaving: (saving, timestamp) =>
        set({ isSaving: saving, ...(timestamp && { lastSaved: timestamp }) }),
}));
