import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { formatFileSize } from '../../lib/helpers';
import { apiClient } from '../../lib/apiClient';
import { useToast } from '../ui/Toast';
import Button from '../ui/Button';
import {
    Image,
    Layers,
    Maximize2,
    Wand2,
    Sparkles,
    Loader2,
} from 'lucide-react';

export default function PropertiesPanel() {
    const currentImage = useEditorStore((s) => s.currentImage);
    const layers = useEditorStore((s) => s.layers);
    const activeLayerId = useEditorStore((s) => s.activeLayerId);
    const activeLayer = layers.find((l) => l.id === activeLayerId);
    const toast = useToast();

    const [inpaintLoading, setInpaintLoading] = useState(false);
    const [sdPrompt, setSdPrompt] = useState('');
    const [sdLoading, setSdLoading] = useState(false);

    const handleQuickHeal = async () => {
        if (!currentImage) return;
        setInpaintLoading(true);
        try {
            // In production, upload image + mask to Cloudinary first
            await apiClient.post('/api/segment/inpaint/fast', {
                imageUrl: currentImage.src,
                maskUrl: currentImage.src, // Placeholder
            });
            toast.success('Background healed successfully');
        } catch (err) {
            toast.error(err.message || 'Inpainting failed');
        } finally {
            setInpaintLoading(false);
        }
    };

    const handleAiFill = async () => {
        if (!currentImage || !sdPrompt.trim()) return;
        setSdLoading(true);
        try {
            await apiClient.post('/api/segment/inpaint/prompt', {
                imageUrl: currentImage.src,
                maskUrl: currentImage.src,
                prompt: sdPrompt,
            });
            toast.success('AI fill generated');
        } catch (err) {
            toast.error(err.message || 'AI fill failed');
        } finally {
            setSdLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-[260px] h-full bg-px-surface border-l border-px-border shrink-0">
            {/* Header */}
            <div className="px-4 py-3 border-b border-px-border">
                <h3 className="font-mono text-[11px] font-semibold text-px-text-muted uppercase tracking-widest">
                    Properties
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Image Info */}
                {currentImage && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 text-px-text-muted">
                            <Image size={14} />
                            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
                                Image
                            </span>
                        </div>
                        <div className="space-y-2 pl-1">
                            <PropertyRow label="File" value={currentImage.fileName} />
                            <PropertyRow
                                label="Size"
                                value={`${currentImage.width} × ${currentImage.height}`}
                            />
                            <PropertyRow
                                label="Weight"
                                value={formatFileSize(currentImage.fileSize)}
                            />
                        </div>
                    </div>
                )}

                {/* Layer Info */}
                {activeLayer && (
                    <div className="space-y-3 pt-3 border-t border-px-border">
                        <div className="flex items-center gap-2 text-px-text-muted">
                            <Layers size={14} />
                            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
                                Selected Layer
                            </span>
                        </div>
                        <div className="space-y-2 pl-1">
                            <PropertyRow label="Name" value={activeLayer.name} />
                            <PropertyRow
                                label="Visible"
                                value={activeLayer.visible ? 'Yes' : 'No'}
                            />
                            <PropertyRow
                                label="Locked"
                                value={activeLayer.locked ? 'Yes' : 'No'}
                            />
                            {activeLayer.bounds && (
                                <>
                                    <PropertyRow
                                        label="Position"
                                        value={`${activeLayer.bounds.x}, ${activeLayer.bounds.y}`}
                                    />
                                    <PropertyRow
                                        label="Bounds"
                                        value={`${activeLayer.bounds.w} × ${activeLayer.bounds.h}`}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Inpainting Tools */}
                {currentImage && layers.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-px-border">
                        <div className="flex items-center gap-2 text-px-text-muted">
                            <Wand2 size={14} />
                            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
                                Inpainting
                            </span>
                        </div>

                        {/* Quick Heal */}
                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full"
                            icon={inpaintLoading ? Loader2 : Sparkles}
                            onClick={handleQuickHeal}
                            disabled={inpaintLoading}
                        >
                            {inpaintLoading ? 'Healing...' : 'Auto-Heal Background'}
                        </Button>

                        {/* AI Fill */}
                        <div className="space-y-2">
                            <input
                                type="text"
                                value={sdPrompt}
                                onChange={(e) => setSdPrompt(e.target.value)}
                                placeholder="Describe the fill..."
                                className="w-full px-3 py-2 bg-px-bg text-px-text font-mono text-xs border border-px-border rounded-sm outline-none focus:border-px-accent transition-default placeholder:text-px-text-muted"
                            />
                            <Button
                                variant="primary"
                                size="sm"
                                className="w-full"
                                icon={sdLoading ? Loader2 : Sparkles}
                                onClick={handleAiFill}
                                disabled={sdLoading || !sdPrompt.trim()}
                            >
                                {sdLoading ? 'Generating...' : 'AI Fill (1 credit)'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* Empty state */}
                {!currentImage && !activeLayer && (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <Maximize2 size={24} className="text-px-text-muted mb-3" />
                        <p className="font-mono text-xs text-px-text-muted">
                            Upload an image to see properties
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

function PropertyRow({ label, value }) {
    return (
        <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-px-text-muted">{label}</span>
            <span className="font-mono text-[11px] text-px-text truncate max-w-[140px] text-right">
                {value}
            </span>
        </div>
    );
}
