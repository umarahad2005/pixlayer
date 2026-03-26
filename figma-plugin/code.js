figma.showUI(__html__, { width: 320, height: 200 });

figma.ui.onmessage = async (msg) => {
    if (msg.type === 'import') {
        const { data } = msg;
        const { canvas, layers } = data;

        // Create frame
        const frame = figma.createFrame();
        frame.name = data.projectName || 'PIXLAYER Import';
        frame.resize(canvas.width, canvas.height);

        for (const layer of layers) {
            const rect = figma.createRectangle();
            rect.name = layer.name;
            rect.x = layer.x;
            rect.y = layer.y;
            rect.resize(layer.width, layer.height);

            // Decode base64 image
            if (layer.imageBase64) {
                try {
                    const response = await fetch(layer.imageBase64);
                    const buffer = await response.arrayBuffer();
                    const uint8 = new Uint8Array(buffer);
                    const image = figma.createImage(uint8);
                    rect.fills = [{ type: 'IMAGE', imageHash: image.hash, scaleMode: 'FILL' }];
                } catch {
                    rect.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
                }
            }

            rect.visible = layer.visible !== false;
            frame.appendChild(rect);
        }

        figma.currentPage.appendChild(frame);
        figma.viewport.scrollAndZoomIntoView([frame]);
        figma.notify(`Imported ${layers.length} layers from PIXLAYER`);
        figma.closePlugin();
    }
};
