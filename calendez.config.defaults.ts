import type { CalendezConfig } from "@/lib/types";

const defaults: CalendezConfig = {
  events: [
    {
      slug: "quick-chat",
      title: "15 Min Quick Chat",
      description: "A short introductory call to see if we're a good fit.",
      duration: 15,
      location: "Google Meet",
    },
    {
      slug: "meeting",
      title: "30 Min Meeting",
      description: "A standard meeting to discuss your project or idea.",
      duration: 30,
      location: "Google Meet",
    },
    {
      slug: "consultation",
      title: "60 Min Consultation",
      description: "An in-depth session to dive deep into your needs.",
      duration: 60,
      location: "Google Meet",
    },
  ],
  availability: {
    timezone: "America/New_York",
    schedule: {
      1: { start: "09:00", end: "17:00" },
      2: { start: "09:00", end: "17:00" },
      3: { start: "09:00", end: "17:00" },
      4: { start: "09:00", end: "17:00" },
      5: { start: "09:00", end: "17:00" },
    },
    bufferMinutes: 10,
    maxDaysInAdvance: 30,
    minNoticeMinutes: 120,
  },
  owner: {
    name: "Your Name",
    calendarId: "primary",
  },
  branding: {
    accentColor: "#2563eb",
    logoUrl: null,
  },
};

export default defaults;
