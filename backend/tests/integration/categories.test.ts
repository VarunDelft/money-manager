import request from 'supertest';
import { createApp } from '../../src/api';
import { Pool } from 'pg';

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

describe('Category API Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/categories', () => {
    it('should return a tree of categories', async () => {
      mockPool.query = jest.fn().mockResolvedValue({
        rows: [
          { id: 1, name: 'Groceries', parent_id: null, is_default: true, is_hidden: false, created_at: '2026-01-01', updated_at: '2026-01-01' },
          { id: 2, name: 'Salary', parent_id: null, is_default: true, is_hidden: false, created_at: '2026-01-01', updated_at: '2026-01-01' },
        ],
      });

      const res = await request(app).get('/api/v1/categories').expect(200);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('POST /api/v1/categories', () => {
    it('should create a category and return 201', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [] }) // uniqueness check
        .mockResolvedValueOnce({
          rows: [{
            id: 20, name: 'Subscriptions', parent_id: null,
            is_default: false, is_hidden: false,
            created_at: '2026-01-01', updated_at: '2026-01-01',
          }],
        });

      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Subscriptions' })
        .expect(201);

      expect(res.body.data.name).toBe('Subscriptions');
    });

    it('should return 409 for duplicate name', async () => {
      mockPool.query = jest.fn().mockResolvedValueOnce({
        rows: [{ id: 1, name: 'Groceries' }],
      });

      const res = await request(app)
        .post('/api/v1/categories')
        .send({ name: 'Groceries' })
        .expect(409);

      expect(res.body.error.code).toBe('CONFLICT');
    });
  });

  describe('PUT /api/v1/categories/:id', () => {
    it('should rename a category', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Groceries' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1, name: 'Food', parent_id: null,
            is_default: true, is_hidden: false,
            created_at: '2026-01-01', updated_at: '2026-01-01',
          }],
        });

      const res = await request(app)
        .put('/api/v1/categories/1')
        .send({ name: 'Food' })
        .expect(200);

      expect(res.body.data.name).toBe('Food');
    });
  });

  describe('PATCH /api/v1/categories/:id/visibility', () => {
    it('should toggle visibility of a default category', async () => {
      mockPool.query = jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 1, is_default: true }] })
        .mockResolvedValueOnce({
          rows: [{
            id: 1, name: 'Groceries', parent_id: null,
            is_default: true, is_hidden: true,
            created_at: '2026-01-01', updated_at: '2026-01-01',
          }],
        });

      const res = await request(app)
        .patch('/api/v1/categories/1/visibility')
        .send({ isHidden: true })
        .expect(200);

      expect(res.body.data.isHidden).toBe(true);
    });
  });

  describe('DELETE /api/v1/categories/:id', () => {
    it('should delete a non-default category and return 204', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 20, is_default: false, parent_id: null }] })
          .mockResolvedValueOnce({ rows: [] }) // no subcategories
          .mockResolvedValueOnce({}) // reassign transactions
          .mockResolvedValueOnce({}) // delete
          .mockResolvedValueOnce({}), // COMMIT
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      await request(app)
        .delete('/api/v1/categories/20')
        .send({ reassignToCategoryId: 1 })
        .expect(204);
    });

    it('should return 400 when trying to delete a default category', async () => {
      const mockClient = {
        query: jest.fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1, is_default: true }] }),
        release: jest.fn(),
      };
      mockPool.connect = jest.fn().mockResolvedValue(mockClient);

      const res = await request(app)
        .delete('/api/v1/categories/1')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
