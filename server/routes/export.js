import { Router } from 'express';

const router = Router();

router.post('/', async (req, res) => {
    // TODO: Phase 4 — server-side export if needed
    res.json({ message: 'Export endpoint ready', format: req.body.format });
});

export default router;
