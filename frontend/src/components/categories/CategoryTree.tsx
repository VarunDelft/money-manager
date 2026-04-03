import React, { useState } from 'react';
import { Button, Input } from '../ui';
import { CategoryWithSubcategories } from '../../types';

interface CategoryTreeProps {
  categories: CategoryWithSubcategories[];
  onRename: (id: number, newName: string) => Promise<void>;
  onDelete: (id: number) => void;
  onToggleVisibility: (id: number, isHidden: boolean) => Promise<void>;
}

const CategoryTreeItem: React.FC<{
  category: CategoryWithSubcategories;
  onRename: (id: number, newName: string) => Promise<void>;
  onDelete: (id: number) => void;
  onToggleVisibility: (id: number, isHidden: boolean) => Promise<void>;
  isSubcategory?: boolean;
}> = ({ category, onRename, onDelete, onToggleVisibility, isSubcategory = false }) => {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);

  const handleRename = async () => {
    if (editName.trim() && editName.trim() !== category.name) {
      await onRename(category.id, editName.trim());
    }
    setEditing(false);
  };

  return (
    <li className={`category-tree-item ${isSubcategory ? 'subcategory' : ''}`}>
      <div className="category-tree-item-content">
        {editing ? (
          <div className="category-edit-inline">
            <Input
              label="Rename"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename();
                if (e.key === 'Escape') setEditing(false);
              }}
            />
            <Button size="sm" onClick={handleRename}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        ) : (
          <>
            <span className={`category-name ${category.isHidden ? 'hidden-category' : ''}`}>
              {category.name}
              {category.isDefault && <span className="badge-default"> (default)</span>}
              {category.isHidden && <span className="badge-hidden"> (hidden)</span>}
            </span>
            <div className="category-actions">
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)} aria-label={`Rename ${category.name}`}>
                Rename
              </Button>
              {category.isDefault && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onToggleVisibility(category.id, !category.isHidden)}
                  aria-label={`${category.isHidden ? 'Show' : 'Hide'} ${category.name}`}
                >
                  {category.isHidden ? 'Show' : 'Hide'}
                </Button>
              )}
              {!category.isDefault && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => onDelete(category.id)}
                  aria-label={`Delete ${category.name}`}
                >
                  Delete
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      {!isSubcategory && category.subcategories && category.subcategories.length > 0 && (
        <ul className="category-subcategories">
          {category.subcategories.map((sub) => (
            <CategoryTreeItem
              key={sub.id}
              category={{ ...sub, subcategories: [] } as CategoryWithSubcategories}
              onRename={onRename}
              onDelete={onDelete}
              onToggleVisibility={onToggleVisibility}
              isSubcategory
            />
          ))}
        </ul>
      )}
    </li>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onRename,
  onDelete,
  onToggleVisibility,
}) => {
  if (categories.length === 0) {
    return <p>No categories found.</p>;
  }

  return (
    <ul className="category-tree" role="tree">
      {categories.map((cat) => (
        <CategoryTreeItem
          key={cat.id}
          category={cat}
          onRename={onRename}
          onDelete={onDelete}
          onToggleVisibility={onToggleVisibility}
        />
      ))}
    </ul>
  );
};

export default CategoryTree;
