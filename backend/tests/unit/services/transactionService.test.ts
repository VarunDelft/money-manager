import { Pool } from 'pg';
import * as transactionService from '../../../src/services/transactionService';
import { ValidationError, NotFoundError } from '../../../src/models';

// Mock the pool module
jest.mock('../../../src/db/pool', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { __esModule: true, default: mockPool };
});

import pool from '../../../src/db/pool';

const mockPool = pool as jest.Mocked<Pool>;

describe('TransactionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const validInput = {
      type: 'expense' as const,
      title: 'Weekly groceries',
      date: '2026-03-27',
      amount: 45.99,
      currency: 'USD',
      shortDescription: 'Supermarket run',
      categoryId: 1,
    };

    it('should create a transaction with mandatory fields', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Groceries' }] }) // category lookup
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              type: 'expense',
              title: 'Weekly groceries',
              date: '2026-03-27',
              time: null,
              amount: '45.99',
              currency: 'USD',
              short_description: 'Supermarket run',
              detailed_description: null,
              category_id: 1,
              recurring_rule_id: null,
              created_at: '2026-03-27T14:35:00.000Z',
              updated_at: '2026-03-27T14:35:00.000Z',
            }],
          }) // INSERT
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await transactionService.create(validInput);

      expect(result).toMatchObject({
        id: 1,
        type: 'expense',
        title: 'Weekly groceries',
        amount: 45.99,
        category: { id: 1, name: 'Groceries' },
        tags: [],
      });
    });

    it('should create a transaction with optional fields and tags', async () => {
      const input = {
        ...validInput,
        time: '14:30',
        detailedDescription: 'Bought fruits and vegetables',
        tags: ['weekly', 'food'],
      };

      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Groceries' }] }) // category lookup
          .mockResolvedValueOnce({
            rows: [{
              id: 1,
              type: 'expense',
              title: 'Weekly groceries',
              date: '2026-03-27',
              time: '14:30',
              amount: '45.99',
              currency: 'USD',
              short_description: 'Supermarket run',
              detailed_description: 'Bought fruits and vegetables',
              category_id: 1,
              recurring_rule_id: null,
              created_at: '2026-03-27T14:35:00.000Z',
              updated_at: '2026-03-27T14:35:00.000Z',
            }],
          }) // INSERT
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'weekly' }] }) // tag upsert 1
          .mockResolvedValueOnce({}) // transaction_tags insert 1
          .mockResolvedValueOnce({ rows: [{ id: 2, name: 'food' }] }) // tag upsert 2
          .mockResolvedValueOnce({}) // transaction_tags insert 2
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await transactionService.create(input);

      expect(result.time).toBe('14:30');
      expect(result.detailedDescription).toBe('Bought fruits and vegetables');
      expect(result.tags).toEqual(['weekly', 'food']);
    });

    it('should throw ValidationError for negative amount', async () => {
      await expect(
        transactionService.create({ ...validInput, amount: -10 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for zero amount', async () => {
      await expect(
        transactionService.create({ ...validInput, amount: 0 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for amount with more than 2 decimal places', async () => {
      await expect(
        transactionService.create({ ...validInput, amount: 10.999 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for amount exceeding max', async () => {
      await expect(
        transactionService.create({ ...validInput, amount: 1000000000 })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for missing mandatory fields', async () => {
      await expect(
        transactionService.create({ ...validInput, title: '' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for title exceeding max length', async () => {
      await expect(
        transactionService.create({ ...validInput, title: 'a'.repeat(101) })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid type', async () => {
      await expect(
        transactionService.create({ ...validInput, type: 'invalid' as 'expense' })
      ).rejects.toThrow(ValidationError);
    });

    it('should throw NotFoundError for non-existent category', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }), // category lookup - empty
        release: jest.fn(),
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      await expect(
        transactionService.create({ ...validInput, categoryId: 999 })
      ).rejects.toThrow(NotFoundError);
    });

    it('should upsert tags (find or create)', async () => {
      const input = { ...validInput, tags: ['existing-tag', 'new-tag'] };
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Groceries' }] }) // category
          .mockResolvedValueOnce({
            rows: [{
              id: 1, type: 'expense', title: 'Weekly groceries',
              date: '2026-03-27', time: null, amount: '45.99',
              currency: 'USD', short_description: 'Supermarket run',
              detailed_description: null, category_id: 1,
              recurring_rule_id: null,
              created_at: '2026-03-27T14:35:00.000Z',
              updated_at: '2026-03-27T14:35:00.000Z',
            }],
          }) // INSERT transaction
          .mockResolvedValueOnce({ rows: [{ id: 10, name: 'existing-tag' }] }) // upsert tag 1
          .mockResolvedValueOnce({}) // transaction_tags 1
          .mockResolvedValueOnce({ rows: [{ id: 11, name: 'new-tag' }] }) // upsert tag 2
          .mockResolvedValueOnce({}) // transaction_tags 2
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      pool.connect = jest.fn().mockResolvedValue(mockClient);

      const result = await transactionService.create(input);
      expect(result.tags).toContain('existing-tag');
      expect(result.tags).toContain('new-tag');
    });
  });

  describe('getAll', () => {
    it('should return paginated transactions with default limit', async () => {
      pool.query = jest.fn().mockResolvedValue({
        rows: [
          {
            id: 2, type: 'expense', title: 'Coffee',
            date: '2026-03-28', time: null, amount: '5.00',
            currency: 'USD', short_description: 'Morning coffee',
            detailed_description: null, category_id: 1, category_name: 'Groceries',
            recurring_rule_id: null,
            created_at: '2026-03-28T08:00:00.000Z',
            updated_at: '2026-03-28T08:00:00.000Z',
            tags: null,
          },
          {
            id: 1, type: 'expense', title: 'Groceries',
            date: '2026-03-27', time: '14:30', amount: '45.99',
            currency: 'USD', short_description: 'Supermarket',
            detailed_description: null, category_id: 1, category_name: 'Groceries',
            recurring_rule_id: null,
            created_at: '2026-03-27T14:35:00.000Z',
            updated_at: '2026-03-27T14:35:00.000Z',
            tags: 'weekly,food',
          },
        ],
      });

      const result = await transactionService.getAll({});

      expect(result.data).toHaveLength(2);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.data[0]!.id).toBe(2);
    });

    it('should filter by type', async () => {
      pool.query = jest.fn().mockResolvedValue({ rows: [] });

      await transactionService.getAll({ type: 'income' });

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('type');
    });

    it('should filter by categoryId', async () => {
      pool.query = jest.fn().mockResolvedValue({ rows: [] });

      await transactionService.getAll({ categoryId: 5 });

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('category_id');
    });

    it('should filter by date range', async () => {
      pool.query = jest.fn().mockResolvedValue({ rows: [] });

      await transactionService.getAll({ dateFrom: '2026-01-01', dateTo: '2026-03-31' });

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      expect(queryCall[0]).toContain('date');
    });

    it('should filter by search term in title and shortDescription', async () => {
      pool.query = jest.fn().mockResolvedValue({ rows: [] });

      await transactionService.getAll({ search: 'groceries' });

      const queryCall = (pool.query as jest.Mock).mock.calls[0];
      const queryStr = queryCall[0] as string;
      expect(queryStr.toLowerCase()).toMatch(/title|short_description/);
    });

    it('should apply cursor-based pagination', async () => {
      pool.query = jest.fn().mockResolvedValue({
        rows: Array.from({ length: 21 }, (_, i) => ({
          id: 20 - i, type: 'expense', title: `Txn ${20 - i}`,
          date: '2026-03-27', time: null, amount: '10.00',
          currency: 'USD', short_description: 'Test',
          detailed_description: null, category_id: 1, category_name: 'Groceries',
          recurring_rule_id: null,
          created_at: '2026-03-27T00:00:00.000Z',
          updated_at: '2026-03-27T00:00:00.000Z',
          tags: null,
        })),
      });

      const result = await transactionService.getAll({ limit: 20 });

      expect(result.data).toHaveLength(20);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextCursor).toBeDefined();
    });

    it('should return hasMore=false when fewer results than limit', async () => {
      pool.query = jest.fn().mockResolvedValue({
        rows: [
          {
            id: 1, type: 'expense', title: 'Solo',
            date: '2026-03-27', time: null, amount: '10.00',
            currency: 'USD', short_description: 'Only one',
            detailed_description: null, category_id: 1, category_name: 'Groceries',
            recurring_rule_id: null,
            created_at: '2026-03-27T00:00:00.000Z',
            updated_at: '2026-03-27T00:00:00.000Z',
            tags: null,
          },
        ],
      });

      const result = await transactionService.getAll({ limit: 20 });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextCursor).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return a transaction by ID with category and tags', async () => {
      pool.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 1, type: 'expense', title: 'Groceries',
          date: '2026-03-27', time: '14:30', amount: '45.99',
          currency: 'USD', short_description: 'Supermarket run',
          detailed_description: 'Full details here',
          category_id: 1, category_name: 'Groceries',
          recurring_rule_id: null,
          created_at: '2026-03-27T14:35:00.000Z',
          updated_at: '2026-03-27T14:35:00.000Z',
          tags: 'weekly,food',
        }],
      });

      const result = await transactionService.getById(1);

      expect(result).toMatchObject({
        id: 1,
        category: { id: 1, name: 'Groceries' },
        tags: ['weekly', 'food'],
      });
    });

    it('should throw NotFoundError for non-existent transaction', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rows: [] });

      await expect(transactionService.getById(999)).rejects.toThrow(NotFoundError);
    });
  });

  describe('update', () => {
    it('should update partial fields of a transaction', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{
              id: 1, type: 'expense', title: 'Updated groceries',
              date: '2026-03-27', time: null, amount: '55.00',
              currency: 'USD', short_description: 'Supermarket run',
              detailed_description: null, category_id: 1,
              recurring_rule_id: null,
              created_at: '2026-03-27T14:35:00.000Z',
              updated_at: '2026-03-27T15:00:00.000Z',
            }],
          }) // UPDATE
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      // getById will be called after update for full transaction return
      mockPool.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 1, type: 'expense', title: 'Updated groceries',
          date: '2026-03-27', time: null, amount: '55.00',
          currency: 'USD', short_description: 'Supermarket run',
          detailed_description: null, category_id: 1, category_name: 'Groceries',
          recurring_rule_id: null,
          created_at: '2026-03-27T14:35:00.000Z',
          updated_at: '2026-03-27T15:00:00.000Z',
          tags: null,
        }],
      });

      const result = await transactionService.update(1, { title: 'Updated groceries', amount: 55.00 });
      expect(result.title).toBe('Updated groceries');
      expect(result.amount).toBe(55.00);
    });

    it('should throw NotFoundError when updating non-existent transaction', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // UPDATE returns 0 rows
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      await expect(
        transactionService.update(999, { title: 'Test' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should update tags with find-or-create', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({}) // DELETE existing transaction_tags
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // upsert tag 1
          .mockResolvedValueOnce({}) // transaction_tags insert 1
          .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // upsert tag 2
          .mockResolvedValueOnce({}) // transaction_tags insert 2
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      mockPool.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 1, type: 'expense', title: 'Groceries',
          date: '2026-03-27', time: null, amount: '45.99',
          currency: 'USD', short_description: 'Supermarket',
          detailed_description: null, category_id: 1, category_name: 'Groceries',
          recurring_rule_id: null,
          created_at: '2026-03-27T14:35:00.000Z',
          updated_at: '2026-03-27T15:00:00.000Z',
          tags: 'new-tag1,new-tag2',
        }],
      });

      const result = await transactionService.update(1, { tags: ['new-tag1', 'new-tag2'] });
      expect(result.tags).toEqual(['new-tag1', 'new-tag2']);
    });

    it('should verify new category exists when updating categoryId', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rows: [] }); // category not found

      await expect(
        transactionService.update(1, { categoryId: 999 })
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('remove', () => {
    it('should delete a transaction permanently', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rowCount: 1 });

      await expect(transactionService.remove(1)).resolves.toBeUndefined();
    });

    it('should throw NotFoundError when deleting non-existent transaction', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rowCount: 0 });

      await expect(transactionService.remove(999)).rejects.toThrow(NotFoundError);
    });
  });
});
