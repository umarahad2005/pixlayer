import { useState, useCallback, useRef } from 'react';
import * as ort from 'onnxruntime-web';

const MODEL_BASE = '/models';
const INPUT_SIZE = 1024;

export function useSegmentation() {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [isEncoding, setIsEncoding] = useState(false);
    const [isMasking, setIsMasking] = useState(false);
    const [currentMask, setCurrentMask] = useState(null);
    const [modelError, setModelError] = useState(null);

    const encoderRef = useRef(null);
    const decoderRef = useRef(null);
    const embeddingRef = useRef(null);
    const originalSizeRef = useRef({ w: 0, h: 0 });

    // ─────────── Load SAM 2 ONNX Models ───────────
    const loadModel = useCallback(async () => {
        if (isModelLoaded) return;
        try {
            // Try WebGPU first, fall back to WASM
            let executionProviders;
            try {
                executionProviders = ['webgpu'];
                const testSession = await ort.InferenceSession.create(
                    `${MODEL_BASE}/sam2_hiera_base_plus_encoder.onnx`,
                    { executionProviders }
                );
                encoderRef.current = testSession;
            } catch {
                console.warn('WebGPU unavailable, falling back to WASM');
                executionProviders = ['wasm'];
                ort.env.wasm.numThreads = navigator.hardwareConcurrency || 4;
                ort.env.wasm.simd = true;
                ort.env.wasm.wasmPaths = '/';
                encoderRef.current = await ort.InferenceSession.create(
                    `${MODEL_BASE}/sam2_hiera_base_plus_encoder.onnx`,
                    { executionProviders }
                );
            }

            decoderRef.current = await ort.InferenceSession.create(
                `${MODEL_BASE}/decoder.onnx`,
                { executionProviders }
            );

            setIsModelLoaded(true);
            setModelError(null);
            console.log('SAM 2 models loaded via', executionProviders[0]);
        } catch (err) {
            console.error('Failed to load SAM 2 models:', err);
            setModelError(
                'Failed to load AI model. Ensure model files are in /public/models/'
            );
        }
    }, [isModelLoaded]);

    // ─────────── Encode Image → Embedding ───────────
    const encodeImage = useCallback(async (imageData, width, height) => {
        if (!encoderRef.current) return null;
        setIsEncoding(true);

        try {
            originalSizeRef.current = { w: width, h: height };

            // Resize to 1024x1024 and normalize to Float32 [1, 3, 1024, 1024]
            const canvas = new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(
                await createImageBitmap(imageData),
                0, 0, INPUT_SIZE, INPUT_SIZE
            );
            const resized = ctx.getImageData(0, 0, INPUT_SIZE, INPUT_SIZE);

            const float32 = new Float32Array(3 * INPUT_SIZE * INPUT_SIZE);
            const mean = [0.485, 0.456, 0.406];
            const std = [0.229, 0.224, 0.225];

            for (let i = 0; i < INPUT_SIZE * INPUT_SIZE; i++) {
                float32[i] = (resized.data[i * 4] / 255 - mean[0]) / std[0]; // R
                float32[INPUT_SIZE * INPUT_SIZE + i] = (resized.data[i * 4 + 1] / 255 - mean[1]) / std[1]; // G
                float32[2 * INPUT_SIZE * INPUT_SIZE + i] = (resized.data[i * 4 + 2] / 255 - mean[2]) / std[2]; // B
            }

            const inputTensor = new ort.Tensor('float32', float32, [1, 3, INPUT_SIZE, INPUT_SIZE]);
            const results = await encoderRef.current.run({ image: inputTensor });
            const embeddingKey = Object.keys(results)[0];
            embeddingRef.current = results[embeddingKey];

            setIsEncoding(false);
            return embeddingRef.current;
        } catch (err) {
            console.error('Encoding failed:', err);
            setIsEncoding(false);
            return null;
        }
    }, []);

    // ─────────── Decode Mask from Points ───────────
    const decodeMask = useCallback(async (points) => {
        if (!decoderRef.current || !embeddingRef.current) return null;
        if (points.length === 0) return null;
        setIsMasking(true);

        try {
            const { w, h } = originalSizeRef.current;

            // Normalize point coordinates to 1024x1024 space
            const coords = new Float32Array(points.length * 2);
            const labels = new Float32Array(points.length);

            points.forEach((pt, i) => {
                coords[i * 2] = (pt.x / w) * INPUT_SIZE;
                coords[i * 2 + 1] = (pt.y / h) * INPUT_SIZE;
                labels[i] = pt.label; // 1=positive, 0=negative
            });

            const coordsTensor = new ort.Tensor('float32', coords, [1, points.length, 2]);
            const labelsTensor = new ort.Tensor('float32', labels, [1, points.length]);
            const maskInput = new ort.Tensor('float32', new Float32Array(256 * 256).fill(0), [1, 1, 256, 256]);
            const hasMask = new ort.Tensor('float32', new Float32Array([0]), [1]);
            const origSize = new ort.Tensor('float32', new Float32Array([h, w]), [2]);

            const feeds = {
                image_embeddings: embeddingRef.current,
                point_coords: coordsTensor,
                point_labels: labelsTensor,
                mask_input: maskInput,
                has_mask_input: hasMask,
                orig_im_size: origSize,
            };

            const results = await decoderRef.current.run(feeds);
            const maskKey = Object.keys(results).find((k) => k.includes('mask')) || Object.keys(results)[0];
            const maskData = results[maskKey].data;

            // Convert raw mask values to binary mask (threshold at 0)
            const maskWidth = Math.round(Math.sqrt(maskData.length));
            const maskHeight = maskWidth;
            const binaryMask = new Uint8Array(maskData.length);
            for (let i = 0; i < maskData.length; i++) {
                binaryMask[i] = maskData[i] > 0 ? 1 : 0;
            }

            const mask = { data: binaryMask, width: maskWidth, height: maskHeight };
            setCurrentMask(mask);
            setIsMasking(false);
            return mask;
        } catch (err) {
            console.error('Mask decoding failed:', err);
            setIsMasking(false);
            return null;
        }
    }, []);

    // ─────────── Extract Masked Region ───────────
    const extractMaskedRegion = useCallback((imageData, mask) => {
        if (!mask) return null;

        const { width: imgW, height: imgH } = imageData;
        const { data: maskData, width: maskW, height: maskH } = mask;

        // Scale mask to image dimensions
        const scaleX = maskW / imgW;
        const scaleY = maskH / imgH;

        // Find bounding box
        let minX = imgW, minY = imgH, maxX = 0, maxY = 0;
        for (let y = 0; y < imgH; y++) {
            for (let x = 0; x < imgW; x++) {
                const mx = Math.floor(x * scaleX);
                const my = Math.floor(y * scaleY);
                if (maskData[my * maskW + mx] === 1) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (minX >= maxX || minY >= maxY) return null;

        const bw = maxX - minX + 1;
        const bh = maxY - minY + 1;
        const extractCanvas = new OffscreenCanvas(bw, bh);
        const ctx = extractCanvas.getContext('2d');
        const extractedData = ctx.createImageData(bw, bh);

        for (let y = minY; y <= maxY; y++) {
            for (let x = minX; x <= maxX; x++) {
                const mx = Math.floor(x * scaleX);
                const my = Math.floor(y * scaleY);
                const srcIdx = (y * imgW + x) * 4;
                const dstIdx = ((y - minY) * bw + (x - minX)) * 4;

                if (maskData[my * maskW + mx] === 1) {
                    extractedData.data[dstIdx] = imageData.data[srcIdx];
                    extractedData.data[dstIdx + 1] = imageData.data[srcIdx + 1];
                    extractedData.data[dstIdx + 2] = imageData.data[srcIdx + 2];
                    extractedData.data[dstIdx + 3] = imageData.data[srcIdx + 3];
                } else {
                    extractedData.data[dstIdx + 3] = 0; // transparent
                }
            }
        }

        return {
            imageData: extractedData,
            bounds: { x: minX, y: minY, w: bw, h: bh },
        };
    }, []);

    const clearMask = useCallback(() => {
        setCurrentMask(null);
    }, []);

    return {
        isModelLoaded,
        isEncoding,
        isMasking,
        currentMask,
        modelError,
        loadModel,
        encodeImage,
        decodeMask,
        extractMaskedRegion,
        clearMask,
    };
}
