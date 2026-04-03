import pool from '../db/pool';
import { Category, CategoryWithSubcategories, NotFoundError, ConflictError, ValidationError } from '../models';

interface CategoryRow {
  id: number;
  name: string;
  parent_id: number | null;
  is_default: boolean;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
}

function rowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    isDefault: row.is_default,
    isHidden: row.is_hidden,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getAll(includeHidden: boolean): Promise<CategoryWithSubcategories[]> {
  let query = 'SELECT * FROM categories';
  if (!includeHidden) {
    query += ' WHERE is_hidden = false';
  }
  query += ' ORDER BY is_default DESC, name ASC';

  const result = await pool.query<CategoryRow>(query);
  const all = result.rows.map(rowToCategory);

  const topLevel = all.filter(c => c.parentId === null);
  const subcategories = all.filter(c => c.parentId !== null);

  return topLevel.map(parent => ({
    ...parent,
    subcategories: subcategories.filter(sub => sub.parentId === parent.id),
  }));
}

export async function getById(id: number): Promise<Category> {
  const result = await pool.query<CategoryRow>(
    'SELECT * FROM categories WHERE id = $1',
    [id],
  );
  if (result.rows.length === 0) {
    throw new NotFoundError(`Category with id ${id} not found.`);
  }
  return rowToCategory(result.rows[0]!);
}

export async function create(name: string, parentId: number | null): Promise<Category> {
  if (parentId !== null) {
    const parent = await pool.query<CategoryRow>(
      'SELECT * FROM categories WHERE id = $1',
      [parentId],
    );
    if (parent.rows.length === 0) {
      throw new NotFoundError(`Parent category with id ${parentId} not found.`);
    }
    if (parent.rows[0]!.parent_id !== null) {
      throw new ValidationError('Cannot create a subcategory under another subcategory. Only one level of nesting is allowed.');
    }
  }

  const existing = await pool.query<CategoryRow>(
    'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND COALESCE(parent_id, 0) = COALESCE($2, 0)',
    [name, parentId],
  );
  if (existing.rows.length > 0) {
    throw new ConflictError(`A category with name "${name}" already exists.`);
  }

  const result = await pool.query<CategoryRow>(
    'INSERT INTO categories (name, parent_id) VALUES ($1, $2) RETURNING *',
    [name, parentId],
  );
  return rowToCategory(result.rows[0]!);
}

export async function rename(id: number, newName: string): Promise<Category> {
  const category = await getById(id);

  const existing = await pool.query<CategoryRow>(
    'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND COALESCE(parent_id, 0) = COALESCE($2, 0) AND id != $3',
    [newName, category.parentId, id],
  );
  if (existing.rows.length > 0) {
    throw new ConflictError(`A category with name "${newName}" already exists.`);
  }

  const result = await pool.query<CategoryRow>(
    'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
    [newName, id],
  );
  return rowToCategory(result.rows[0]!);
}

export async function toggleVisibility(id: number, isHidden: boolean): Promise<Category> {
  const category = await getById(id);
  if (!category.isDefault) {
    throw new ValidationError('Only default categories can be hidden or shown.');
  }

  const result = await pool.query<CategoryRow>(
    'UPDATE categories SET is_hidden = $1 WHERE id = $2 RETURNING *',
    [isHidden, id],
  );
  return rowToCategory(result.rows[0]!);
}

export async function remove(id: number, reassignToCategoryId?: number): Promise<void> {
  const category = await getById(id);

  if (category.isDefault) {
    throw new ValidationError('Default categories cannot be deleted.');
  }

  const subcategoryIds = await pool.query<{ id: number }>(
    'SELECT id FROM categories WHERE parent_id = $1',
    [id],
  );
  const allCategoryIds = [id, ...subcategoryIds.rows.map(r => r.id)];

  const txCount = await pool.query<{ count: string }>(
    'SELECT COUNT(*) as count FROM transactions WHERE category_id = ANY($1)',
    [allCategoryIds],
  );
  const hasTransactions = parseInt(txCount.rows[0]!.count, 10) > 0;

  if (hasTransactions && !reassignToCategoryId) {
    throw new ValidationError(
      'This category has associated transactions. Provide reassignToCategoryId to reassign them before deletion.',
    );
  }

  if (hasTransactions && reassignToCategoryId) {
    await getById(reassignToCategoryId);
    await pool.query(
      'UPDATE transactions SET category_id = $1 WHERE category_id = ANY($2)',
      [reassignToCategoryId, allCategoryIds],
    );
  }

  await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}
