export type ExpenseCategory =
  | 'Food'
  | 'Transport'
  | 'Shopping'
  | 'Bills'
  | 'Entertainment'
  | 'Health'
  | 'Travel'
  | 'Other';

export interface ExpenseItem {
  id: string;
  amount: number;
  category: ExpenseCategory;
  merchant: string;
  note?: string;
  date: string;
  location?: string;
  isSubscription?: boolean;
}

export interface ReceiptScanResult {
  merchant: string;
  amount: number;
  category: ExpenseCategory | string;
  note?: string;
  date?: string;
}

export interface VoiceParseResult {
  amount: number;
  category: ExpenseCategory | string;
  merchant?: string;
  note?: string;
}

export interface FinancialContext {
  overallBudget?: number;
  grandTotal?: number;
  categoryTotals?: Record<string, number>;
  subscriptions?: any[];
  recentTransactions?: any[];
}
