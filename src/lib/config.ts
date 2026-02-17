import { Redis } from "@upstash/redis";
import type { CalendezConfig } from "@/lib/types";
import defaults from "../../calendez.config.defaults";

function getRedis(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

const CONFIG_KEY = "calendez:config";

export async function getConfig(): Promise<CalendezConfig> {
  const redis = getRedis();
  if (!redis) {
    // No Redis configured — use defaults (works for local dev without KV)
    return defaults;
  }

  const stored = await redis.get<CalendezConfig>(CONFIG_KEY);
  if (stored) {
    return stored;
  }

  // First run — seed from defaults
  await redis.set(CONFIG_KEY, defaults);
  return defaults;
}

export async function setConfig(config: CalendezConfig): Promise<void> {
  const redis = getRedis();
  if (!redis) {
    throw new Error(
      "Redis is not configured. Set KV_REST_API_URL and KV_REST_API_TOKEN."
    );
  }
  await redis.set(CONFIG_KEY, config);
}

/**
 * Auto-populate the owner name from Google profile on first sign-in.
 * Only updates if the current name is still the default placeholder.
 */
export async function autoPopulateOwnerName(name: string): Promise<void> {
  try {
    const config = await getConfig();
    if (config.owner.name === "Your Name") {
      const redis = getRedis();
      if (redis) {
        await setConfig({ ...config, owner: { ...config.owner, name } });
      }
    }
  } catch (error) {
    console.error("Failed to auto-populate owner name:", error);
  }
}
