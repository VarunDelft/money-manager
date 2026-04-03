import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditTransactionPage from '../../../src/pages/EditTransactionPage';

jest.mock('../../../src/services/api', () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

import { get, put } from '../../../src/services/api';

const mockTransaction = {
  id: 1,
  type: 'expense',
  title: 'Groceries',
  date: '2026-03-27',
  time: '14:30',
  amount: 45.99,
  currency: 'USD',
  shortDescription: 'Supermarket run',
  detailedDescription: null,
  category: { id: 1, name: 'Groceries' },
  tags: ['weekly'],
  recurringRuleId: null,
  createdAt: '2026-03-27T14:35:00.000Z',
  updatedAt: '2026-03-27T14:35:00.000Z',
};

const mockCategories = [
  { id: 1, name: 'Groceries', subcategories: [] },
  { id: 2, name: 'Salary', subcategories: [] },
];

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/transactions/1/edit']}>
      <Routes>
        <Route path="/transactions/:id/edit" element={<EditTransactionPage />} />
        <Route path="/transactions" element={<div>Transaction List</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('EditTransactionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockImplementation((url: string) => {
      if (url.includes('/transactions/')) return Promise.resolve({ data: mockTransaction });
      if (url.includes('/categories')) return Promise.resolve({ data: mockCategories });
      return Promise.resolve({});
    });
    (put as jest.Mock).mockResolvedValue({ data: mockTransaction });
  });

  it('should load and display existing transaction data', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Groceries')).toBeInTheDocument();
    });

    expect(screen.getByDisplayValue('45.99')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Supermarket run')).toBeInTheDocument();
  });

  it('should submit updated data on save', async () => {
    const user = userEvent.setup();
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Groceries')).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue('Groceries');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated groceries');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(put).toHaveBeenCalledWith(
        '/transactions/1',
        expect.objectContaining({ title: 'Updated groceries' })
      );
    });
  });

  it('should handle API errors gracefully', async () => {
    (put as jest.Mock).mockRejectedValue(new Error('Server error'));
    const user = userEvent.setup();
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Groceries')).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/error|failed/i)).toBeInTheDocument();
    });
  });
});
