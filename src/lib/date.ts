export const DATE_MIN = "2000-01-01";
export const DATE_MAX = "2100-12-31";

export const FLASH_SALE_SLOTS = [
  { name: "Săn Deal Đêm", start: "00:00:00", end: "02:00:00" },
  { name: "Giờ Vàng Sáng", start: "09:00:00", end: "12:00:00" },
  { name: "Siêu Deal Trưa", start: "12:00:00", end: "15:00:00" },
  { name: "Chớp Nhoáng Chiều", start: "15:00:00", end: "18:00:00" },
  { name: "Deal Hoàng Hôn", start: "18:00:00", end: "21:00:00" },
  { name: "Sale Cuối Ngày", start: "21:00:00", end: "23:59:59" },
];

export const formatToLocalDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

export const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const isValidDate = (dateString: string | undefined | null) => {
  if (!dateString) return true; // Allow empty if not required
  const date = new Date(dateString);
  const year = date.getFullYear();
  return year >= 2000 && year <= 2100;
};

/**
 * Ensures the year in a date string like "YYYY-MM-DD" is between 2000 and 2100.
 * Useful for handling manual keyboard entry in <input type="date" />
 */
export const clampYear = (dateString: string): string => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length !== 3) return dateString;
  
  let year = parseInt(parts[0]);
  if (isNaN(year)) return dateString;

  if (year > 2100) year = 2100;
  // We don't necessarily clamp min here to allow typing (e.g. typing 2 then 0)
  // but we can clamp the max to prevent 5555
  
  const clampedYear = year.toString().padStart(4, "0");
  return `${clampedYear}-${parts[1]}-${parts[2]}`;
};

