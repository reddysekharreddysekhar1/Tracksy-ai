import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/gemini.service.js';

export const scanReceiptHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', fileName = '' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Missing imageBase64 payload',
      });
    }

    const { result, engine } = await GeminiService.scanReceiptOCR(
      imageBase64,
      mimeType,
      fileName
    );

    return res.json({
      success: true,
      data: result,
      engine,
    });
  } catch (error: any) {
    next(error);
  }
};
