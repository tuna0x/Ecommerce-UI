import { useQuery } from '@tanstack/react-query';
import { categoryService } from '../service/categoryService';

export interface FrontendCategory {
  id: number;
  name: string;
  slug: string;
  image?: string;
  parentId?: number | null;
  children: FrontendCategory[]; // Recursive structure
}

export const useCategories = () => {
  return useQuery<FrontendCategory[]>({
    queryKey: ['categories-tree'],
    queryFn: async () => {
      // Fetch up to 1000 categories to ensure we get the whole tree (0-indexed)
      const res = await categoryService.getAll(0, 1000);
      const rawCategories = res.data?.result || [];

      // Filter active only (defensive check for null)
      const activeCategories = rawCategories.filter(c => c.active !== false);

      // Recursive function to build tree
      const buildTree = (parentId: number | null): FrontendCategory[] => {
        return activeCategories
          .filter(c => (c.parentCategory?.id || null) === parentId)
          .map(c => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            children: buildTree(c.id),
          }));
      };

      return buildTree(null); // Root levels
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes globally
  });
};
