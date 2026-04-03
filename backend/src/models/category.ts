export interface Category {
  id: number;
  name: string;
  parentId: number | null;
  isDefault: boolean;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryWithSubcategories extends Category {
  subcategories: Category[];
}
