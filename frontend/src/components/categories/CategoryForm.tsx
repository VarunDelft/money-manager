import React, { useState } from 'react';
import { Input, Select, Button } from '../ui';
import { CategoryWithSubcategories } from '../../types';

interface CategoryFormProps {
  categories: CategoryWithSubcategories[];
  onSubmit: (name: string, parentId: number | null) => Promise<void>;
}

const CategoryForm: React.FC<CategoryFormProps> = ({ categories, onSubmit }) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parentOptions = [
    { value: '', label: 'None (top-level)' },
    ...categories
      .filter((c) => !c.parentId)
      .map((c) => ({ value: String(c.id), label: `Under: ${c.name}` })),
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(name.trim(), parentId ? parseInt(parentId, 10) : null);
      setName('');
      setParentId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <Input
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error || undefined}
        maxLength={100}
        required
      />
      <Select
        label="Parent Category"
        options={parentOptions}
        value={parentId}
        onChange={(e) => setParentId(e.target.value)}
      />
      <Button type="submit" loading={submitting}>Add Category</Button>
    </form>
  );
};

export default CategoryForm;
