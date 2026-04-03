import { Router, Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation';
import * as transactionService from '../../services/transactionService';
import { TransactionFilters } from '../../models/transaction';

const router = Router();

const createTransactionSchema = {
  type: { required: true, type: 'string' as const, enum: ['expense', 'income'] },
  title: { required: true, type: 'string' as const, maxLength: 100 },
  date: { required: true, type: 'string' as const, pattern: /^\d{4}-\d{2}-\d{2}$/, patternMessage: 'date must be in YYYY-MM-DD format.' },
  amount: { required: true, type: 'number' as const, min: 0.01, max: 999999999.99, maxDecimals: 2 },
  currency: { required: true, type: 'string' as const, pattern: /^[A-Z]{3}$/, patternMessage: 'currency must be a 3-letter ISO 4217 code.' },
  shortDescription: { required: true, type: 'string' as const, maxLength: 250 },
  categoryId: { required: true, type: 'integer' as const },
};

// POST /api/v1/transactions
router.post('/', validate(createTransactionSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await transactionService.create(req.body);
    res.status(201).json({ data: transaction });
  } catch (err) { next(err); }
});

// GET /api/v1/transactions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const filters: TransactionFilters = {
      type: req.query.type as TransactionFilters['type'],
      categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string, 10) : undefined,
      dateFrom: req.query.dateFrom as string | undefined,
      dateTo: req.query.dateTo as string | undefined,
      search: req.query.search as string | undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      cursor: req.query.cursor as string | undefined,
    };
    const result = await transactionService.getAll(filters);
    res.json(result);
  } catch (err) { next(err); }
});

// GET /api/v1/transactions/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const transaction = await transactionService.getById(id);
    res.json({ data: transaction });
  } catch (err) { next(err); }
});

// PUT /api/v1/transactions/:id
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const transaction = await transactionService.update(id, req.body);
    res.json({ data: transaction });
  } catch (err) { next(err); }
});

// DELETE /api/v1/transactions/:id
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await transactionService.remove(id);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
