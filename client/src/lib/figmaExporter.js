/**
 * Figma JSON Exporter
 * Creates a JSON file compatible with the PIXLAYER Figma Plugin
 */

export async function exportFigmaJson(layers, imageWidth, imageHeight, projectName = 'PIXLAYER Export') {
    const figmaLayers = [];

    for (const layer of layers) {
        if (!layer.imageData) continue;

        const { imageData, bounds, name, visible } = layer;

        // Convert imageData to base64 PNG
        const canvas = new OffscreenCanvas(bounds.w, bounds.h);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        const base64 = await blobToBase64(blob);

        figmaLayers.push({
            name: name || 'Layer',
            visible: visible !== false,
            x: bounds.x,
            y: bounds.y,
            width: bounds.w,
            height: bounds.h,
            imageBase64: base64,
        });
    }

    const figmaJson = {
        version: '1.0',
        generator: 'PIXLAYER',
        exportedAt: new Date().toISOString(),
        canvas: {
            width: imageWidth,
            height: imageHeight,
        },
        projectName,
        layers: figmaLayers,
    };

    return figmaJson;
}

export function downloadFigmaJson(json, filename = 'pixlayer-export.json') {
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function blobToBase64(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}
