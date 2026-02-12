import { z } from "zod";

const dayScheduleSchema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM format"),
});

const eventTypeSchema = z.object({
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  title: z.string().min(1).max(100),
  description: z.string().max(500),
  duration: z.number().int().min(5).max(480),
  location: z.string().max(200).optional(),
});

export const configSchema = z.object({
  events: z.array(eventTypeSchema).min(1).max(20),
  availability: z.object({
    timezone: z.string().min(1),
    schedule: z.record(
      z.string().regex(/^[0-6]$/),
      dayScheduleSchema.optional()
    ),
    bufferMinutes: z.number().int().min(0).max(120),
    maxDaysInAdvance: z.number().int().min(1).max(365),
    minNoticeMinutes: z.number().int().min(0).max(10080), // up to 1 week
  }),
  owner: z.object({
    name: z.string().min(1).max(100),
    calendarId: z.string().min(1),
  }),
  branding: z.object({
    accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex color"),
    logoUrl: z.string().url().nullable(),
  }),
});

export const bookingRequestSchema = z.object({
  eventSlug: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD"),
  time: z.string().regex(/^\d{2}:\d{2}$/, "Must be HH:MM"),
  timezone: z.string().min(1),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  notes: z.string().max(1000).optional(),
});

export type ConfigInput = z.infer<typeof configSchema>;
