/**
 * Formats a number or string of digits with dots as thousands separators.
 * Example: 1000000 -> 1.000.000
 */
export const formatNumberWithDots = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === "") return "";
  
  // Remove all non-digit characters
  const cleanVal = val.toString().replace(/\D/g, "");
  
  // Add dots as thousands separators
  return cleanVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

/**
 * Removes dots from a formatted string to get the raw number.
 * Example: 1.000.000 -> 1000000
 */
export const parseNumberFromDots = (val: string): number => {
  const cleanVal = val.replace(/\./g, "");
  return cleanVal === "" ? 0 : Number(cleanVal);
};
