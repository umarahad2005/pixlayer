import { useState } from 'react';
import { FileCode2, FileImage, Layout, Loader2 } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { useEditorStore } from '../../store/editorStore';
import { useToast } from '../ui/Toast';
import { exportSvg, downloadSvg } from '../../lib/svgExporter';
import { exportPsd, downloadPsd } from '../../lib/psdExporter';
import { exportFigmaJson, downloadFigmaJson } from '../../lib/figmaExporter';

const tabs = [
    { id: 'svg', label: 'SVG', icon: FileCode2 },
    { id: 'psd', label: 'PSD', icon: FileImage },
    { id: 'figma', label: 'Figma', icon: Layout },
];

export default function ExportModal() {
    const isOpen = useEditorStore((s) => s.exportModalOpen);
    const closeModal = useEditorStore((s) => s.closeExportModal);
    const layers = useEditorStore((s) => s.layers);
    const currentImage = useEditorStore((s) => s.currentImage);
    const [activeTab, setActiveTab] = useState('svg');
    const [isExporting, setIsExporting] = useState(false);
    const [svgPrecision, setSvgPrecision] = useState('Balanced');
    const [svgCurve, setSvgCurve] = useState('Spline');
    const [svgColor, setSvgColor] = useState('Color');
    const toast = useToast();

    const imgW = currentImage?.width || 1024;
    const imgH = currentImage?.height || 1024;

    const handleExport = async () => {
        if (layers.length === 0) {
            toast.error('No layers to export. Segment an image first.');
            return;
        }
        setIsExporting(true);
        try {
            if (activeTab === 'svg') {
                const svg = await exportSvg(layers, imgW, imgH, {
                    precision: svgPrecision,
                    curveFitting: svgCurve,
                    colorMode: svgColor,
                });
                downloadSvg(svg);
                toast.success('SVG exported successfully');
            } else if (activeTab === 'psd') {
                const buffer = await exportPsd(layers, imgW, imgH);
                downloadPsd(buffer);
                toast.success('PSD exported successfully');
            } else if (activeTab === 'figma') {
                const json = await exportFigmaJson(layers, imgW, imgH);
                downloadFigmaJson(json);
                toast.success('Figma JSON exported successfully');
            }
        } catch (err) {
            console.error('Export error:', err);
            toast.error(`Export failed: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={closeModal} title="Export" width="max-w-xl">
            {/* Tabs */}
            <div className="flex items-center gap-1 mb-5 p-0.5 bg-px-bg rounded-sm border border-px-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 flex-1 px-3 py-2 font-mono text-xs rounded-sm transition-default cursor-pointer ${activeTab === tab.id
                                ? 'bg-px-accent text-white'
                                : 'text-px-text-muted hover:text-px-text hover:bg-px-surface'
                            }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-4">
                {/* Layer info */}
                <div className="flex items-center justify-between p-3 bg-px-bg rounded-sm border border-px-border">
                    <span className="font-mono text-xs text-px-text-muted">Layers to export</span>
                    <Badge variant="accent">{layers.length} layers</Badge>
                </div>

                {/* SVG Options */}
                {activeTab === 'svg' && (
                    <div className="space-y-3">
                        <OptionRow label="Color Mode">
                            <SelectOption options={['Color', 'Grayscale', 'Binary']} value={svgColor} onChange={setSvgColor} />
                        </OptionRow>
                        <OptionRow label="Path Precision">
                            <SelectOption options={['Draft', 'Balanced', 'High']} value={svgPrecision} onChange={setSvgPrecision} />
                        </OptionRow>
                        <OptionRow label="Curve Fitting">
                            <SelectOption options={['Pixel', 'Spline', 'None']} value={svgCurve} onChange={setSvgCurve} />
                        </OptionRow>
                    </div>
                )}

                {/* PSD Options */}
                {activeTab === 'psd' && (
                    <div className="space-y-3">
                        <div className="p-3 bg-px-bg rounded-sm border border-px-border">
                            <p className="font-mono text-xs text-px-text-muted">
                                Exports a Photoshop-compatible PSD with named, positioned layers and transparency.
                            </p>
                        </div>
                        <OptionRow label="Color Mode">
                            <span className="font-mono text-xs text-px-text">RGB 8-bit</span>
                        </OptionRow>
                        <OptionRow label="Channels">
                            <span className="font-mono text-xs text-px-text">RGBA</span>
                        </OptionRow>
                    </div>
                )}

                {/* Figma Options */}
                {activeTab === 'figma' && (
                    <div className="space-y-3">
                        <div className="p-3 bg-px-bg rounded-sm border border-px-border">
                            <p className="font-mono text-xs text-px-text-muted">
                                Downloads a JSON file compatible with the PIXLAYER Figma Plugin.
                            </p>
                        </div>
                        <div className="p-3 bg-px-accent/5 rounded-sm border border-px-accent/20">
                            <p className="font-mono text-[11px] text-px-accent mb-2 font-semibold">
                                How to use:
                            </p>
                            <ol className="space-y-1 font-body text-xs text-px-text-muted list-decimal pl-4">
                                <li>Download the JSON export below</li>
                                <li>Open Figma → Plugins → PIXLAYER Importer</li>
                                <li>Select the downloaded JSON file</li>
                                <li>Click "Import to Figma"</li>
                            </ol>
                        </div>
                    </div>
                )}

                {/* Export button */}
                <Button
                    variant="primary"
                    className="w-full"
                    size="lg"
                    icon={isExporting ? Loader2 : undefined}
                    onClick={handleExport}
                    disabled={isExporting || layers.length === 0}
                >
                    {isExporting ? 'Exporting...' : `Export as ${activeTab.toUpperCase()}`}
                </Button>
            </div>
        </Modal>
    );
}

function OptionRow({ label, children }) {
    return (
        <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-px-text-muted">{label}</span>
            {children}
        </div>
    );
}

function SelectOption({ options, value, onChange }) {
    return (
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="bg-px-bg text-px-text font-mono text-xs px-2 py-1 rounded-sm border border-px-border outline-none focus:border-px-accent transition-default cursor-pointer"
        >
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {opt}
                </option>
            ))}
        </select>
    );
}
