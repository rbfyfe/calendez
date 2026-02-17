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

// --- Public API ---

export async function saveOwnerTokens(tokens: OwnerTokens): Promise<void> {
  const json = JSON.stringify(tokens);
  const encryptedValue = encrypt(json);

  const redis = getRedis();
  if (redis) {
    await redis.set(TOKENS_KEY, encryptedValue);
  } else {
    inMemoryTokens = encryptedValue;
  }
}

async function loadOwnerTokens(): Promise<OwnerTokens | null> {
  const redis = getRedis();
  let encryptedValue: string | null = null;

  if (redis) {
    encryptedValue = await redis.get<string>(TOKENS_KEY);
  } else {
    encryptedValue = inMemoryTokens;
  }

  if (!encryptedValue) return null;

  try {
    const json = decrypt(encryptedValue);
    return JSON.parse(json) as OwnerTokens;
  } catch {
    console.error("Failed to decrypt owner tokens — admin may need to re-sign in");
    return null;
  }
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
 * Reads from Redis (or in-memory fallback), refreshes if expired.
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
