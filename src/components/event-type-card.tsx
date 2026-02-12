import Link from "next/link";
import type { EventType } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EventTypeCardProps {
  event: EventType;
}

export function EventTypeCard({ event }: EventTypeCardProps) {
  return (
    <Link href={`/book/${event.slug}`}>
      <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-blue-600">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg">{event.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{event.description}</p>
            {event.location && (
              <p className="text-sm text-gray-400 mt-2">{event.location}</p>
            )}
          </div>
          <Badge variant="secondary">{event.duration} min</Badge>
        </div>
      </Card>
    </Link>
  );
}
