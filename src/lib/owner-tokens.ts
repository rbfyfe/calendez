import { Redis } from "@upstash/redis";
import crypto from "crypto";

const TOKENS_KEY = "calendez:owner-tokens";

interface OwnerTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix seconds
}

// In-memory fallback for local dev without Redis
let inMemoryTokens: string | null = null;

// Module-level access token cache for env-var mode (survives within a warm serverless instance)
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

// Stores the encrypted refresh token after sign-in so the admin page can show it
// for env var setup (only populated when Redis is not configured)
let lastEncryptedRefreshToken: string | null = null;

function getRedis(): Redis | null {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

// --- Encryption using AUTH_SECRET (AES-256-GCM) ---

function deriveKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(plaintext: string): string {
  const key = deriveKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, encrypted, authTag]).toString("base64");
}

function decrypt(data: string): string {
  const key = deriveKey();
  const buf = Buffer.from(data, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(buf.length - 16);
  const encrypted = buf.subarray(12, buf.length - 16);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
}

/**
 * Encrypt a refresh token for use as an environment variable.
 * Called by the admin setup-token endpoint so the user can copy
 * the value into their Vercel env vars.
 */
export function encryptRefreshToken(refreshToken: string): string {
  return encrypt(refreshToken);
}

/**
 * Check whether Redis is configured.
 * Used by the admin UI to decide whether to show the token setup flow.
 */
export function isRedisConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// --- Env var fallback: decrypt refresh token and fetch a fresh access token ---

async function loadFromEnvRefreshToken(): Promise<OwnerTokens | null> {
  const envToken = process.env.ENCRYPTED_OWNER_REFRESH_TOKEN;
  if (!envToken) return null;

  // Check module-level cache first (warm instance optimization)
  if (
    cachedAccessToken &&
    Date.now() < (cachedAccessToken.expiresAt - 60) * 1000
  ) {
    // Decrypt refresh token to include in the returned object
    try {
      const refreshToken = decrypt(envToken);
      return {
        accessToken: cachedAccessToken.token,
        refreshToken,
        expiresAt: cachedAccessToken.expiresAt,
      };
    } catch {
      console.error("Failed to decrypt ENCRYPTED_OWNER_REFRESH_TOKEN");
      return null;
    }
  }

  // Cache miss or expired — fetch a fresh access token from Google
  try {
    const refreshToken = decrypt(envToken);

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Env var token refresh failed:", data.error);
      return null;
    }

    const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

    // Cache the access token for this warm instance
    cachedAccessToken = { token: data.access_token, expiresAt };

    if (data.refresh_token && data.refresh_token !== refreshToken) {
      console.warn(
        "Google issued a new refresh token. Your ENCRYPTED_OWNER_REFRESH_TOKEN env var may need updating. " +
          "Sign in at /admin to get the new value."
      );
    }

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt,
    };
  } catch (error) {
    console.error("Failed to load tokens from env var:", error);
    return null;
  }
}

// --- Public API ---

export async function saveOwnerTokens(tokens: OwnerTokens): Promise<void> {
  const json = JSON.stringify(tokens);
  const encryptedValue = encrypt(json);

  const redis = getRedis();
  if (redis) {
    await redis.set(TOKENS_KEY, encryptedValue);
  } else {
    inMemoryTokens = encryptedValue;
    // Also update the module-level cache for env-var mode
    cachedAccessToken = {
      token: tokens.accessToken,
      expiresAt: tokens.expiresAt,
    };
    // Capture encrypted refresh token for admin env var setup
    lastEncryptedRefreshToken = encrypt(tokens.refreshToken);
  }
}

/**
 * Get the encrypted refresh token captured during the last sign-in.
 * Used by the admin setup-token endpoint so the user can copy it
 * into their Vercel env vars as ENCRYPTED_OWNER_REFRESH_TOKEN.
 * Only available when Redis is not configured.
 */
export function getLastEncryptedRefreshToken(): string | null {
  return lastEncryptedRefreshToken;
}

async function loadOwnerTokens(): Promise<OwnerTokens | null> {
  // Tier 1: Redis (if configured)
  const redis = getRedis();
  if (redis) {
    const encryptedValue = await redis.get<string>(TOKENS_KEY);
    if (encryptedValue) {
      try {
        const json = decrypt(encryptedValue);
        return JSON.parse(json) as OwnerTokens;
      } catch {
        console.error("Failed to decrypt owner tokens — admin may need to re-sign in");
        return null;
      }
    }
    return null;
  }

  // Tier 2: Encrypted refresh token from env var (production without Redis)
  const envTokens = await loadFromEnvRefreshToken();
  if (envTokens) return envTokens;

  // Tier 3: In-memory (local dev without Redis)
  if (inMemoryTokens) {
    try {
      const json = decrypt(inMemoryTokens);
      return JSON.parse(json) as OwnerTokens;
    } catch {
      console.error("Failed to decrypt owner tokens — admin may need to re-sign in");
      return null;
    }
  }

  return null;
}

async function refreshTokens(
  refreshToken: string
): Promise<OwnerTokens | null> {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Token refresh failed:", data.error);
      return null;
    }

    const newTokens: OwnerTokens = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
    };

    await saveOwnerTokens(newTokens);
    return newTokens;
  } catch (error) {
    console.error("Failed to refresh owner tokens:", error);
    return null;
  }
}

/**
 * Get the owner's Google Calendar access token.
 * Priority: Redis → env var (ENCRYPTED_OWNER_REFRESH_TOKEN) → in-memory.
 * Used by public API routes (/api/availability, /api/book) that
 * can't use auth() since the visitor isn't logged in.
 */
export async function getOwnerAccessToken(): Promise<string | null> {
  const tokens = await loadOwnerTokens();
  if (!tokens) return null;

  // Check if still valid (with 60-second buffer)
  if (tokens.expiresAt && Date.now() < (tokens.expiresAt - 60) * 1000) {
    return tokens.accessToken;
  }

  // Token expired — refresh
  const refreshed = await refreshTokens(tokens.refreshToken);
  return refreshed?.accessToken ?? null;
}
