import pool from '../db/pool';
import { Transaction, CreateTransactionInput, UpdateTransactionInput, TransactionFilters } from '../models/transaction';
import { PaginatedResponse, ValidationError, NotFoundError } from '../models';

interface TransactionRow {
  id: number;
  type: 'expense' | 'income';
  title: string;
  date: string;
  time: string | null;
  amount: string;
  currency: string;
  short_description: string;
  detailed_description: string | null;
  category_id: number;
  category_name?: string;
  recurring_rule_id: number | null;
  created_at: string;
  updated_at: string;
  tags?: string | null;
}

function rowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    date: row.date,
    time: row.time,
    amount: parseFloat(row.amount),
    currency: row.currency,
    shortDescription: row.short_description,
    detailedDescription: row.detailed_description,
    category: { id: row.category_id, name: row.category_name ?? '' },
    tags: row.tags ? row.tags.split(',') : [],
    recurringRuleId: row.recurring_rule_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validateCreateInput(input: CreateTransactionInput): void {
  const details: Array<{ field: string; message: string }> = [];

  if (!input.type || !['expense', 'income'].includes(input.type)) {
    details.push({ field: 'type', message: 'type must be "expense" or "income".' });
  }

  if (!input.title || input.title.trim() === '') {
    details.push({ field: 'title', message: 'title is required.' });
  } else if (input.title.length > 100) {
    details.push({ field: 'title', message: 'title must be at most 100 characters.' });
  }

  if (!input.date) {
    details.push({ field: 'date', message: 'date is required.' });
  }

  if (input.amount === undefined || input.amount === null) {
    details.push({ field: 'amount', message: 'amount is required.' });
  } else if (input.amount <= 0) {
    details.push({ field: 'amount', message: 'amount must be greater than 0.' });
  } else if (input.amount > 999999999.99) {
    details.push({ field: 'amount', message: 'amount must be at most 999999999.99.' });
  } else {
    const decimalPart = input.amount.toString().split('.')[1];
    if (decimalPart && decimalPart.length > 2) {
      details.push({ field: 'amount', message: 'amount must have at most 2 decimal places.' });
    }
  }

  if (!input.currency) {
    details.push({ field: 'currency', message: 'currency is required.' });
  }

  if (!input.shortDescription || input.shortDescription.trim() === '') {
    details.push({ field: 'shortDescription', message: 'shortDescription is required.' });
  } else if (input.shortDescription.length > 250) {
    details.push({ field: 'shortDescription', message: 'shortDescription must be at most 250 characters.' });
  }

  if (!input.categoryId) {
    details.push({ field: 'categoryId', message: 'categoryId is required.' });
  }

  if (details.length > 0) {
    throw new ValidationError('Validation failed.', details);
  }
}

export async function create(input: CreateTransactionInput): Promise<Transaction> {
  validateCreateInput(input);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify category exists
    const categoryResult = await client.query(
      'SELECT id, name FROM categories WHERE id = $1',
      [input.categoryId]
    );
    if (categoryResult.rows.length === 0) {
      throw new NotFoundError(`Category with id ${input.categoryId} not found.`);
    }
    const category = categoryResult.rows[0] as { id: number; name: string };

    // Insert transaction
    const insertResult = await client.query(
      `INSERT INTO transactions (type, title, date, time, amount, currency, short_description, detailed_description, category_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        input.type,
        input.title,
        input.date,
        input.time ?? null,
        input.amount,
        input.currency,
        input.shortDescription,
        input.detailedDescription ?? null,
        input.categoryId,
      ]
    );
    const row = insertResult.rows[0] as TransactionRow;

    // Handle tags (find or create)
    const tags: string[] = [];
    if (input.tags && input.tags.length > 0) {
      for (const tagName of input.tags) {
        const tagResult = await client.query(
          `INSERT INTO tags (name) VALUES ($1)
           ON CONFLICT (LOWER(name)) DO UPDATE SET name = tags.name
           RETURNING id, name`,
          [tagName]
        );
        const tag = tagResult.rows[0] as { id: number; name: string };
        tags.push(tag.name);

        await client.query(
          'INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2)',
          [row.id, tag.id]
        );
      }
    }

    await client.query('COMMIT');

    return {
      id: row.id,
      type: row.type,
      title: row.title,
      date: row.date,
      time: row.time,
      amount: parseFloat(row.amount),
      currency: row.currency,
      shortDescription: row.short_description,
      detailedDescription: row.detailed_description,
      category: { id: category.id, name: category.name },
      tags,
      recurringRuleId: row.recurring_rule_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function getAll(filters: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
  const limit = Math.min(Math.max(filters.limit ?? 20, 1), 100);
  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (filters.type) {
    conditions.push(`t.type = $${paramIndex++}`);
    params.push(filters.type);
  }

  if (filters.categoryId) {
    conditions.push(`t.category_id = $${paramIndex++}`);
    params.push(filters.categoryId);
  }

  if (filters.dateFrom) {
    conditions.push(`t.date >= $${paramIndex++}`);
    params.push(filters.dateFrom);
  }

  if (filters.dateTo) {
    conditions.push(`t.date <= $${paramIndex++}`);
    params.push(filters.dateTo);
  }

  if (filters.search) {
    conditions.push(`(t.title ILIKE $${paramIndex} OR t.short_description ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.cursor) {
    conditions.push(`t.id < $${paramIndex++}`);
    params.push(parseInt(filters.cursor, 10));
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Fetch limit+1 to determine hasMore
  params.push(limit + 1);

  const query = `
    SELECT t.*,
           c.name AS category_name,
           STRING_AGG(tg.name, ',' ORDER BY tg.name) AS tags
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    LEFT JOIN transaction_tags tt ON tt.transaction_id = t.id
    LEFT JOIN tags tg ON tg.id = tt.tag_id
    ${whereClause}
    GROUP BY t.id, c.name
    ORDER BY t.date DESC, t.id DESC
    LIMIT $${paramIndex}
  `;

  const result = await pool.query(query, params);
  const rows = result.rows as TransactionRow[];

  const hasMore = rows.length > limit;
  const data = rows.slice(0, limit).map(rowToTransaction);
  const lastItem = data[data.length - 1];

  return {
    data,
    pagination: {
      nextCursor: hasMore && lastItem ? String(lastItem.id) : null,
      hasMore,
    },
  };
}

export async function getById(id: number): Promise<Transaction> {
  const result = await pool.query(
    `SELECT t.*,
            c.name AS category_name,
            STRING_AGG(tg.name, ',' ORDER BY tg.name) AS tags
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     LEFT JOIN transaction_tags tt ON tt.transaction_id = t.id
     LEFT JOIN tags tg ON tg.id = tt.tag_id
     WHERE t.id = $1
     GROUP BY t.id, c.name`,
    [id]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError(`Transaction with id ${id} not found.`);
  }

  return rowToTransaction(result.rows[0] as TransactionRow);
}

export async function update(id: number, input: UpdateTransactionInput): Promise<Transaction> {
  const setClauses: string[] = [];
  const params: unknown[] = [];
  let paramIndex = 1;

  if (input.type !== undefined) {
    setClauses.push(`type = $${paramIndex++}`);
    params.push(input.type);
  }
  if (input.title !== undefined) {
    setClauses.push(`title = $${paramIndex++}`);
    params.push(input.title);
  }
  if (input.date !== undefined) {
    setClauses.push(`date = $${paramIndex++}`);
    params.push(input.date);
  }
  if (input.time !== undefined) {
    setClauses.push(`time = $${paramIndex++}`);
    params.push(input.time);
  }
  if (input.amount !== undefined) {
    setClauses.push(`amount = $${paramIndex++}`);
    params.push(input.amount);
  }
  if (input.currency !== undefined) {
    setClauses.push(`currency = $${paramIndex++}`);
    params.push(input.currency);
  }
  if (input.shortDescription !== undefined) {
    setClauses.push(`short_description = $${paramIndex++}`);
    params.push(input.shortDescription);
  }
  if (input.detailedDescription !== undefined) {
    setClauses.push(`detailed_description = $${paramIndex++}`);
    params.push(input.detailedDescription);
  }
  if (input.categoryId !== undefined) {
    // Verify new category exists
    const catResult = await pool.query('SELECT id FROM categories WHERE id = $1', [input.categoryId]);
    if (catResult.rows.length === 0) {
      throw new NotFoundError(`Category with id ${input.categoryId} not found.`);
    }
    setClauses.push(`category_id = $${paramIndex++}`);
    params.push(input.categoryId);
  }

  if (setClauses.length === 0 && !input.tags) {
    return getById(id);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (setClauses.length > 0) {
      params.push(id);
      const result = await client.query(
        `UPDATE transactions SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        params
      );
      if (result.rows.length === 0) {
        throw new NotFoundError(`Transaction with id ${id} not found.`);
      }
    }

    // Handle tag updates
    if (input.tags !== undefined) {
      // Remove existing tags
      await client.query('DELETE FROM transaction_tags WHERE transaction_id = $1', [id]);

      // Add new tags
      for (const tagName of input.tags) {
        const tagResult = await client.query(
          `INSERT INTO tags (name) VALUES ($1)
           ON CONFLICT (LOWER(name)) DO UPDATE SET name = tags.name
           RETURNING id`,
          [tagName]
        );
        const tagId = (tagResult.rows[0] as { id: number }).id;
        await client.query(
          'INSERT INTO transaction_tags (transaction_id, tag_id) VALUES ($1, $2)',
          [id, tagId]
        );
      }
    }

    await client.query('COMMIT');

    return getById(id);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function remove(id: number): Promise<void> {
  const result = await pool.query('DELETE FROM transactions WHERE id = $1', [id]);
  if (result.rowCount === 0) {
    throw new NotFoundError(`Transaction with id ${id} not found.`);
  }
}
