import { Request, Response } from 'express';
import { ExpenseItem } from '../types/index.js';

// In-memory sample data store (can be replaced with Firestore, PostgreSQL, or MongoDB)
const sampleExpenses: ExpenseItem[] = [
  {
    id: 'exp-1',
    amount: 540,
    category: 'Food',
    merchant: 'Blue Tokai Coffee',
    note: 'Coffee & croissant with design team',
    date: new Date().toISOString().split('T')[0],
    location: 'Indiranagar, Bengaluru',
  },
  {
    id: 'exp-2',
    amount: 1200,
    category: 'Shopping',
    merchant: 'Zara Fashion',
    note: 'Summer linen shirt',
    date: new Date().toISOString().split('T')[0],
    location: 'Nexus Mall',
  },
];

export const getExpensesHandler = (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: sampleExpenses,
    count: sampleExpenses.length,
  });
};

export const createExpenseHandler = (req: Request, res: Response) => {
  const { amount, category, merchant, note, location, isSubscription } = req.body;

  if (!amount || !category) {
    return res.status(400).json({
      success: false,
      error: 'Amount and category are required.',
    });
  }

  const newExpense: ExpenseItem = {
    id: `exp-${Date.now()}`,
    amount: Number(amount),
    category,
    merchant: merchant || 'General Merchant',
    note: note || '',
    date: new Date().toISOString().split('T')[0],
    location: location || '',
    isSubscription: !!isSubscription,
  };

  sampleExpenses.unshift(newExpense);

  return res.status(201).json({
    success: true,
    data: newExpense,
  });
};
