import { Router } from 'express';
import authRoutes from './auth.routes.js';
import ocrRoutes from './ocr.routes.js';
import voiceRoutes from './voice.routes.js';
import aiRoutes from './ai.routes.js';
import expenseRoutes from './expense.routes.js';
import { scanReceiptHandler } from '../controllers/ocr.controller.js';
import { parseVoiceHandler } from '../controllers/voice.controller.js';
import { getAiInsightsHandler, chatAiAdvisorHandler } from '../controllers/ai.controller.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Tracksy Backend API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Modular Routes
router.use('/auth', authRoutes);
router.use('/ocr', ocrRoutes);
router.use('/voice', voiceRoutes);
router.use('/ai', aiRoutes);
router.use('/expenses', expenseRoutes);

// Direct compatibility aliases with frontend
router.post('/scan-receipt', scanReceiptHandler);
router.post('/voice-parse', parseVoiceHandler);
router.post('/ai-insights', getAiInsightsHandler);
router.post('/ai-chat', chatAiAdvisorHandler);

export default router;
