import { Router } from 'express';
import {
  getAiInsightsHandler,
  chatAiAdvisorHandler,
} from '../controllers/ai.controller.js';

const router = Router();

router.post('/insights', getAiInsightsHandler);
router.post('/chat', chatAiAdvisorHandler);

export default router;
