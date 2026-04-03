import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ManageCategoriesPage from '../../../src/pages/ManageCategoriesPage';

jest.mock('../../../src/services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  del: jest.fn(),
}));

import { get, post, del } from '../../../src/services/api';

const mockCategories = [
  {
    id: 1, name: 'Groceries', parentId: null, isDefault: true, isHidden: false,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    subcategories: [
      { id: 11, name: 'Fruits', parentId: 1, isDefault: false, isHidden: false, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
    ],
  },
  {
    id: 2, name: 'Salary', parentId: null, isDefault: true, isHidden: false,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    subcategories: [],
  },
  {
    id: 20, name: 'Subscriptions', parentId: null, isDefault: false, isHidden: false,
    createdAt: '2026-01-01', updatedAt: '2026-01-01',
    subcategories: [],
  },
];

describe('ManageCategoriesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (get as jest.Mock).mockResolvedValue({ data: mockCategories });
  });

  it('should render category tree with parent and subcategories', async () => {
    render(<ManageCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Groceries')).toBeInTheDocument();
    });

    expect(screen.getByText('Fruits')).toBeInTheDocument();
    expect(screen.getByText('Salary')).toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
  });

  it('should have a form to create new categories', async () => {
    render(<ManageCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });
  });

  it('should create a new category on form submit', async () => {
    const user = userEvent.setup();
    (post as jest.Mock).mockResolvedValue({
      data: {
        id: 30, name: 'Education', parentId: null, isDefault: false, isHidden: false,
        createdAt: '2026-01-01', updatedAt: '2026-01-01',
      },
    });

    render(<ManageCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/name/i), 'Education');

    const addButton = screen.getByRole('button', { name: /add|create/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(post).toHaveBeenCalledWith('/categories', expect.objectContaining({ name: 'Education' }));
    });
  });

  it('should show delete button for non-default categories', async () => {
    render(<ManageCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    });

    // Non-default should have delete action
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    expect(deleteButtons.length).toBeGreaterThan(0);
  });

  it('should show reassignment dialog when deleting a category', async () => {
    const user = userEvent.setup();
    render(<ManageCategoriesPage />);

    await waitFor(() => {
      expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[0]!);

    await waitFor(() => {
      expect(screen.getByText(/reassign/i)).toBeInTheDocument();
    });
  });
});
