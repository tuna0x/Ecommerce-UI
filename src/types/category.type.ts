export interface ICategory {
  id: number;
  name: string;
  description: string;
  slug: string;
  active: boolean;
  createdAt: string;
  parentCategory: ICategory | null;
  productCount: number;
}

export interface ICreateCategory {
  name?: string;
  description?: string;
  parentId?: number | null;
  active: boolean;
}

export interface IUpdateCategory {
  id: number;
  name?: string;
  description?: string;
  active: boolean;
  parentId?: number | null;
}
