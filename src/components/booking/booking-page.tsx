"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import type { EventType, TimeSlot } from "@/lib/types";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EventInfoPanel } from "./event-info-panel";
import { TimeSlotPicker } from "./time-slot-picker";
import { TimezoneSelector } from "./timezone-selector";
import { BookingForm } from "./booking-form";

interface BookingPageProps {
  event: EventType;
  ownerName: string;
  ownerTimezone: string;
  maxDaysInAdvance: number;
}

function getLocalTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function BookingPage({
  event,
  ownerName,
  ownerTimezone,
  maxDaysInAdvance,
}: BookingPageProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timezone, setTimezone] = useState(ownerTimezone);

  // Detect visitor's timezone on mount
  useEffect(() => {
    setTimezone(getLocalTimezone());
  }, []);

  const fetchSlots = useCallback(
    async (date: Date, tz: string) => {
      setLoadingSlots(true);
      setSlots([]);
      setSelectedSlot(null);
      setShowForm(false);
      setError(null);

      try {
        const dateStr = format(date, "yyyy-MM-dd");
        const res = await fetch(
          `/api/availability?event=${event.slug}&date=${dateStr}&tz=${encodeURIComponent(tz)}`
        );
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to load slots");
        }
        const data = await res.json();
        setSlots(data.slots);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load slots");
      } finally {
        setLoadingSlots(false);
      }
    },
    [event.slug]
  );

  useEffect(() => {
    if (selectedDate) {
      fetchSlots(selectedDate, timezone);
    }
  }, [selectedDate, timezone, fetchSlots]);

  function handleSelectSlot(slot: TimeSlot) {
    setSelectedSlot(slot);
    setShowForm(true);
  }

  async function handleBook(formData: {
    name: string;
    email: string;
    notes: string;
  }) {
    if (!selectedDate || !selectedSlot) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug: event.slug,
          date: format(selectedDate, "yyyy-MM-dd"),
          time: selectedSlot.time,
          timezone,
          name: formData.name,
          email: formData.email,
          notes: formData.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Booking failed");
      }

      const params = new URLSearchParams({
        name: formData.name,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedSlot.time,
        duration: String(event.duration),
        title: event.title,
      });
      router.push(`/book/${event.slug}/confirmed?${params.toString()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Booking failed");
      setSubmitting(false);
    }
  }

  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDaysInAdvance);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[260px_1fr_260px]">
          {/* Left: Event info */}
          <div className="p-6 border-b md:border-b-0 md:border-r">
            <EventInfoPanel event={event} ownerName={ownerName} />
          </div>

          {/* Center: Calendar */}
          <div className="p-6 border-b lg:border-b-0 lg:border-r">
            <h3 className="font-medium mb-3">Select a Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              disabled={(date) => date < today || date > maxDate}
              className="mx-auto"
            />
            <Separator className="my-4" />
            <TimezoneSelector value={timezone} onChange={setTimezone} />
          </div>

          {/* Right: Time slots or booking form */}
          <div className="p-6">
            {!selectedDate && (
              <p className="text-sm text-gray-400 text-center py-8">
                Pick a date to see available times
              </p>
            )}

            {selectedDate && !showForm && (
              <div>
                <h3 className="font-medium mb-3">
                  {format(selectedDate, "EEEE, MMMM d")}
                </h3>
                <TimeSlotPicker
                  slots={slots}
                  loading={loadingSlots}
                  selectedTime={selectedSlot?.time ?? null}
                  onSelect={handleSelectSlot}
                />
              </div>
            )}

            {showForm && selectedSlot && (
              <div>
                <button
                  onClick={() => setShowForm(false)}
                  className="text-sm text-blue-600 hover:underline mb-3"
                >
                  &larr; Back to times
                </button>
                <p className="text-sm text-gray-600 mb-4">
                  {selectedDate && format(selectedDate, "EEEE, MMMM d")} at{" "}
                  {selectedSlot.time}
                </p>
                <BookingForm onSubmit={handleBook} submitting={submitting} />
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-t border-red-200 text-red-700 text-sm p-3">
            {error}
          </div>
        )}
      </Card>
    </div>
  );
}
