import { Router } from 'express';
import {
  getExpensesHandler,
  createExpenseHandler,
} from '../controllers/expense.controller.js';

const router = Router();

router.get('/', getExpensesHandler);
router.post('/', createExpenseHandler);

export default router;
