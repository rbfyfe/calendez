import { getConfig } from "@/lib/config";
import { EventTypeCard } from "@/components/event-type-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const config = await getConfig();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          {config.branding.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={config.branding.logoUrl}
              alt={config.owner.name}
              className="w-16 h-16 rounded-full mx-auto mb-4"
            />
          )}
          <h1 className="text-2xl font-bold">{config.owner.name}</h1>
          <p className="text-gray-500 mt-1">
            Select a meeting type to book a time.
          </p>
        </div>

        <div className="space-y-3">
          {config.events.map((event) => (
            <EventTypeCard key={event.slug} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}
