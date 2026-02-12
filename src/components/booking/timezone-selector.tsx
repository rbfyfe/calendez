"use client";

import { Label } from "@/components/ui/label";

interface TimezoneSelectorProps {
  value: string;
  onChange: (timezone: string) => void;
}

const TIMEZONES = typeof Intl !== "undefined" && Intl.supportedValuesOf
  ? Intl.supportedValuesOf("timeZone")
  : [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Australia/Sydney",
      "UTC",
    ];

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="timezone" className="text-xs text-gray-500 whitespace-nowrap">
        Timezone:
      </Label>
      <select
        id="timezone"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border rounded px-2 py-1 bg-white text-gray-700 max-w-[200px]"
      >
        {TIMEZONES.map((tz) => (
          <option key={tz} value={tz}>
            {tz.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </div>
  );
}
