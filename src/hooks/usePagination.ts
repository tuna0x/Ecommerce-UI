import { useMemo, useState } from "react";

export function usePagination<T>(items: T[], itemsPerPage: number = 12) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);

  // Clamp the page at render time — no side effects needed
  const safePage = totalPages > 0 && currentPage > totalPages ? 1 : currentPage;

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return items.slice(start, start + itemsPerPage);
  }, [items, safePage, itemsPerPage]);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    setCurrentPage,
  };
}
