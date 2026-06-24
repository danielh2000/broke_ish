export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  rawRow: Record<string, string>;
}

export type AppView = 'landing' | 'dashboard' | 'transactions' | 'budget';

export interface CategorySummary {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface BudgetEntry {
  category: string;
  limit: number;
}