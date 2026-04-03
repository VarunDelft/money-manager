import React, { useCallback, useEffect, useState } from 'react';
import { get, post, put, patch, del } from '../services/api';
import { CategoryWithSubcategories } from '../types';
import { LoadingSpinner, useToast, ToastContainer } from '../components/ui';
import CategoryForm from '../components/categories/CategoryForm';
import CategoryTree from '../components/categories/CategoryTree';
import ReassignCategoryModal from '../components/categories/ReassignCategoryModal';

const ManageCategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<CategoryWithSubcategories[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const { toasts, addToast, dismissToast } = useToast();

  const fetchCategories = useCallback(async () => {
    try {
      const res = await get<{ data: CategoryWithSubcategories[] }>('/categories?includeHidden=true');
      setCategories(res.data);
    } catch {
      addToast('error', 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreate = async (name: string, parentId: number | null) => {
    await post('/categories', { name, parentId });
    addToast('success', 'Category created.');
    await fetchCategories();
  };

  const handleRename = async (id: number, newName: string) => {
    await put(`/categories/${id}`, { name: newName });
    addToast('success', 'Category renamed.');
    await fetchCategories();
  };

  const handleToggleVisibility = async (id: number, isHidden: boolean) => {
    await patch(`/categories/${id}/visibility`, { isHidden });
    addToast('success', `Category ${isHidden ? 'hidden' : 'shown'}.`);
    await fetchCategories();
  };

  const handleDelete = (id: number) => {
    setDeletingCategoryId(id);
  };

  const handleConfirmDelete = async (reassignToCategoryId: number) => {
    if (deletingCategoryId === null) return;
    await del(`/categories/${deletingCategoryId}`, { reassignToCategoryId });
    addToast('success', 'Category deleted.');
    setDeletingCategoryId(null);
    await fetchCategories();
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page manage-categories-page">
      <h1>Manage Categories</h1>

      <section className="category-create-section">
        <h2>Add Category</h2>
        <CategoryForm categories={categories} onSubmit={handleCreate} />
      </section>

      <section className="category-list-section">
        <h2>Categories</h2>
        <CategoryTree
          categories={categories}
          onRename={handleRename}
          onDelete={handleDelete}
          onToggleVisibility={handleToggleVisibility}
        />
      </section>

      <ReassignCategoryModal
        isOpen={deletingCategoryId !== null}
        onClose={() => setDeletingCategoryId(null)}
        onConfirm={handleConfirmDelete}
        categories={categories}
        deletingCategoryId={deletingCategoryId}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default ManageCategoriesPage;
