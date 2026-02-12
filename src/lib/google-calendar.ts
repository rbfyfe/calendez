import { calendar_v3, auth as googleAuth } from "@googleapis/calendar";

function getCalendarClient(accessToken: string): calendar_v3.Calendar {
  const oauth2Client = new googleAuth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  return new calendar_v3.Calendar({ auth: oauth2Client });
}

export interface BusyPeriod {
  start: string; // ISO 8601
  end: string; // ISO 8601
}

export async function getFreeBusy(
  accessToken: string,
  calendarId: string,
  timeMin: string,
  timeMax: string
): Promise<BusyPeriod[]> {
  const calendar = getCalendarClient(accessToken);
  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      items: [{ id: calendarId }],
    },
  });

  const busy = response.data.calendars?.[calendarId]?.busy ?? [];
  return busy
    .filter(
      (b): b is { start: string; end: string } =>
        typeof b.start === "string" && typeof b.end === "string"
    )
    .map((b) => ({ start: b.start, end: b.end }));
}

export interface CreateEventParams {
  accessToken: string;
  calendarId: string;
  summary: string;
  description: string;
  startDateTime: string;
  endDateTime: string;
  timezone: string;
  attendeeEmail: string;
}

export async function createEvent(params: CreateEventParams) {
  const calendar = getCalendarClient(params.accessToken);
  const response = await calendar.events.insert({
    calendarId: params.calendarId,
    requestBody: {
      summary: params.summary,
      description: params.description,
      start: {
        dateTime: params.startDateTime,
        timeZone: params.timezone,
      },
      end: {
        dateTime: params.endDateTime,
        timeZone: params.timezone,
      },
      attendees: [{ email: params.attendeeEmail }],
    },
  });
  return response.data;
}
