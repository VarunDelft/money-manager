import { Router, Request, Response, NextFunction } from 'express';
import pool from '../../db/pool';

const router = Router();

// GET /api/v1/tags
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      'SELECT id, name, created_at FROM tags ORDER BY name ASC'
    );
    res.json({ data: result.rows });
  } catch (err) { next(err); }
});

export default router;
