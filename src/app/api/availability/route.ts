import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { getFreeBusy } from "@/lib/google-calendar";
import { computeAvailableSlots } from "@/lib/availability";
import { toZonedDate } from "@/lib/timezone";
import { getOwnerAccessToken } from "@/lib/owner-tokens";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const eventSlug = searchParams.get("event");
  const date = searchParams.get("date");
  const timezone = searchParams.get("tz");

  if (!eventSlug || !date || !timezone) {
    return NextResponse.json(
      { error: "Missing required params: event, date, tz" },
      { status: 400 }
    );
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json(
      { error: "Invalid date format. Use YYYY-MM-DD" },
      { status: 400 }
    );
  }

  const config = await getConfig();
  const eventType = config.events.find((e) => e.slug === eventSlug);

  if (!eventType) {
    return NextResponse.json(
      { error: "Event type not found" },
      { status: 404 }
    );
  }

  // Get the owner's Google Calendar token (works for public visitors too)
  const accessToken = await getOwnerAccessToken();
  if (!accessToken) {
    return NextResponse.json(
      { error: "Calendar not connected. The owner needs to connect their Google Calendar at /admin." },
      { status: 503 }
    );
  }

  // Compute the time range for FreeBusy query (full day in owner's timezone)
  const dayStart = toZonedDate(date, "00:00", config.availability.timezone);
  const dayEnd = toZonedDate(date, "23:59", config.availability.timezone);

  try {
    const busyPeriods = await getFreeBusy(
      accessToken,
      config.owner.calendarId,
      dayStart.toISOString(),
      dayEnd.toISOString()
    );

    const slots = computeAvailableSlots({
      date,
      eventDuration: eventType.duration,
      availability: config.availability,
      busyPeriods,
      visitorTimezone: timezone,
    });

    return NextResponse.json({ slots });
  } catch (error) {
    console.error("Failed to fetch availability:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
