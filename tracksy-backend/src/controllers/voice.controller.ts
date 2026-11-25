import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/gemini.service.js';

export const parseVoiceHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({
        success: false,
        error: 'Transcript is required',
      });
    }

    const data = await GeminiService.parseVoiceExpense(transcript);

    return res.json({
      success: true,
      data,
    });
  } catch (error: any) {
    next(error);
  }
};
