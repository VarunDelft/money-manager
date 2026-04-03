import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionList from '../../../src/components/transactions/TransactionList';

const mockTransactions = [
  {
    id: 1,
    type: 'expense' as const,
    title: 'Weekly groceries',
    date: '2026-03-27',
    time: '14:30',
    amount: 45.99,
    currency: 'USD',
    shortDescription: 'Supermarket run',
    detailedDescription: null,
    category: { id: 1, name: 'Groceries' },
    tags: ['weekly', 'food'],
    recurringRuleId: null,
    createdAt: '2026-03-27T14:35:00.000Z',
    updatedAt: '2026-03-27T14:35:00.000Z',
  },
  {
    id: 2,
    type: 'income' as const,
    title: 'Freelance payment',
    date: '2026-03-28',
    time: null,
    amount: 500.00,
    currency: 'USD',
    shortDescription: 'Web dev project',
    detailedDescription: null,
    category: { id: 8, name: 'Freelance' },
    tags: [],
    recurringRuleId: null,
    createdAt: '2026-03-28T10:00:00.000Z',
    updatedAt: '2026-03-28T10:00:00.000Z',
  },
];

describe('TransactionList', () => {
  it('should render transaction items', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        hasMore={false}
        onLoadMore={() => {}}
      />
    );

    expect(screen.getByText('Weekly groceries')).toBeInTheDocument();
    expect(screen.getByText('Freelance payment')).toBeInTheDocument();
  });

  it('should display amount and currency for each transaction', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        hasMore={false}
        onLoadMore={() => {}}
      />
    );

    expect(screen.getByText(/45\.99/)).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument();
    expect(screen.getAllByText(/USD/).length).toBeGreaterThanOrEqual(1);
  });

  it('should display category badges', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        hasMore={false}
        onLoadMore={() => {}}
      />
    );

    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Freelance')).toBeInTheDocument();
  });

  it('should show empty state when no transactions', () => {
    render(
      <TransactionList
        transactions={[]}
        hasMore={false}
        onLoadMore={() => {}}
      />
    );

    expect(
      screen.getByText(/no transactions/i)
    ).toBeInTheDocument();
  });

  it('should show load more button when hasMore is true', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        hasMore={true}
        onLoadMore={() => {}}
      />
    );

    expect(
      screen.getByRole('button', { name: /load more/i })
    ).toBeInTheDocument();
  });

  it('should not show load more button when hasMore is false', () => {
    render(
      <TransactionList
        transactions={mockTransactions}
        hasMore={false}
        onLoadMore={() => {}}
      />
    );

    expect(
      screen.queryByRole('button', { name: /load more/i })
    ).not.toBeInTheDocument();
  });
});
