import TopBar from '../components/layout/TopBar';
import LayerPanel from '../components/editor/LayerPanel';
import CanvasEditor from '../components/editor/CanvasEditor';
import PropertiesPanel from '../components/editor/PropertiesPanel';
import ExportModal from '../components/export/ExportModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export default function Editor() {
    useKeyboardShortcuts();

    return (
        <div className="flex flex-col h-screen w-screen bg-px-bg">
            <TopBar />
            <div className="flex flex-1 overflow-hidden">
                <LayerPanel />
                <CanvasEditor />
                <PropertiesPanel />
            </div>
            <ExportModal />
        </div>
    );
}
