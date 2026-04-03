import { Router, Request, Response, NextFunction } from 'express';
import * as categoryService from '../../services/categoryService';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const includeHidden = req.query.includeHidden === 'true';
    const categories = await categoryService.getAll(includeHidden);
    res.json({ data: categories });
  } catch (err) { next(err); }
});

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, parentId } = req.body as { name: string; parentId?: number };
    const category = await categoryService.create(name, parentId ?? null);
    res.status(201).json({ data: category });
  } catch (err) { next(err); }
});

router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { name } = req.body as { name: string };
    const category = await categoryService.rename(id, name);
    res.json({ data: category });
  } catch (err) { next(err); }
});

router.patch('/:id/visibility', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { isHidden } = req.body as { isHidden: boolean };
    const category = await categoryService.toggleVisibility(id, isHidden);
    res.json({ data: category });
  } catch (err) { next(err); }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { reassignToCategoryId } = req.body as { reassignToCategoryId?: number };
    await categoryService.remove(id, reassignToCategoryId);
    res.status(204).send();
  } catch (err) { next(err); }
});

export default router;
