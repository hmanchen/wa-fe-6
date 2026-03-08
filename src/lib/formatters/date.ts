import {
  format as formatFns,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isValid,
  parse,
  parseISO,
} from "date-fns";

export function formatDate(
  date: Date | string,
  formatStr = "MMM dd, yyyy"
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  return formatFns(d, formatStr);
}

export function formatRelativeDate(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  if (!isValid(d)) return "";
  if (isToday(d)) return formatDistanceToNow(d, { addSuffix: true });
  if (isYesterday(d)) return "Yesterday";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDateRange(
  start: Date | string,
  end: Date | string,
  formatStr = "MMM dd, yyyy"
): string {
  const startDate = typeof start === "string" ? parseISO(start) : start;
  const endDate = typeof end === "string" ? parseISO(end) : end;
  if (!isValid(startDate) || !isValid(endDate)) return "";
  return `${formatFns(startDate, formatStr)} – ${formatFns(endDate, formatStr)}`;
}

/**
 * Parse YYYY-MM-DD safely in local time (avoids UTC date shift).
 */
export function parseDateOnly(value?: string): Date | undefined {
  if (!value) return undefined;
  const parsed = parse(value, "yyyy-MM-dd", new Date());
  return isValid(parsed) ? parsed : undefined;
}

/**
 * Format Date into YYYY-MM-DD in local time.
 */
export function formatDateOnly(date?: Date): string {
  if (!date || !isValid(date)) return "";
  return formatFns(date, "yyyy-MM-dd");
}
