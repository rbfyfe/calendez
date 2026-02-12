import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";

export async function GET() {
  const config = await getConfig();

  // Return only public-safe fields
  return NextResponse.json({
    events: config.events,
    owner: { name: config.owner.name },
    branding: config.branding,
    availability: {
      timezone: config.availability.timezone,
    },
  });
}
