import { notFound } from "next/navigation";
import { getConfig } from "@/lib/config";
import { BookingPage } from "@/components/booking/booking-page";

export const dynamic = "force-dynamic";

interface BookPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookPage({ params }: BookPageProps) {
  const { slug } = await params;
  const config = await getConfig();
  const event = config.events.find((e) => e.slug === slug);

  if (!event) {
    notFound();
  }

  return (
    <BookingPage
      event={event}
      ownerName={config.owner.name}
      ownerTimezone={config.availability.timezone}
      maxDaysInAdvance={config.availability.maxDaysInAdvance}
    />
  );
}
