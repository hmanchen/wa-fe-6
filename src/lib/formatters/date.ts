import {
  format as formatFns,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isValid,
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
