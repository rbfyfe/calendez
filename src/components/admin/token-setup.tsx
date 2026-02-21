"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export function TokenSetup() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const res = await fetch("/api/admin/setup-token");
        const data = await res.json();
        if (data.mode === "redis") {
          setLoading(false);
          return;
        }
        if (data.token) {
          setToken(data.token);
        } else if (data.error) {
          setError(data.error);
        } else {
          setError(data.message);
        }
      } catch {
        setError("Failed to fetch token");
      } finally {
        setLoading(false);
      }
    }
    fetchToken();
  }, []);

  if (loading) return null;
  if (!token && !error) return null;

  async function copyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h3 className="text-sm font-medium text-blue-900 mb-2">
        Deploy Without Redis
      </h3>
      {error ? (
        <p className="text-sm text-blue-800">{error}</p>
      ) : (
        <>
          <p className="text-sm text-blue-800 mb-3">
            No Redis configured. To make your booking page work in production,
            add this as a Vercel environment variable:
          </p>
          <div className="mb-2">
            <code className="text-xs text-blue-700 font-medium">
              ENCRYPTED_OWNER_REFRESH_TOKEN
            </code>
          </div>
          <div className="flex items-start gap-2">
            <input
              type="text"
              readOnly
              value={token ?? ""}
              className="flex-1 text-xs font-mono bg-white border border-blue-300 rounded px-3 py-2 text-blue-900"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={copyToken}
              className="shrink-0"
            >
              {copied ? "Copied!" : "Copy"}
            </Button>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            After adding this to Vercel, redeploy for it to take effect.
            Config uses defaults from calendez.config.defaults.ts — edit that
            file and redeploy to customize.
          </p>
        </>
      )}
    </div>
  );
}
