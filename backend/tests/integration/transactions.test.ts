import request from 'supertest';
import { createApp } from '../../src/api';
import { Pool } from 'pg';

// Mock the pool module
jest.mock('../../src/db/pool', () => {
  const mockPool = {
    query: jest.fn(),
    connect: jest.fn(),
  };
  return { __esModule: true, default: mockPool };
});

import pool from '../../src/db/pool';

const app = createApp();
const mockPool = pool as jest.Mocked<Pool>;

describe('Transaction API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/transactions', () => {
    const validBody = {
      type: 'expense',
      title: 'Weekly groceries',
      date: '2026-03-27',
      amount: 45.99,
      currency: 'USD',
      shortDescription: 'Supermarket run',
      categoryId: 1,
    };

    it('should create a transaction and return 201', async () => {
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
          }) // INSERT
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const res = await request(app)
        .post('/api/v1/transactions')
        .send(validBody)
        .expect(201);

      expect(res.body.data).toMatchObject({
        id: 1,
        type: 'expense',
        title: 'Weekly groceries',
        amount: 45.99,
      });
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .send({ type: 'expense' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid amount', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .send({ ...validBody, amount: -5 })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid type', async () => {
      const res = await request(app)
        .post('/api/v1/transactions')
        .send({ ...validBody, type: 'transfer' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 404 for non-existent category', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // category lookup - not found
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const res = await request(app)
        .post('/api/v1/transactions')
        .send({ ...validBody, categoryId: 999 })
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('GET /api/v1/transactions', () => {
    it('should return paginated transaction list', async () => {
      mockPool.query = jest.fn().mockResolvedValue({
        rows: [
          {
            id: 1, type: 'expense', title: 'Groceries',
            date: '2026-03-27', time: null, amount: '45.99',
            currency: 'USD', short_description: 'Supermarket',
            detailed_description: null, category_id: 1, category_name: 'Groceries',
            recurring_rule_id: null,
            created_at: '2026-03-27T14:35:00.000Z',
            updated_at: '2026-03-27T14:35:00.000Z',
            tags: null,
          },
        ],
      });

      const res = await request(app)
        .get('/api/v1/transactions')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.hasMore).toBe(false);
    });

    it('should filter by type', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/v1/transactions?type=income')
        .expect(200);

      const query = (mockPool.query as jest.Mock).mock.calls[0][0];
      expect(query).toContain('type');
    });

    it('should filter by date range', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/v1/transactions?dateFrom=2026-01-01&dateTo=2026-03-31')
        .expect(200);
    });

    it('should support cursor pagination', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rows: [] });

      await request(app)
        .get('/api/v1/transactions?cursor=10&limit=5')
        .expect(200);
    });
  });

  describe('GET /api/v1/transactions/:id', () => {
    it('should return a transaction by ID', async () => {
      mockPool.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 1, type: 'expense', title: 'Groceries',
          date: '2026-03-27', time: '14:30', amount: '45.99',
          currency: 'USD', short_description: 'Supermarket run',
          detailed_description: null, category_id: 1, category_name: 'Groceries',
          recurring_rule_id: null,
          created_at: '2026-03-27T14:35:00.000Z',
          updated_at: '2026-03-27T14:35:00.000Z',
          tags: 'weekly,food',
        }],
      });

      const res = await request(app)
        .get('/api/v1/transactions/1')
        .expect(200);

      expect(res.body.data.id).toBe(1);
      expect(res.body.data.category).toEqual({ id: 1, name: 'Groceries' });
    });

    it('should return 404 for non-existent transaction', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rows: [] });

      const res = await request(app)
        .get('/api/v1/transactions/999')
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/transactions/:id', () => {
    it('should update a transaction and return 200', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{
              id: 1, type: 'expense', title: 'Updated',
              date: '2026-03-27', time: null, amount: '55.00',
              currency: 'USD', short_description: 'Updated desc',
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

      // getById after update
      mockPool.query = jest.fn().mockResolvedValue({
        rows: [{
          id: 1, type: 'expense', title: 'Updated',
          date: '2026-03-27', time: null, amount: '55.00',
          currency: 'USD', short_description: 'Updated desc',
          detailed_description: null, category_id: 1, category_name: 'Groceries',
          recurring_rule_id: null,
          created_at: '2026-03-27T14:35:00.000Z',
          updated_at: '2026-03-27T15:00:00.000Z',
          tags: null,
        }],
      });

      const res = await request(app)
        .put('/api/v1/transactions/1')
        .send({ title: 'Updated', amount: 55 })
        .expect(200);

      expect(res.body.data.title).toBe('Updated');
    });

    it('should return 404 when updating non-existent transaction', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [] }) // UPDATE - not found
          .mockResolvedValueOnce({}), // ROLLBACK
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const res = await request(app)
        .put('/api/v1/transactions/999')
        .send({ title: 'Test' })
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/transactions/:id', () => {
    it('should delete a transaction and return 204', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rowCount: 1 });

      await request(app)
        .delete('/api/v1/transactions/1')
        .expect(204);
    });

    it('should return 404 when deleting non-existent transaction', async () => {
      mockPool.query = jest.fn().mockResolvedValue({ rowCount: 0 });

      const res = await request(app)
        .delete('/api/v1/transactions/999')
        .expect(404);

      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });
});
