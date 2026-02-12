"use client";

import type { Branding, Owner } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BrandingEditorProps {
  branding: Branding;
  owner: Owner;
  onBrandingChange: (branding: Branding) => void;
  onOwnerChange: (owner: Owner) => void;
}

export function BrandingEditor({
  branding,
  owner,
  onBrandingChange,
  onOwnerChange,
}: BrandingEditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Branding & Profile</h3>

      <div>
        <Label htmlFor="ownerName">Your Name</Label>
        <Input
          id="ownerName"
          value={owner.name}
          onChange={(e) => onOwnerChange({ ...owner, name: e.target.value })}
          placeholder="Your Name"
        />
        <p className="text-xs text-gray-400 mt-1">
          Shown to visitors on the booking page
        </p>
      </div>

      <div>
        <Label htmlFor="calendarId">Calendar ID</Label>
        <Input
          id="calendarId"
          value={owner.calendarId}
          onChange={(e) =>
            onOwnerChange({ ...owner, calendarId: e.target.value })
          }
          placeholder="primary"
        />
        <p className="text-xs text-gray-400 mt-1">
          Use &quot;primary&quot; for your main calendar, or a specific calendar ID
        </p>
      </div>

      <div>
        <Label htmlFor="accentColor">Accent Color</Label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={branding.accentColor}
            onChange={(e) =>
              onBrandingChange({ ...branding, accentColor: e.target.value })
            }
            className="w-10 h-10 rounded border cursor-pointer"
          />
          <Input
            id="accentColor"
            value={branding.accentColor}
            onChange={(e) =>
              onBrandingChange({ ...branding, accentColor: e.target.value })
            }
            placeholder="#2563eb"
            className="w-32"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="logoUrl">Logo URL (optional)</Label>
        <Input
          id="logoUrl"
          value={branding.logoUrl || ""}
          onChange={(e) =>
            onBrandingChange({
              ...branding,
              logoUrl: e.target.value || null,
            })
          }
          placeholder="https://example.com/logo.png"
        />
      </div>
    </div>
  );
}
