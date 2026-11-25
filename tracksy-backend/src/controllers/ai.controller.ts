import { Request, Response, NextFunction } from 'express';
import { GeminiService } from '../services/gemini.service.js';

export const getAiInsightsHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { expenses = [], subscriptions = [], totalBudget = 10000 } = req.body;
    const insights = await GeminiService.generateInsights(expenses, subscriptions, totalBudget);

    return res.json({
      success: true,
      insights,
    });
  } catch (error: any) {
    next(error);
  }
};

export const chatAiAdvisorHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { message, history = [], financialContext } = req.body;
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    try {
      const reply = await GeminiService.chatFinancialAdvisor(message, history, financialContext);
      return res.json({
        success: true,
        reply,
      });
    } catch (aiErr: any) {
      // Graceful fallback response if API key is not yet set
      const budget = financialContext?.overallBudget || 10000;
      const spent = financialContext?.grandTotal || 0;
      const remaining = Math.max(0, budget - spent);

      return res.json({
        success: true,
        reply: `You've spent ₹${spent.toLocaleString('en-IN')} of your ₹${budget.toLocaleString('en-IN')} budget (₹${remaining.toLocaleString('en-IN')} remaining). Setting category caps on dining and entertainment will keep your balance strong.`,
        note: 'Fallback analytical response (configure GEMINI_API_KEY for dynamic generative chat).',
      });
    }
  } catch (error: any) {
    next(error);
  }
};
