import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { getFreeBusy, createEvent } from "@/lib/google-calendar";
import { bookingRequestSchema } from "@/lib/validators";
import { toZonedDate } from "@/lib/timezone";
import { addMinutes } from "date-fns";
import { getOwnerAccessToken } from "@/lib/owner-tokens";

export async function POST(request: Request) {
  const body = await request.json();
  const result = bookingRequestSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid booking data", details: result.error.flatten() },
      { status: 400 }
    );
  }

  const { eventSlug, date, time, timezone, name, email, notes } = result.data;

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

  // Compute start and end times
  const startDate = toZonedDate(date, time, timezone);
  const endDate = addMinutes(startDate, eventType.duration);

  // Race condition protection: re-check availability before creating event
  try {
    const busyPeriods = await getFreeBusy(
      accessToken,
      config.owner.calendarId,
      startDate.toISOString(),
      endDate.toISOString()
    );

    if (busyPeriods.length > 0) {
      return NextResponse.json(
        {
          error:
            "This time slot is no longer available. Please select a different time.",
        },
        { status: 409 }
      );
    }
  } catch (error) {
    console.error("Failed to verify availability:", error);
    return NextResponse.json(
      { error: "Failed to verify availability" },
      { status: 500 }
    );
  }

  // Create the calendar event
  try {
    const description = [
      `Booked via Calendez`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      notes ? `Notes: ${notes}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const event = await createEvent({
      accessToken: accessToken,
      calendarId: config.owner.calendarId,
      summary: `${eventType.title} with ${name}`,
      description,
      startDateTime: startDate.toISOString(),
      endDateTime: endDate.toISOString(),
      timezone,
      attendeeEmail: email,
    });

    return NextResponse.json({
      success: true,
      eventId: event.id,
      htmlLink: event.htmlLink,
    });
  } catch (error) {
    console.error("Failed to create event:", error);
    return NextResponse.json(
      { error: "Failed to create booking" },
      { status: 500 }
    );
  }
}
