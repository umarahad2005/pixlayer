import { useCallback } from 'react';
import {
    MousePointer2,
    Scissors,
    Sparkles,
    Move,
    Download,
    Loader2,
} from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Tooltip from '../ui/Tooltip';

const tools = [
    { id: 'select', icon: MousePointer2, label: 'Select', shortcut: 'V' },
    { id: 'segment', icon: Scissors, label: 'Segment', shortcut: 'S' },
    { id: 'ai-select', icon: Sparkles, label: 'AI Select', shortcut: 'A' },
    { id: 'move', icon: Move, label: 'Move', shortcut: 'M' },
];

export default function TopBar() {
    const activeTool = useEditorStore((s) => s.activeTool);
    const setActiveTool = useEditorStore((s) => s.setActiveTool);
    const openExportModal = useEditorStore((s) => s.openExportModal);
    const isModelLoading = useEditorStore((s) => s.isModelLoading);
    const isSaving = useEditorStore((s) => s.isSaving);
    const lastSaved = useEditorStore((s) => s.lastSaved);
    const currentImage = useEditorStore((s) => s.currentImage);

    const handleToolChange = useCallback(
        (toolId) => {
            setActiveTool(toolId);
        },
        [setActiveTool]
    );

    return (
        <div className="flex items-center justify-between h-12 px-4 bg-px-surface border-b border-px-border shrink-0">
            {/* Left — Logo */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-px-accent rounded-sm flex items-center justify-center">
                        <span className="font-mono text-xs font-bold text-white">PX</span>
                    </div>
                    <span className="font-display text-sm font-semibold tracking-wide text-px-text">
                        PIXLAYER
                    </span>
                </div>
                <div className="w-px h-5 bg-px-border" />
                <span className="font-mono text-xs text-px-text-muted">
                    {currentImage?.fileName || 'Untitled Project'}
                </span>
            </div>

            {/* Center — Tools */}
            <div className="flex items-center gap-1 bg-px-bg rounded-sm p-0.5 border border-px-border">
                {tools.map((tool) => (
                    <Tooltip key={tool.id} content={`${tool.label} (${tool.shortcut})`}>
                        <button
                            onClick={() => handleToolChange(tool.id)}
                            className={`p-2 rounded-sm transition-default cursor-pointer ${activeTool === tool.id
                                    ? 'bg-px-accent text-white'
                                    : 'text-px-text-muted hover:text-px-text hover:bg-px-surface'
                                }`}
                        >
                            <tool.icon size={16} />
                        </button>
                    </Tooltip>
                ))}
            </div>

            {/* Right — Status + Export */}
            <div className="flex items-center gap-3">
                {isModelLoading && (
                    <div className="flex items-center gap-2 text-px-text-muted">
                        <Loader2 size={14} className="animate-spin" />
                        <span className="font-mono text-[11px]">Loading AI model...</span>
                    </div>
                )}
                {isSaving && (
                    <span className="font-mono text-[11px] text-px-text-muted animate-pulse">
                        Saving...
                    </span>
                )}
                {!isSaving && lastSaved && (
                    <span className="font-mono text-[11px] text-px-text-muted">Saved</span>
                )}
                <Button
                    variant="primary"
                    size="sm"
                    icon={Download}
                    onClick={openExportModal}
                >
                    Export
                </Button>
            </div>
        </div>
    );
}
