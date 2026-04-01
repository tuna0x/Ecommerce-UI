import type { ICategory } from "../types/category.type";

export interface CategoryNode extends ICategory {
  subcategories: CategorySecondary[];
}

export interface CategorySecondary extends ICategory {
  children: string[]; // Level 3 strings as per current UI expectation or ICategory[]
}

// Actually, let's make it more flexible to match CategoryDropdown's needs
export interface CategoryTree extends ICategory {
    subcategories: {
        id: number;
        name: string;
        children: string[];
    }[];
}

/**
 * Transforms flat category list into a 3-level tree for the Mega Menu
 */
export const buildCategoryTree = (flatCategories: ICategory[]): CategoryTree[] => {
    // 1. Get Root Categories (level 1)
    const roots = flatCategories.filter(c => !c.parentCategory && c.active);

    return roots.map(root => {
        // 2. Get Subcategories (level 2)
        const subcategories = flatCategories.filter(c => c.parentCategory?.id === root.id && c.active);

        return {
            ...root,
            subcategories: subcategories.map(sub => {
                // 3. Get Children (level 3)
                const children = flatCategories
                    .filter(c => c.parentCategory?.id === sub.id && c.active)
                    .map(c => c.name);

                return {
                    id: sub.id,
                    name: sub.name,
                    children
                };
            })
        };
    });
};
