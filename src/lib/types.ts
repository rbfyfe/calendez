export interface EventType {
  slug: string;
  title: string;
  description: string;
  duration: number; // minutes
  location?: string;
}

export interface DaySchedule {
  start: string; // "09:00"
  end: string; // "17:00"
}

export interface Availability {
  timezone: string; // IANA timezone, e.g. "America/New_York"
  schedule: Partial<Record<0 | 1 | 2 | 3 | 4 | 5 | 6, DaySchedule>>; // 0=Sun, 6=Sat
  bufferMinutes: number;
  maxDaysInAdvance: number;
  minNoticeMinutes: number;
}

export interface Owner {
  name: string;
  calendarId: string; // "primary" or specific calendar ID
}

export interface Branding {
  accentColor: string; // hex color
  logoUrl: string | null;
}

export interface CalendezConfig {
  events: EventType[];
  availability: Availability;
  owner: Owner;
  branding: Branding;
}

export interface TimeSlot {
  time: string; // "14:00" in visitor's timezone
  datetime: string; // ISO 8601 with timezone offset
}

export interface BookingRequest {
  eventSlug: string;
  date: string; // "2026-02-15"
  time: string; // "14:00"
  timezone: string; // IANA timezone
  name: string;
  email: string;
  notes?: string;
}
