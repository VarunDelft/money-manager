export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  isDefault: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}

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

export interface RecurringRule {
  id: number;
  type: 'expense' | 'income';
  title: string;
  amount: number;
  currency: string;
  shortDescription: string;
  detailedDescription: string | null;
  category: { id: number; name: string };
  intervalUnit: 'day' | 'week' | 'month' | 'year';
  frequency: number;
  startDate: string;
  dayOfMonth: number | null;
  nextOccurrenceDate: string;
  lastGeneratedDate: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: number;
  name: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

export interface ApiResponse<T> {
  data: T;
}

export interface StatisticsSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  currency: string;
}

export interface CategoryBreakdownItem {
  categoryId: number;
  categoryName: string;
  total: number;
  percentage: number;
  type: 'expense' | 'income';
  currency?: string;
}

export interface StatisticsData {
  period: {
    granularity: string;
    startDate: string;
    endDate: string;
    label: string;
  };
  summary: StatisticsSummary | null;
  summaryByCurrency?: StatisticsSummary[];
  currencies?: string[];
  categoryBreakdown: CategoryBreakdownItem[];
  message?: string;
}
