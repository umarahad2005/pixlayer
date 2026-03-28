import { useRef, useEffect, useCallback, useState } from 'react';
import { Upload, ImagePlus, Check, RotateCcw, Loader2 } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { useSegmentation } from '../../hooks/useSegmentation';
import Button from '../ui/Button';

function drawCheckerboard(ctx, width, height, size = 8) {
    const colors = ['#1a1a1e', '#222226'];
    for (let y = 0; y < height; y += size) {
        for (let x = 0; x < width; x += size) {
            ctx.fillStyle = colors[(Math.floor(x / size) + Math.floor(y / size)) % 2];
            ctx.fillRect(x, y, size, size);
        }
    }
}

export default function CanvasEditor() {
    const canvasRef = useRef(null);
    const imgRef = useRef(null);
    const scaleRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
    const debounceRef = useRef(null);

    const currentImage = useEditorStore((s) => s.currentImage);
    const setImage = useEditorStore((s) => s.setImage);
    const activeTool = useEditorStore((s) => s.activeTool);
    const addLayer = useEditorStore((s) => s.addLayer);
    const setModelLoading = useEditorStore((s) => s.setModelLoading);
    const setEncoding = useEditorStore((s) => s.setEncoding);
    const layers = useEditorStore((s) => s.layers);

    const [segmentPoints, setSegmentPoints] = useState([]);
    const [renderTrigger, setRenderTrigger] = useState(0);
    const {
        isModelLoaded,
        isEncoding,
        isMasking,
        currentMask,
        loadModel,
        encodeImage,
        decodeMask,
        extractMaskedRegion,
        clearMask,
    } = useSegmentation();

    // Load model when segment tool is selected
    useEffect(() => {
        if ((activeTool === 'segment' || activeTool === 'ai-select') && !isModelLoaded) {
            setModelLoading(true);
            loadModel().finally(() => setModelLoading(false));
        }
    }, [activeTool, isModelLoaded, loadModel, setModelLoading]);

    // Encode image when loaded
    useEffect(() => {
        if (currentImage?.src && isModelLoaded) {
            setEncoding(true);
            const img = new Image();
            img.onload = () => {
                const c = new OffscreenCanvas(img.width, img.height);
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                encodeImage(imageData, img.width, img.height).finally(() => setEncoding(false));
            };
            img.src = currentImage.src;
        }
    }, [currentImage?.src, isModelLoaded, encodeImage, setEncoding]);

    // Draw on canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const container = canvas.parentElement;
        const width = container.clientWidth;
        const height = container.clientHeight;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);

        // Checkerboard
        drawCheckerboard(ctx, width, height);

        // Draw image if loaded
        if (currentImage?.src && imgRef.current) {
            const img = imgRef.current;
            const scale = Math.min(width / img.width, height / img.height) * 0.85;
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (width - w) / 2;
            const y = (height - h) / 2;
            scaleRef.current = { scale, offsetX: x, offsetY: y };

            // Draw layers
            layers.forEach((layer) => {
                if (!layer.visible) return;
                
                if (layer.isBase) {
                    ctx.drawImage(img, x, y, w, h);
                } else if (layer.imageData) {
                    // Calculate exact pixel position scaled to canvas
                    const lx = x + (layer.bounds.x / img.width) * w;
                    const ly = y + (layer.bounds.y / img.height) * h;
                    const lw = (layer.bounds.w / img.width) * w;
                    const lh = (layer.bounds.h / img.height) * h;
                    
                    const layerCanvas = new OffscreenCanvas(layer.bounds.w, layer.bounds.h);
                    layerCanvas.getContext('2d').putImageData(layer.imageData, 0, 0);
                    ctx.drawImage(layerCanvas, lx, ly, lw, lh);
                }
            });

            // Draw mask overlay
            if (currentMask) {
                const { data, width: mw, height: mh } = currentMask;
                const maskCanvas = new OffscreenCanvas(mw, mh);
                const mCtx = maskCanvas.getContext('2d');
                const mData = mCtx.createImageData(mw, mh);
                for (let i = 0; i < data.length; i++) {
                    if (data[i] === 1) {
                        mData.data[i * 4] = 108;     // R (#6C)
                        mData.data[i * 4 + 1] = 99;  // G (#63)
                        mData.data[i * 4 + 2] = 255; // B (#FF)
                        mData.data[i * 4 + 3] = 102; // 40% opacity
                    }
                }
                mCtx.putImageData(mData, 0, 0);
                ctx.drawImage(maskCanvas, x, y, w, h);
            }

            // Draw points
            segmentPoints.forEach((pt) => {
                const px = x + (pt.x / img.width) * w;
                const py = y + (pt.y / img.height) * h;
                ctx.beginPath();
                ctx.arc(px, py, 5, 0, Math.PI * 2);
                ctx.fillStyle = pt.label === 1 ? '#22C55E' : '#EF4444';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            });
        }
    }, [currentImage, currentMask, segmentPoints, renderTrigger]);

    // Load image element
    useEffect(() => {
        if (currentImage?.src) {
            const img = new Image();
            img.onload = () => {
                imgRef.current = img;
                // Trigger re-render directly to execute canvas draw useEffect
                setRenderTrigger((prev) => prev + 1);
            };
            img.src = currentImage.src;
        }
    }, [currentImage?.src]);

    // Handle canvas click for segmentation
    const handleCanvasClick = useCallback(
        (e) => {
            if (activeTool !== 'segment' || !currentImage || !imgRef.current) return;

            const canvas = canvasRef.current;
            const rect = canvas.getBoundingClientRect();
            const { scale, offsetX, offsetY } = scaleRef.current;
            const img = imgRef.current;

            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            // Convert to image coordinates
            const imgX = (clickX - offsetX) / scale;
            const imgY = (clickY - offsetY) / scale;

            // Check bounds
            if (imgX < 0 || imgX > img.width || imgY < 0 || imgY > img.height) return;

            const label = e.button === 2 ? 0 : 1; // right-click = negative
            const newPoints = [...segmentPoints, { x: imgX, y: imgY, label }];
            setSegmentPoints(newPoints);

            // Debounced decode
            if (debounceRef.current) clearTimeout(debounceRef.current);
            debounceRef.current = setTimeout(() => {
                decodeMask(newPoints);
            }, 150);
        },
        [activeTool, currentImage, segmentPoints, decodeMask]
    );

    const handleContextMenu = useCallback(
        (e) => {
            if (activeTool === 'segment') {
                e.preventDefault();
                handleCanvasClick(e);
            }
        },
        [activeTool, handleCanvasClick]
    );

    // Confirm segment
    const handleConfirm = useCallback(() => {
        if (!currentMask || !currentImage || !imgRef.current) return;

        const img = imgRef.current;
        const c = new OffscreenCanvas(img.width, img.height);
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);

        const result = extractMaskedRegion(imageData, currentMask);
        if (result) {
            // Convert to canvas data URL for the thumbnail
            const thumbCanvas = new OffscreenCanvas(result.bounds.w, result.bounds.h);
            const thumbCtx = thumbCanvas.getContext('2d');
            thumbCtx.putImageData(result.imageData, 0, 0);

            addLayer({
                name: `Layer ${layers.length + 1}`,
                imageData: result.imageData,
                bounds: result.bounds,
                color: `hsl(${(layers.length * 60 + 120) % 360}, 60%, 55%)`,
            });
        }

        setSegmentPoints([]);
        clearMask();
    }, [currentMask, currentImage, extractMaskedRegion, addLayer, layers.length, clearMask]);

    // Reset points
    const handleReset = useCallback(() => {
        setSegmentPoints([]);
        clearMask();
    }, [clearMask]);

    // Handle file drop
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFile(file);
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleFileInput = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    }, []);

    const handleFile = (file) => {
        const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
        if (!validTypes.includes(file.type)) return;
        if (file.size > 20 * 1024 * 1024) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                setImage({
                    src: e.target.result,
                    width: img.width,
                    height: img.height,
                    fileName: file.name,
                    fileSize: file.size,
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    return (
        <div
            className="relative flex-1 h-full overflow-hidden bg-px-bg"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
        >
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
                onClick={handleCanvasClick}
                onContextMenu={handleContextMenu}
            />

            {/* Upload zone (shown when no image) */}
            {!currentImage && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <label className="flex flex-col items-center gap-4 p-12 border-2 border-dashed border-px-border rounded-sm cursor-pointer hover:border-px-accent/50 transition-default group">
                        <div className="w-16 h-16 rounded-sm bg-px-surface flex items-center justify-center border border-px-border group-hover:border-px-accent/30 transition-default">
                            <ImagePlus
                                size={28}
                                className="text-px-text-muted group-hover:text-px-accent transition-default"
                            />
                        </div>
                        <div className="text-center">
                            <p className="font-mono text-sm text-px-text mb-1">
                                Drop image here
                            </p>
                            <p className="font-body text-xs text-px-text-muted">
                                PNG, JPEG, WEBP — max 20MB
                            </p>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-px-accent/10 text-px-accent font-mono text-xs rounded-sm border border-px-accent/20">
                            <Upload size={14} />
                            Browse files
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept=".png,.jpg,.jpeg,.webp"
                            onChange={handleFileInput}
                        />
                    </label>
                </div>
            )}

            {/* Segmentation controls */}
            {currentImage && activeTool === 'segment' && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 bg-px-surface/95 backdrop-blur border border-px-border rounded-sm shadow-xl">
                    {isMasking && (
                        <div className="flex items-center gap-2 px-3 text-px-text-muted">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="font-mono text-[11px]">Processing...</span>
                        </div>
                    )}
                    <span className="font-mono text-[11px] text-px-text-muted px-2">
                        {segmentPoints.length} point{segmentPoints.length !== 1 ? 's' : ''}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={RotateCcw}
                        onClick={handleReset}
                        disabled={segmentPoints.length === 0}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        icon={Check}
                        onClick={handleConfirm}
                        disabled={!currentMask}
                    >
                        Confirm Segment
                    </Button>
                </div>
            )}

            {/* Encoding indicator */}
            {isEncoding && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-px-surface/95 backdrop-blur border border-px-border rounded-sm">
                    <Loader2 size={14} className="animate-spin text-px-accent" />
                    <span className="font-mono text-[11px] text-px-text-muted">
                        Encoding image for AI segmentation...
                    </span>
                </div>
            )}
        </div>
    );
}
