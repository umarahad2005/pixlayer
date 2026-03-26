import { Router } from 'express';
import { z } from 'zod';
import Project from '../models/Project.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = Router();

// Get user's projects
router.get('/', authMiddleware, async (req, res) => {
    try {
        const projects = await Project.find({ userId: req.user.id })
            .sort({ updatedAt: -1 })
            .select('-layers')
            .lean();
        res.json(projects);
    } catch (err) {
        console.error('Get projects error:', err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Create project
router.post('/', authMiddleware, async (req, res) => {
    try {
        const project = await Project.create({
            userId: req.user.id,
            name: req.body.name || 'Untitled Project',
        });
        res.status(201).json(project);
    } catch (err) {
        console.error('Create project error:', err);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Update project (auto-save)
router.patch('/:id', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            { $set: req.body },
            { new: true }
        );
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.json(project);
    } catch (err) {
        console.error('Update project error:', err);
        res.status(500).json({ error: 'Failed to update project' });
    }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const project = await Project.findOneAndDelete({
            _id: req.params.id,
            userId: req.user.id,
        });
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        res.status(204).send();
    } catch (err) {
        console.error('Delete project error:', err);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

export default router;
