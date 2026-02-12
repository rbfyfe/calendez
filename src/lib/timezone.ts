import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

/**
 * Create a Date object representing a specific time in a specific timezone.
 * E.g., toZonedDate("2026-02-15", "09:00", "America/New_York") returns
 * a Date representing 9am Eastern on Feb 15, 2026.
 */
export function toZonedDate(
  dateStr: string,
  timeStr: string,
  timezone: string
): Date {
  // TZDate creates a date in the specified timezone
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return new TZDate(year, month - 1, day, hours, minutes, 0, 0, timezone);
}

/**
 * Format a Date object as "HH:mm" in the specified timezone.
 */
export function formatTimeInZone(date: Date, timezone: string): string {
  const zoned = new TZDate(date.getTime(), timezone);
  return format(zoned, "HH:mm");
}

/**
 * Format a Date object as ISO 8601 string with timezone offset.
 */
export function toISOWithTimezone(date: Date, timezone: string): string {
  const zoned = new TZDate(date.getTime(), timezone);
  return zoned.toISOString();
}

/**
 * Get the day of week (0-6) for a date string in a given timezone.
 */
export function getDayOfWeek(dateStr: string, timezone: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const zoned = new TZDate(year, month - 1, day, 12, 0, 0, 0, timezone);
  return zoned.getDay();
}
