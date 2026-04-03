import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TransactionForm from '../../../src/components/transactions/TransactionForm';

// Mock the API service
jest.mock('../../../src/services/api', () => ({
  get: jest.fn(),
}));

import { get } from '../../../src/services/api';

const mockCategories = [
  { id: 1, name: 'Groceries', subcategories: [] },
  { id: 2, name: 'Salary', subcategories: [] },
];

describe('TransactionForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockResolvedValue({ data: mockCategories });
  });

  it('should render all mandatory fields', async () => {
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/short description/i)).toBeInTheDocument();
  });

  it('should validate inline on blur for empty required fields', async () => {
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    const titleInput = screen.getByLabelText(/title/i);
    await user.click(titleInput);
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  it('should show validation errors on submit with empty fields', async () => {
    const user = userEvent.setup();
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      const errors = screen.getAllByRole('alert');
      expect(errors.length).toBeGreaterThan(0);
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should submit with valid mandatory fields', async () => {
    const user = userEvent.setup();
    mockOnSubmit.mockResolvedValue(undefined);
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    });

    await user.selectOptions(screen.getByLabelText(/type/i), 'expense');
    await user.type(screen.getByLabelText(/title/i), 'Weekly groceries');
    await user.clear(screen.getByLabelText(/date/i));
    await user.type(screen.getByLabelText(/date/i), '2026-03-27');
    await user.type(screen.getByLabelText(/amount/i), '45.99');
    await user.type(screen.getByLabelText(/currency/i), 'USD');
    await user.selectOptions(screen.getByLabelText(/category/i), '1');
    await user.type(screen.getByLabelText(/short description/i), 'Supermarket run');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'expense',
          title: 'Weekly groceries',
          amount: 45.99,
          categoryId: 1,
        })
      );
    });
  });

  it('should allow toggling optional fields', async () => {
    render(<TransactionForm onSubmit={mockOnSubmit} />);

    // Time and detailed description should be optionally visible
    const timeInput = screen.queryByLabelText(/time/i);
    const detailedInput = screen.queryByLabelText(/detailed description/i);

    // Either they should be present or there should be a way to show them
    expect(timeInput !== null || screen.queryByText(/add time/i) !== null).toBe(true);
    expect(
      detailedInput !== null || screen.queryByText(/add detail/i) !== null
    ).toBe(true);
  });
});
