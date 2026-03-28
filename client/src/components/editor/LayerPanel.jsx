import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Lock, Unlock, GripVertical, Trash2 } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';

function LayerItem({ layer, isActive, onSelect, onToggleVisibility, onToggleLock, onRemove }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.15 }}
            className={`group flex items-center gap-2 px-3 py-2 cursor-pointer transition-default border-l-2 ${isActive
                    ? 'bg-px-accent/10 border-px-accent'
                    : 'border-transparent hover:bg-px-surface-elevated'
                }`}
            onClick={() => onSelect(layer.id)}
        >
            {/* Drag handle */}
            <GripVertical
                size={14}
                className="text-px-text-muted opacity-0 group-hover:opacity-100 transition-default shrink-0 cursor-grab"
            />

            {/* Layer thumbnail */}
            <div
                className="w-8 h-8 rounded-sm border border-px-border shrink-0"
                style={{ backgroundColor: layer.color || '#1A1A1E' }}
            />

            {/* Layer name */}
            <span className="font-mono text-xs text-px-text truncate flex-1">
                {layer.name}
            </span>

            {/* Controls */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-default">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(layer.id);
                    }}
                    className="p-1 text-px-text-muted hover:text-px-text transition-default cursor-pointer"
                >
                    {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock(layer.id);
                    }}
                    className="p-1 text-px-text-muted hover:text-px-text transition-default cursor-pointer"
                >
                    {layer.locked ? <Lock size={13} /> : <Unlock size={13} />}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(layer.id);
                    }}
                    className="p-1 text-px-text-muted hover:text-px-error transition-default cursor-pointer"
                >
                    <Trash2 size={13} />
                </button>
            </div>
        </motion.div>
    );
}

export default function LayerPanel() {
    const layers = useEditorStore((s) => s.layers);
    const activeLayerId = useEditorStore((s) => s.activeLayerId);
    const setActiveLayer = useEditorStore((s) => s.setActiveLayer);
    const toggleLayerVisibility = useEditorStore((s) => s.toggleLayerVisibility);
    const toggleLayerLock = useEditorStore((s) => s.toggleLayerLock);
    const removeLayer = useEditorStore((s) => s.removeLayer);

    const displayLayers = layers;

    return (
        <div className="flex flex-col w-[240px] h-full bg-px-surface border-r border-px-border shrink-0">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-px-border">
                <h3 className="font-mono text-[11px] font-semibold text-px-text-muted uppercase tracking-widest">
                    Layers
                </h3>
                <span className="font-mono text-[10px] text-px-text-muted">
                    {displayLayers.length}
                </span>
            </div>

            {/* Layer list */}
            <div className="flex-1 overflow-y-auto">
                <AnimatePresence>
                    {[...displayLayers].reverse().map((layer) => (
                        <LayerItem
                            key={layer.id}
                            layer={layer}
                            isActive={activeLayerId === layer.id}
                            onSelect={setActiveLayer}
                            onToggleVisibility={toggleLayerVisibility}
                            onToggleLock={toggleLayerLock}
                            onRemove={removeLayer}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}
