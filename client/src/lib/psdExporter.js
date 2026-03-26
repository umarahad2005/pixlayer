/**
 * PSD Exporter using ag-psd
 * Creates Photoshop files with named, positioned layers
 */
import { writePsd } from 'ag-psd';

export async function exportPsd(layers, imageWidth, imageHeight) {
    // Build PSD structure
    const psdLayers = [];

    for (const layer of layers) {
        if (!layer.imageData) continue;

        const { imageData, bounds, name, visible } = layer;

        // CRITICAL: Each layer canvas MUST be full image dimensions
        // Position content at correct offset on transparent canvas
        const fullCanvas = new OffscreenCanvas(imageWidth, imageHeight);
        const ctx = fullCanvas.getContext('2d');
        ctx.putImageData(imageData, bounds.x, bounds.y);

        // Get full canvas as ImageData
        const fullImageData = ctx.getImageData(0, 0, imageWidth, imageHeight);

        psdLayers.push({
            name: name || 'Layer',
            hidden: !visible,
            canvas: imageDataToCanvas(fullImageData, imageWidth, imageHeight),
            left: 0,
            top: 0,
        });
    }

    const psd = {
        width: imageWidth,
        height: imageHeight,
        children: psdLayers,
    };

    const buffer = writePsd(psd);
    return buffer;
}

export function downloadPsd(buffer, filename = 'pixlayer-export.psd') {
    const blob = new Blob([buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function imageDataToCanvas(imageData, width, height) {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);
    return canvas;
}
