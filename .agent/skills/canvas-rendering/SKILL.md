---
name: Canvas Rendering
description: HTML5 Canvas patterns including DPI scaling, checkerboard, image drawing, mask overlays, zoom/pan, and layer compositing for PIXLAYER
---

# Canvas Rendering

## Canvas Initialization (DPI-Aware)
```js
function initCanvas(canvasEl, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvasEl.width = width * dpr;
  canvasEl.height = height * dpr;
  canvasEl.style.width = `${width}px`;
  canvasEl.style.height = `${height}px`;
  const ctx = canvasEl.getContext('2d');
  ctx.scale(dpr, dpr);
  return ctx;
}
```

## Checkerboard Transparency Pattern
```js
function drawCheckerboard(ctx, width, height, size = 8) {
  const colors = ['#1a1a1e', '#222226']; // Dark theme checkerboard
  for (let y = 0; y < height; y += size) {
    for (let x = 0; x < width; x += size) {
      ctx.fillStyle = colors[(Math.floor(x / size) + Math.floor(y / size)) % 2];
      ctx.fillRect(x, y, size, size);
    }
  }
}
```

## Image Drawing
```js
function drawImageOnCanvas(ctx, imageSrc, canvasWidth, canvasHeight) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Calculate fit-to-canvas scaling
      const scale = Math.min(canvasWidth / img.width, canvasHeight / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (canvasWidth - w) / 2;
      const y = (canvasHeight - h) / 2;

      ctx.drawImage(img, x, y, w, h);
      resolve({ x, y, w, h, scale });
    };
    img.src = imageSrc;
  });
}
```

## Mask Overlay Rendering
```js
/**
 * Render SAM2 mask as semi-transparent indigo overlay.
 * @param {CanvasRenderingContext2D} ctx
 * @param {ImageData} maskData - Binary mask (255 = masked)
 * @param {string} color - Overlay color (default: #6C63FF)
 * @param {number} opacity - 0 to 1 (default: 0.4)
 */
function drawMaskOverlay(ctx, maskData, color = '#6C63FF', opacity = 0.4) {
  const { width, height, data } = maskData;
  const overlay = ctx.createImageData(width, height);

  // Parse hex color
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);

  for (let i = 0; i < data.length; i += 4) {
    if (data[i] > 128) { // Mask threshold
      overlay.data[i]     = r;
      overlay.data[i + 1] = g;
      overlay.data[i + 2] = b;
      overlay.data[i + 3] = Math.round(opacity * 255);
    }
  }

  ctx.putImageData(overlay, 0, 0);
}
```

## Point Markers (SAM Prompting)
```js
/**
 * Draw click point markers on canvas.
 * Green = positive (include), Red = negative (exclude)
 */
function drawPointMarker(ctx, x, y, isPositive) {
  const color = isPositive ? '#22C55E' : '#EF4444';
  const radius = 6;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.closePath();
}
```

## Zoom & Pan
```js
class CanvasViewport {
  constructor() {
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.minScale = 0.1;
    this.maxScale = 4.0;
  }

  zoom(delta, mouseX, mouseY) {
    const factor = delta > 0 ? 1.1 : 0.9;
    const newScale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));

    // Zoom toward mouse position
    this.offsetX = mouseX - (mouseX - this.offsetX) * (newScale / this.scale);
    this.offsetY = mouseY - (mouseY - this.offsetY) * (newScale / this.scale);
    this.scale = newScale;
  }

  pan(dx, dy) {
    this.offsetX += dx;
    this.offsetY += dy;
  }

  zoomToFit(imageWidth, imageHeight, canvasWidth, canvasHeight) {
    this.scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight) * 0.9;
    this.offsetX = (canvasWidth - imageWidth * this.scale) / 2;
    this.offsetY = (canvasHeight - imageHeight * this.scale) / 2;
  }

  applyTransform(ctx) {
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
  }

  screenToCanvas(screenX, screenY) {
    return {
      x: (screenX - this.offsetX) / this.scale,
      y: (screenY - this.offsetY) / this.scale,
    };
  }
}
```

## Layer Compositing
```js
/**
 * Composite all visible layers onto the canvas.
 * Draws bottom-to-top (first layer = bottom).
 */
function compositeLayers(ctx, layers, viewport) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();

  viewport.applyTransform(ctx);

  // Draw checkerboard first
  drawCheckerboard(ctx, imageWidth, imageHeight);

  // Draw each visible layer
  layers.filter(l => l.visible).forEach((layer) => {
    const tempCanvas = new OffscreenCanvas(layer.bounds.w, layer.bounds.h);
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.putImageData(layer.imageData, 0, 0);
    ctx.drawImage(tempCanvas, layer.bounds.x, layer.bounds.y);
  });
}
```

## Render Loop Pattern
```js
function useCanvasRenderLoop(canvasRef, layers, viewport) {
  useEffect(() => {
    let animationId;
    const render = () => {
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) compositeLayers(ctx, layers, viewport);
      animationId = requestAnimationFrame(render);
    };
    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [layers, viewport]);
}
```
