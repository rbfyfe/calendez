"use client";

import type { Availability, DaySchedule } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface AvailabilityEditorProps {
  availability: Availability;
  onChange: (availability: Availability) => void;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function AvailabilityEditor({
  availability,
  onChange,
}: AvailabilityEditorProps) {
  function toggleDay(day: number) {
    const schedule = { ...availability.schedule } as Record<string, DaySchedule | undefined>;
    const key = String(day);
    if (schedule[key]) {
      delete schedule[key];
    } else {
      schedule[key] = { start: "09:00", end: "17:00" };
    }
    onChange({ ...availability, schedule });
  }

  function updateDay(day: number, field: "start" | "end", value: string) {
    const schedule = { ...availability.schedule } as Record<string, DaySchedule | undefined>;
    const key = String(day);
    const existing = schedule[key];
    if (existing) {
      schedule[key] = { ...existing, [field]: value };
      onChange({ ...availability, schedule });
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Availability</h3>

      <div>
        <Label htmlFor="timezone">Timezone</Label>
        <Input
          id="timezone"
          value={availability.timezone}
          onChange={(e) =>
            onChange({ ...availability, timezone: e.target.value })
          }
          placeholder="America/New_York"
        />
      </div>

      <div className="space-y-2">
        <Label>Working Hours</Label>
        {DAY_NAMES.map((name, day) => {
          const key = String(day);
          const schedule = (availability.schedule as Record<string, DaySchedule | undefined>)[key];
          const isActive = !!schedule;

          return (
            <div key={day} className="flex items-center gap-3">
              <Switch checked={isActive} onCheckedChange={() => toggleDay(day)} />
              <span className="w-24 text-sm">{name}</span>
              {isActive && schedule && (
                <>
                  <Input
                    type="time"
                    value={schedule.start}
                    onChange={(e) => updateDay(day, "start", e.target.value)}
                    className="w-32"
                  />
                  <span className="text-sm text-gray-500">to</span>
                  <Input
                    type="time"
                    value={schedule.end}
                    onChange={(e) => updateDay(day, "end", e.target.value)}
                    className="w-32"
                  />
                </>
              )}
              {!isActive && (
                <span className="text-sm text-gray-400">Unavailable</span>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="buffer">Buffer (minutes)</Label>
          <Input
            id="buffer"
            type="number"
            value={availability.bufferMinutes}
            onChange={(e) =>
              onChange({
                ...availability,
                bufferMinutes: parseInt(e.target.value) || 0,
              })
            }
            min={0}
            max={120}
          />
          <p className="text-xs text-gray-400 mt-1">Gap between meetings</p>
        </div>
        <div>
          <Label htmlFor="advance">Max days in advance</Label>
          <Input
            id="advance"
            type="number"
            value={availability.maxDaysInAdvance}
            onChange={(e) =>
              onChange({
                ...availability,
                maxDaysInAdvance: parseInt(e.target.value) || 30,
              })
            }
            min={1}
            max={365}
          />
        </div>
        <div>
          <Label htmlFor="notice">Min notice (minutes)</Label>
          <Input
            id="notice"
            type="number"
            value={availability.minNoticeMinutes}
            onChange={(e) =>
              onChange({
                ...availability,
                minNoticeMinutes: parseInt(e.target.value) || 0,
              })
            }
            min={0}
            max={10080}
          />
          <p className="text-xs text-gray-400 mt-1">Minimum lead time</p>
        </div>
      </div>
    </div>
  );
}
