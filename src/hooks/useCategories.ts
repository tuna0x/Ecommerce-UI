import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../service/categoryService';


export interface FrontendCategory {
  id: number;
  name: string;
  slug: string;
  image?: string;
  subcategories: {
    name: string;
    children: string[];
  }[];
}

export const useCategories = () => {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      // Fetch up to 1000 categories to ensure we get the whole tree (0-indexed)
      const res = await categoryService.getAll(0, 1000);
      const rawCategories = res.data?.result || [];

      // Filter active only
      const activeCategories = rawCategories.filter(c => c.active);

      // Level 1: Root categories (no parent)
      const roots = activeCategories.filter(c => !c.parentCategory);

      // Build tree
      const tree: FrontendCategory[] = roots.map(root => {
        // Level 2: Subcategories
        const subs = activeCategories.filter(c => c.parentCategory?.id === root.id);
        
        return {
          id: root.id,
          name: root.name,
          slug: root.slug,
          // Convert level 2 and level 3
          subcategories: subs.map(sub => {
            // Level 3: Children of subcategory
            const children = activeCategories.filter(c => c.parentCategory?.id === sub.id);
            return {
              name: sub.name,
              children: children.map(c => c.name),
            };
          }),
        };
      });

      return tree;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes globally
  });
};
