---
name: Export Engine
description: VTracer WASM vectorization, ag-psd PSD export, Figma JSON schema, Web Worker patterns, and file download for PIXLAYER
---

# Export Engine

## SVG Export (VTracer WASM)

### Web Worker Setup
```js
// client/src/lib/vtracerWorker.js
import init, { trace } from 'vtracer';

self.onmessage = async (e) => {
  const { imageData, width, height, options } = e.data;
  try {
    await init(); // Load WASM
    const svg = trace(imageData, { ...options, width, height });
    self.postMessage({ success: true, svg });
  } catch (error) {
    self.postMessage({ success: false, error: error.message });
  }
};
```

### Multi-Layer SVG Composition
```js
function composeSVG(layers, width, height) {
  const svgParts = layers.map((layer, i) =>
    `<g id="layer-${i}" data-name="${layer.name}">${layer.svgContent}</g>`
  );

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  ${svgParts.join('\n  ')}
</svg>`;
}
```

### VTracer Options
```js
const defaultOptions = {
  colorMode: 'color',      // 'color' | 'grayscale' | 'binary'
  pathPrecision: 2,         // Draft=1, Balanced=2, High=3
  filterSpeckle: 4,         // Remove noise (pixels)
  colorPrecision: 6,        // Color clustering precision
  curveFitting: 'spline',   // 'pixel' | 'spline' | 'none'
};
```

## PSD Export (ag-psd)

### Export Function
```js
// client/src/lib/psdExporter.js
import { writePsd } from 'ag-psd';

/**
 * Export layers as a PSD file.
 * CRITICAL: Each layer canvas must be full image dimensions,
 * with content positioned at correct x/y offset.
 */
export function exportToPSD(layers, dimensions) {
  const { width, height } = dimensions;

  const children = layers.map((layer) => {
    // Create full-size canvas for each layer
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Position layer content at its bounds offset
    const tempCanvas = new OffscreenCanvas(layer.bounds.w, layer.bounds.h);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(layer.imageData, 0, 0);
    ctx.drawImage(tempCanvas, layer.bounds.x, layer.bounds.y);

    return {
      name: layer.name,
      hidden: !layer.visible,
      canvas: canvas,
    };
  });

  const psd = {
    width,
    height,
    channels: 4,
    bitsPerChannel: 8,
    colorMode: 1, // RGB
    children,
  };

  const buffer = writePsd(psd);
  return buffer; // ArrayBuffer
}
```

### Download Trigger
```js
function downloadFile(buffer, filename, mimeType) {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Usage
downloadFile(psdBuffer, 'project.psd', 'application/octet-stream');
downloadFile(new TextEncoder().encode(svgString), 'project.svg', 'image/svg+xml');
```

## Figma JSON Export

### Schema
```json
{
  "version": "1.0",
  "pixlayer_export": true,
  "canvas": { "width": 1920, "height": 1080 },
  "nodes": [
    {
      "id": "node-0",
      "type": "IMAGE",
      "name": "Background",
      "x": 0, "y": 0,
      "width": 1920, "height": 1080,
      "imageData": "<base64 PNG>"
    }
  ]
}
```

### Generator Function
```js
// client/src/lib/figmaExporter.js
export function generateFigmaJSON(layers, dimensions) {
  const nodes = layers.map((layer, i) => {
    // Convert layer imageData to base64 PNG
    const canvas = new OffscreenCanvas(layer.bounds.w, layer.bounds.h);
    const ctx = canvas.getContext('2d');
    ctx.putImageData(layer.imageData, 0, 0);

    return {
      id: `node-${i}`,
      type: 'IMAGE',
      name: layer.name,
      x: layer.bounds.x,
      y: layer.bounds.y,
      width: layer.bounds.w,
      height: layer.bounds.h,
      imageData: canvas.convertToBlob({ type: 'image/png' }),
    };
  });

  return {
    version: '1.0',
    pixlayer_export: true,
    canvas: dimensions,
    nodes,
  };
}
```

## Figma Plugin Structure
```
figma-plugin/
├── manifest.json    # Plugin metadata
├── ui.html          # Dark upload UI
└── code.js          # Import logic using Figma API
```

### Plugin Code Pattern
```js
// figma-plugin/code.js
figma.showUI(__html__, { width: 400, height: 300 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    const data = JSON.parse(msg.json);
    for (const node of data.nodes) {
      const bytes = Uint8Array.from(atob(node.imageData), c => c.charCodeAt(0));
      const image = figma.createImage(bytes);
      const rect = figma.createRectangle();
      rect.name = node.name;
      rect.x = node.x;
      rect.y = node.y;
      rect.resize(node.width, node.height);
      rect.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
      figma.currentPage.appendChild(rect);
    }
    figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
    figma.closePlugin('Import complete!');
  }
};
```

## Export Modal UI Pattern
Three tabs: **SVG** | **PSD** | **Figma**
Each tab shows:
- Layer count badge
- Format-specific options
- Estimated file size
- Primary export button
- For Figma: download JSON + plugin instructions
