"use client";

import { useState } from "react";
import type { EventType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface EventTypeEditorProps {
  events: EventType[];
  onChange: (events: EventType[]) => void;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function EventTypeEditor({ events, onChange }: EventTypeEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<EventType>({
    slug: "",
    title: "",
    description: "",
    duration: 30,
    location: "Google Meet",
  });

  function startAdd() {
    setDraft({
      slug: "",
      title: "",
      description: "",
      duration: 30,
      location: "Google Meet",
    });
    setEditingIndex(-1); // -1 means adding new
  }

  function startEdit(index: number) {
    setDraft({ ...events[index] });
    setEditingIndex(index);
  }

  function save() {
    const finalDraft = {
      ...draft,
      slug: draft.slug || slugify(draft.title),
    };

    if (editingIndex === -1) {
      onChange([...events, finalDraft]);
    } else if (editingIndex !== null) {
      const updated = [...events];
      updated[editingIndex] = finalDraft;
      onChange(updated);
    }
    setEditingIndex(null);
  }

  function remove(index: number) {
    onChange(events.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Event Types</h3>
        <Button size="sm" onClick={startAdd} disabled={editingIndex !== null}>
          Add Event Type
        </Button>
      </div>

      {events.map((event, i) => (
        <Card key={event.slug} className="p-4">
          {editingIndex === i ? (
            <EventForm draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setEditingIndex(null)} />
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{event.title}</span>
                  <Badge variant="secondary">{event.duration} min</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{event.description}</p>
                {event.location && (
                  <p className="text-sm text-gray-400 mt-1">{event.location}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">slug: {event.slug}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => startEdit(i)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => remove(i)}
                  disabled={events.length <= 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}

      {editingIndex === -1 && (
        <Card className="p-4">
          <EventForm draft={draft} setDraft={setDraft} onSave={save} onCancel={() => setEditingIndex(null)} />
        </Card>
      )}
    </div>
  );
}

function EventForm({
  draft,
  setDraft,
  onSave,
  onCancel,
}: {
  draft: EventType;
  setDraft: (d: EventType) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="30 Min Meeting"
        />
      </div>
      <div>
        <Label htmlFor="slug">Slug (URL path)</Label>
        <Input
          id="slug"
          value={draft.slug}
          onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
          placeholder={slugify(draft.title) || "meeting"}
        />
        <p className="text-xs text-gray-400 mt-1">
          Leave blank to auto-generate from title
        </p>
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          placeholder="A standard meeting to discuss your project."
          rows={2}
        />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <Label htmlFor="duration">Duration (minutes)</Label>
          <Input
            id="duration"
            type="number"
            value={draft.duration}
            onChange={(e) =>
              setDraft({ ...draft, duration: parseInt(e.target.value) || 30 })
            }
            min={5}
            max={480}
          />
        </div>
        <div className="flex-1">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={draft.location || ""}
            onChange={(e) => setDraft({ ...draft, location: e.target.value })}
            placeholder="Google Meet"
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={onSave} disabled={!draft.title}>
          Save
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
