import { Router } from 'express';
import {
  getGoogleAuthUrlHandler,
  googleAuthCallbackHandler,
} from '../controllers/auth.controller.js';

const router = Router();

router.get('/google/url', getGoogleAuthUrlHandler);
router.get('/google/callback', googleAuthCallbackHandler);

export default router;
