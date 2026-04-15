/**
 * Formats a number or string of digits with dots as thousands separators.
 * Example: 1000000 -> 1.000.000
 */
export const formatNumberWithDots = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === "") return "";
  
  const strVal = val.toString();
  const isNegative = strVal.startsWith("-");
  
  // Remove all non-digit characters to format digits only
  const cleanVal = strVal.replace(/\D/g, "");
  
  // Add dots as thousands separators
  const formattedDigits = cleanVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  
  return isNegative ? `-${formattedDigits}` : formattedDigits;
};

/**
 * Removes dots from a formatted string to get the raw number.
 * Example: 1.000.000 -> 1000000
 */
export const parseNumberFromDots = (val: string): number => {
  if (!val) return 0;
  // Keep only digits and the minus sign
  const cleanVal = val.replace(/[^\d-]/g, "");
  if (cleanVal === "" || cleanVal === "-") return 0;
  return Number(cleanVal);
};
