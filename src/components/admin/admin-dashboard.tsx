"use client";

import { useState, useEffect, useCallback } from "react";
import type { CalendezConfig } from "@/lib/types";
import { EventTypeEditor } from "./event-type-editor";
import { AvailabilityEditor } from "./availability-editor";
import { BrandingEditor } from "./branding-editor";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminDashboard() {
  const [config, setConfig] = useState<CalendezConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (!res.ok) throw new Error("Failed to load config");
      const data = await res.json();
      setConfig(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load config");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  async function saveConfig() {
    if (!config) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save config");
    } finally {
      setSaving(false);
    }
  }

  function updateConfig(partial: Partial<CalendezConfig>) {
    if (!config) return;
    setConfig({ ...config, ...partial });
    setDirty(true);
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Loading configuration...</div>;
  }

  if (!config) {
    return <div className="p-6 text-sm text-red-600">Failed to load configuration.</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">Event Types</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <EventTypeEditor
            events={config.events}
            onChange={(events) => updateConfig({ events })}
          />
        </TabsContent>

        <TabsContent value="availability" className="mt-4">
          <AvailabilityEditor
            availability={config.availability}
            onChange={(availability) => updateConfig({ availability })}
          />
        </TabsContent>

        <TabsContent value="branding" className="mt-4">
          <BrandingEditor
            branding={config.branding}
            owner={config.owner}
            onBrandingChange={(branding) => updateConfig({ branding })}
            onOwnerChange={(owner) => updateConfig({ owner })}
          />
        </TabsContent>
      </Tabs>

      <div className="flex items-center gap-3">
        <Button onClick={saveConfig} disabled={saving || !dirty}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        {dirty && (
          <span className="text-sm text-amber-600">Unsaved changes</span>
        )}
      </div>
    </div>
  );
}
