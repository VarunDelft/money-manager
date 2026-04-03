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
