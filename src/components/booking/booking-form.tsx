"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BookingFormProps {
  onSubmit: (data: { name: string; email: string; notes: string }) => void;
  submitting: boolean;
}

export function BookingForm({ onSubmit, submitting }: BookingFormProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    onSubmit({ name: name.trim(), email: email.trim(), notes: notes.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="font-semibold text-lg">Your Details</h3>
      <div>
        <Label htmlFor="booking-name">Name *</Label>
        <Input
          id="booking-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          required
        />
      </div>
      <div>
        <Label htmlFor="booking-email">Email *</Label>
        <Input
          id="booking-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="jane@example.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="booking-notes">Notes (optional)</Label>
        <Textarea
          id="booking-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What would you like to discuss?"
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full" disabled={submitting || !name || !email}>
        {submitting ? "Booking..." : "Confirm Booking"}
      </Button>
    </form>
  );
}
