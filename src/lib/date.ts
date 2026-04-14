export const DATE_MIN = "2000-01-01";
export const DATE_MAX = "2100-12-31";

export const getTodayStr = () => new Date().toISOString().split("T")[0];

export const isValidDate = (dateString: string | undefined | null) => {
  if (!dateString) return true; // Allow empty if not required
  const date = new Date(dateString);
  const year = date.getFullYear();
  return year >= 2000 && year <= 2100;
};
