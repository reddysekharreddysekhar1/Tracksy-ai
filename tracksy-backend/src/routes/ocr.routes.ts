import { Router } from 'express';
import { scanReceiptHandler } from '../controllers/ocr.controller.js';

const router = Router();

// POST /api/ocr/scan or /api/scan-receipt
router.post('/scan', scanReceiptHandler);

export default router;
