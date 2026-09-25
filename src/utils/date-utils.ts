/**
 * Date and Time formatting utilities to ensure proper local timezone rendering.
 */

/**
 * Formats a Date, ISO date string, or timestamp to local "YYYY-MM-DD HH:mm".
 * Uses the client's local timezone (e.g. IST) instead of UTC.
 */
export const formatLocalDateTime = (dateInput?: string | Date | null): string => {
  if (!dateInput) return 'N/A';
  try {
    // If it's a string like "2026-09-15 11:54", check if already formatted
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const pad = (n: number) => n.toString().padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return 'N/A';
  }
};

/**
 * Formats a Date or ISO date string to local "YYYY-MM-DD".
 */
export const formatLocalDate = (dateInput?: string | Date | null): string => {
  if (!dateInput) return 'N/A';
  try {
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    if (isNaN(d.getTime())) return String(dateInput);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  } catch {
    return 'N/A';
  }
};

/**
 * Returns current local datetime string formatted for datetime-local input "YYYY-MM-DDTHH:mm".
 */
export const getLocalInputDateTime = (date = new Date()): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
