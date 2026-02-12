"use client";

import type { TimeSlot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  loading: boolean;
  selectedTime: string | null;
  onSelect: (slot: TimeSlot) => void;
}

export function TimeSlotPicker({
  slots,
  loading,
  selectedTime,
  onSelect,
}: TimeSlotPickerProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-4">
        No available times for this date.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
      {slots.map((slot) => (
        <Button
          key={slot.time}
          variant={selectedTime === slot.time ? "default" : "outline"}
          className="w-full justify-center"
          onClick={() => onSelect(slot)}
        >
          {slot.time}
        </Button>
      ))}
    </div>
  );
}
