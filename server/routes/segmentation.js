import { Router } from 'express';
import { z } from 'zod';
import { detectObjects, inpaintImage, describeInpaintFill } from '../services/geminiService.js';

const router = Router();

const textSegmentSchema = z.object({
    imageBase64: z.string().min(1),
    prompt: z.string().min(1).max(200),
});

const inpaintSchema = z.object({
    imageBase64: z.string().min(1),
    maskBase64: z.string().min(1),
    prompt: z.string().max(500).optional(),
});

// Text-prompted object detection (Gemini → bounding boxes → client-side SAM 2)
router.post('/text', async (req, res) => {
    try {
        const { imageBase64, prompt } = textSegmentSchema.parse(req.body);
        const detections = await detectObjects(imageBase64, prompt);
        res.json({ detections });
    } catch (err) {
        if (err.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: err.errors });
        }
        console.error('Detection error:', err);
        res.status(500).json({ error: 'Object detection failed' });
    }
});

// AI Inpainting (Gemini image editing)
router.post('/inpaint', async (req, res) => {
    try {
        const { imageBase64, maskBase64, prompt } = inpaintSchema.parse(req.body);
        const result = await inpaintImage(imageBase64, maskBase64, prompt);
        res.json(result);
    } catch (err) {
        if (err.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: err.errors });
        }
        console.error('Inpaint error:', err);
        res.status(500).json({ error: 'Inpainting failed' });
    }
});

// Describe fill (text-based fallback)
router.post('/describe-fill', async (req, res) => {
    try {
        const { imageBase64, prompt } = textSegmentSchema.parse(req.body);
        const description = await describeInpaintFill(imageBase64, prompt);
        res.json({ description });
    } catch (err) {
        if (err.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: err.errors });
        }
        console.error('Describe fill error:', err);
        res.status(500).json({ error: 'Description failed' });
    }
});

export default router;
