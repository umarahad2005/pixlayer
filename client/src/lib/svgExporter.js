/**
 * SVG Exporter using VTracer WASM
 * Converts raster layers to vector SVG with <g> groups per layer
 */

const PRESETS = {
    Draft: { filterSpeckle: 8, colorPrecision: 4, pathPrecision: 3 },
    Balanced: { filterSpeckle: 4, colorPrecision: 6, pathPrecision: 5 },
    High: { filterSpeckle: 2, colorPrecision: 8, pathPrecision: 8 },
};

const CURVE_MODES = {
    Pixel: 'none',
    Spline: 'spline',
    None: 'polygon',
};

export async function exportSvg(layers, imageWidth, imageHeight, options = {}) {
    const {
        precision = 'Balanced',
        curveFitting = 'Spline',
        colorMode = 'Color',
    } = options;

    const preset = PRESETS[precision] || PRESETS.Balanced;

    // Build SVG manually from layers
    let svgGroups = '';

    for (const layer of layers) {
        if (!layer.visible || !layer.imageData) continue;

        const { imageData, bounds, name } = layer;
        const canvas = new OffscreenCanvas(bounds.w, bounds.h);
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);

        // Convert to data URL for VTracer
        const blob = await canvas.convertToBlob({ type: 'image/png' });
        const dataUrl = await blobToDataUrl(blob);

        // Try VTracer if available, otherwise embed raster
        let layerSvgContent;
        try {
            const vtracer = await import('vtracer');
            layerSvgContent = vtracer.trace(dataUrl, {
                colorMode: colorMode.toLowerCase(),
                filterSpeckle: preset.filterSpeckle,
                colorPrecision: preset.colorPrecision,
                pathPrecision: preset.pathPrecision,
                mode: CURVE_MODES[curveFitting] || 'spline',
            });
        } catch {
            // Fallback: embed as raster image in SVG
            layerSvgContent = `<image href="${dataUrl}" width="${bounds.w}" height="${bounds.h}" />`;
        }

        svgGroups += `  <g id="${sanitizeName(name)}" transform="translate(${bounds.x}, ${bounds.y})">\n`;
        svgGroups += `    ${layerSvgContent}\n`;
        svgGroups += `  </g>\n`;
    }

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${imageWidth} ${imageHeight}" width="${imageWidth}" height="${imageHeight}">
${svgGroups}</svg>`;

    return svg;
}

export function downloadSvg(svgString, filename = 'pixlayer-export.svg') {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    downloadBlob(blob, filename);
}

function sanitizeName(name) {
    return name.replace(/[^a-zA-Z0-9_-]/g, '_');
}

function blobToDataUrl(blob) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
