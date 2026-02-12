import type { EventType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface EventInfoPanelProps {
  event: EventType;
  ownerName: string;
}

export function EventInfoPanel({ event, ownerName }: EventInfoPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-gray-500">{ownerName}</p>
        <h2 className="text-xl font-bold mt-1">{event.title}</h2>
      </div>
      <div className="flex flex-wrap gap-2">
        <Badge variant="secondary">{event.duration} min</Badge>
        {event.location && (
          <Badge variant="outline">{event.location}</Badge>
        )}
      </div>
      {event.description && (
        <p className="text-sm text-gray-600">{event.description}</p>
      )}
    </div>
  );
}
