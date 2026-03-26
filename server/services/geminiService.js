import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Text-prompted object detection using Gemini Vision.
 * Returns bounding boxes that can be fed to local SAM 2 for precise masks.
 */
export async function detectObjects(imageBase64, textPrompt) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are an object detection model. Given the image and the text prompt, identify ALL objects matching the description.

Text prompt: "${textPrompt}"

Return a JSON array of detected objects. Each object should have:
- "label": string describing what was detected
- "bbox": [x1, y1, x2, y2] as normalized coordinates (0.0 to 1.0 relative to image dimensions)
- "confidence": number from 0 to 1
- "center": [cx, cy] as normalized coordinates (0.0 to 1.0) — the center point of the object

Return ONLY valid JSON, no markdown. Example:
[{"label": "person", "bbox": [0.1, 0.2, 0.5, 0.8], "confidence": 0.95, "center": [0.3, 0.5]}]

If no objects match, return an empty array: []`;

    // Strip the data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const result = await model.generateContent([
        prompt,
        {
            inlineData: {
                mimeType: 'image/png',
                data: base64Data,
            },
        },
    ]);

    const text = result.response.text().trim();

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = text;
    if (text.includes('```')) {
        jsonStr = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    }

    try {
        const detections = JSON.parse(jsonStr);
        return Array.isArray(detections) ? detections : [];
    } catch {
        console.error('Failed to parse Gemini detection response:', text);
        return [];
    }
}

/**
 * AI Image Inpainting using Gemini's image editing capabilities.
 * Takes an image and a mask, fills the masked region intelligently.
 */
export async function inpaintImage(imageBase64, maskBase64, prompt = '') {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const inpaintPrompt = prompt
        ? `Edit this image: fill the masked/transparent area with: ${prompt}. Keep the rest of the image unchanged. Make the fill seamless and natural.`
        : `Edit this image: intelligently fill the masked/transparent area with a clean, seamless background that matches the surrounding context. Remove any artifacts.`;

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const maskData = maskBase64.replace(/^data:image\/\w+;base64,/, '');

    const result = await model.generateContent([
        inpaintPrompt,
        {
            inlineData: {
                mimeType: 'image/png',
                data: base64Data,
            },
        },
        {
            inlineData: {
                mimeType: 'image/png',
                data: maskData,
            },
        },
    ]);

    // Gemini may return text description or image
    // For image editing, we handle the response
    const response = result.response;
    const parts = response.candidates?.[0]?.content?.parts || [];

    // Check if response contains image data
    for (const part of parts) {
        if (part.inlineData) {
            return {
                imageBase64: `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`,
                success: true,
            };
        }
    }

    // If no image returned, return a description
    return {
        description: response.text(),
        success: false,
        message: 'Gemini returned text instead of image. Use the description as guidance.',
    };
}

/**
 * Generate a description of what should fill a removed area.
 * Useful as a fallback when direct image generation isn't available.
 */
export async function describeInpaintFill(imageBase64, textPrompt) {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const result = await model.generateContent([
        `Looking at this image, if I were to remove "${textPrompt}", describe in detail what the background behind it would look like. Be very specific about colors, textures, and patterns.`,
        {
            inlineData: {
                mimeType: 'image/png',
                data: base64Data,
            },
        },
    ]);

    return result.response.text();
}
