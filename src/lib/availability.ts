import { addMinutes, isBefore, isAfter } from "date-fns";
import type { Availability, DaySchedule, TimeSlot } from "@/lib/types";
import type { BusyPeriod } from "@/lib/google-calendar";
import { toZonedDate, formatTimeInZone, toISOWithTimezone, getDayOfWeek } from "@/lib/timezone";

/**
 * Compute available time slots for a given date, considering:
 * - The owner's working hours (in their timezone)
 * - Existing busy periods from Google Calendar
 * - Buffer time between meetings
 * - Minimum notice time
 * - Event duration
 *
 * Returns slots in the visitor's timezone.
 */
export function computeAvailableSlots(params: {
  date: string; // "YYYY-MM-DD"
  eventDuration: number; // minutes
  availability: Availability;
  busyPeriods: BusyPeriod[];
  visitorTimezone: string;
}): TimeSlot[] {
  const { date, eventDuration, availability, busyPeriods, visitorTimezone } =
    params;

  // Check if this day of the week has working hours configured
  const dayOfWeek = getDayOfWeek(date, availability.timezone);
  const daySchedule = (
    availability.schedule as Record<string, DaySchedule | undefined>
  )[String(dayOfWeek)];

  if (!daySchedule) {
    return []; // Not a working day
  }

  // Generate candidate slots in the owner's timezone
  const dayStart = toZonedDate(date, daySchedule.start, availability.timezone);
  const dayEnd = toZonedDate(date, daySchedule.end, availability.timezone);
  const now = new Date();
  const minNoticeTime = addMinutes(now, availability.minNoticeMinutes);
  const slotIncrement = eventDuration + availability.bufferMinutes;

  const candidates: Date[] = [];
  let slotStart = dayStart;

  while (true) {
    const slotEnd = addMinutes(slotStart, eventDuration);
    // Slot must end before or at working hours end
    if (isAfter(slotEnd, dayEnd)) break;

    candidates.push(new Date(slotStart.getTime()));
    slotStart = addMinutes(slotStart, slotIncrement);
  }

  // Parse busy periods into Date objects
  const busyDates = busyPeriods.map((b) => ({
    start: new Date(b.start),
    end: new Date(b.end),
  }));

  // Filter out slots that overlap with busy periods or are in the past
  const available = candidates.filter((slotStart) => {
    const slotEnd = addMinutes(slotStart, eventDuration);

    // Must be after minimum notice time
    if (isBefore(slotStart, minNoticeTime)) {
      return false;
    }

    // Must not overlap with any busy period
    for (const busy of busyDates) {
      // Overlap check: slotStart < busyEnd && slotEnd > busyStart
      if (isBefore(slotStart, busy.end) && isAfter(slotEnd, busy.start)) {
        return false;
      }
    }

    return true;
  });

  // Convert to visitor's timezone for display
  return available.map((slotStart) => ({
    time: formatTimeInZone(slotStart, visitorTimezone),
    datetime: toISOWithTimezone(slotStart, visitorTimezone),
  }));
}
