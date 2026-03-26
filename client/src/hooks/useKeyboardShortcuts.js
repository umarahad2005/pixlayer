import { useEffect, useCallback } from 'react';
import { useEditorStore } from '../store/editorStore';

/**
 * Keyboard shortcut handler for the editor.
 * V=Select, S=Segment, A=AI Select, M=Move, E=Export, Ctrl+Z=Undo, Delete=Remove layer
 */
export function useKeyboardShortcuts() {
    const setActiveTool = useEditorStore((s) => s.setActiveTool);
    const openExportModal = useEditorStore((s) => s.openExportModal);
    const undo = useEditorStore((s) => s.undo);
    const removeLayer = useEditorStore((s) => s.removeLayer);
    const activeLayerId = useEditorStore((s) => s.activeLayerId);

    const handleKeyDown = useCallback(
        (e) => {
            // Don't trigger shortcuts when typing in inputs
            if (
                e.target.tagName === 'INPUT' ||
                e.target.tagName === 'TEXTAREA' ||
                e.target.tagName === 'SELECT'
            )
                return;

            switch (e.key.toLowerCase()) {
                case 'v':
                    setActiveTool('select');
                    break;
                case 's':
                    if (!e.ctrlKey && !e.metaKey) setActiveTool('segment');
                    break;
                case 'a':
                    if (!e.ctrlKey && !e.metaKey) setActiveTool('ai-select');
                    break;
                case 'm':
                    setActiveTool('move');
                    break;
                case 'e':
                    openExportModal();
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        undo();
                    }
                    break;
                case 'delete':
                case 'backspace':
                    if (activeLayerId && !e.ctrlKey) {
                        e.preventDefault();
                        removeLayer(activeLayerId);
                    }
                    break;
            }
        },
        [setActiveTool, openExportModal, undo, removeLayer, activeLayerId]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
}
