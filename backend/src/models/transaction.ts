export interface Transaction {
  id: number;
  type: 'expense' | 'income';
  title: string;
  date: string;
  time: string | null;
  amount: number;
  currency: string;
  shortDescription: string;
  detailedDescription: string | null;
  category: { id: number; name: string };
  tags: string[];
  recurringRuleId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionInput {
  type: 'expense' | 'income';
  title: string;
  date: string;
  time?: string;
  amount: number;
  currency: string;
  shortDescription: string;
  detailedDescription?: string;
  categoryId: number;
  tags?: string[];
}

export interface UpdateTransactionInput {
  type?: 'expense' | 'income';
  title?: string;
  date?: string;
  time?: string | null;
  amount?: number;
  currency?: string;
  shortDescription?: string;
  detailedDescription?: string | null;
  categoryId?: number;
  tags?: string[];
}

export interface TransactionFilters {
  type?: 'expense' | 'income';
  categoryId?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}
