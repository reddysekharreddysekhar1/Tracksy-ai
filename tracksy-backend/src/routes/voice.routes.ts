import { Router } from 'express';
import { parseVoiceHandler } from '../controllers/voice.controller.js';

const router = Router();

// POST /api/voice/parse
router.post('/parse', parseVoiceHandler);

export default router;
