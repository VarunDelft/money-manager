import { Pool } from 'pg';
import * as categoryService from '../../../src/services/categoryService';
import { ValidationError, NotFoundError, ConflictError } from '../../../src/models';

jest.mock('../../../src/db/pool', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { __esModule: true, default: mockPool };
});

import pool from '../../../src/db/pool';

const mockPool = pool as jest.Mocked<Pool>;

describe('CategoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return categories as nested tree structure', async () => {
      mockPool.query = jest.fn().mockResolvedValue({
        rows: [
          { id: 1, name: 'Groceries', parent_id: null, is_default: true, is_hidden: false, created_at: '2026-01-01', updated_at: '2026-01-01' },
          { id: 11, name: 'Fruits', parent_id: 1, is_default: false, is_hidden: false, created_at: '2026-01-01', updated_at: '2026-01-01' },
          { id: 2, name: 'Salary', parent_id: null, is_default: true, is_hidden: false, created_at: '2026-01-01', updated_at: '2026-01-01' },
        ],
      });

      const result = await categoryService.getAll(false);

      expect(result).toHaveLength(2); // only top-level
      const groceries = result.find((c) => c.name === 'Groceries');
      expect(groceries?.subcategories).toHaveLength(1);
      expect(groceries?.subcategories[0]?.name).toBe('Fruits');
    });

    it('should exclude hidden categories when includeHidden is false', async () => {
      mockPool.query = jest.fn().mockResolvedValue({
        rows: [
          { id: 1, name: 'Groceries', parent_id: null, is_default: true, is_hidden: false, created_at: '2026-01-01', updated_at: '2026-01-01' },
        ],
      });

      await categoryService.getAll(false);

      const query = (mockPool.query as jest.Mock).mock.calls[0][0] as string;
      expect(query.toLowerCase()).toContain('is_hidden');
    });
  });

  describe('create', () => {
    it('should create a top-level category', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // uniqueness check
        .mockResolvedValueOnce({
          rows: [{
            id: 20, name: 'Subscriptions', parent_id: null,
            is_default: false, is_hidden: false,
            created_at: '2026-01-01', updated_at: '2026-01-01',
          }],
        }); // INSERT

      const result = await categoryService.create('Subscriptions', null);
      expect(result.name).toBe('Subscriptions');
      expect(result.parentId).toBeNull();
    });

    it('should create a subcategory', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // uniqueness check
        .mockResolvedValueOnce({
          rows: [{ id: 1, parent_id: null }],
        }) // parent lookup (is top-level)
        .mockResolvedValueOnce({
          rows: [{
            id: 21, name: 'Netflix', parent_id: 1,
            is_default: false, is_hidden: false,
            created_at: '2026-01-01', updated_at: '2026-01-01',
          }],
        }); // INSERT

      const result = await categoryService.create('Netflix', 1);
      expect(result.parentId).toBe(1);
    });

    it('should throw ConflictError for duplicate name (case-insensitive)', async () => {
      mockPool.query = jest.fn().mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Groceries' }],
      }); // uniqueness check finds duplicate

      await expect(
        categoryService.create('groceries', null)
      ).rejects.toThrow(ConflictError);
    });

    it('should enforce one-level nesting (no sub-subcategories)', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // uniqueness check
        .mockResolvedValueOnce({
          rows: [{ id: 11, parent_id: 1 }], // parent is itself a subcategory
        });

      await expect(
        categoryService.create('Deep Sub', 11)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('rename', () => {
    it('should rename a category', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({
          rows: [{ id: 1, name: 'Groceries' }],
        }) // get existing
        .mockResolvedValueOnce({ rows: [] }) // conflict check
        .mockResolvedValueOnce({
          rows: [{
            id: 1, name: 'Food', parent_id: null,
            is_default: true, is_hidden: false,
            created_at: '2026-01-01', updated_at: '2026-01-01',
          }],
        }); // UPDATE

      const result = await categoryService.rename(1, 'Food');
      expect(result.name).toBe('Food');
    });

    it('should throw ConflictError when renaming to existing name', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({
          rows: [{ id: 1, name: 'Groceries' }],
        })
        .mockResolvedValueOnce({
          rows: [{ id: 2, name: 'Salary' }], // conflict
        });

      await expect(
        categoryService.rename(1, 'Salary')
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('toggleVisibility', () => {
    it('should toggle visibility on default categories', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({
          rows: [{ id: 1, is_default: true }],
        })
        .mockResolvedValueOnce({
          rows: [{
            id: 1, name: 'Groceries', parent_id: null,
            is_default: true, is_hidden: true,
            created_at: '2026-01-01', updated_at: '2026-01-01',
          }],
        });

      const result = await categoryService.toggleVisibility(1, true);
      expect(result.isHidden).toBe(true);
    });

    it('should reject toggling visibility on non-default categories', async () => {
      mockPool.query = jest.fn().mockResolvedValueOnce({
        rows: [{ id: 20, is_default: false }],
      });

      await expect(
        categoryService.toggleVisibility(20, true)
      ).rejects.toThrow(ValidationError);
    });
  });

  describe('remove', () => {
    it('should delete a category and reassign transactions', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 20, is_default: false, parent_id: null }] }) // get category
          .mockResolvedValueOnce({ rows: [{ id: 21, parent_id: 20 }] }) // find subcategories
          .mockResolvedValueOnce({}) // reassign transactions from subcategory
          .mockResolvedValueOnce({}) // delete subcategory
          .mockResolvedValueOnce({}) // reassign transactions from main category
          .mockResolvedValueOnce({}) // delete category
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      await expect(categoryService.remove(20, 1)).resolves.toBeUndefined();
    });

    it('should reject deleting default categories', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1, is_default: true }] }), // category is default
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      await expect(
        categoryService.remove(1)
      ).rejects.toThrow(ValidationError);
    });
  });
});
