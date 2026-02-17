import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { saveOwnerTokens } from "@/lib/owner-tokens";
import { autoPopulateOwnerName } from "@/lib/config";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    error?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: string;
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          access_type: "offline",
          prompt: "consent",
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/calendar.freebusy",
            "https://www.googleapis.com/auth/calendar.events",
          ].join(" "),
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On initial sign-in, capture the tokens
      if (account) {
        token.accessToken = account.access_token!;
        token.refreshToken = account.refresh_token!;
        token.expiresAt = account.expires_at!;

        // Persist tokens to Redis so public routes can access them
        await saveOwnerTokens({
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: token.expiresAt,
        });

        // Auto-populate owner name from Google profile on first sign-in
        if (profile?.name) {
          await autoPopulateOwnerName(profile.name);
        }

        return token;
      }

      // If the access token hasn't expired, return it
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Access token expired — try to refresh
      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken!,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to refresh token");
        }

        token.accessToken = data.access_token;
        token.expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;
        // Google may return a new refresh token
        if (data.refresh_token) {
          token.refreshToken = data.refresh_token;
        }

        // Sync refreshed tokens to Redis
        await saveOwnerTokens({
          accessToken: token.accessToken!,
          refreshToken: token.refreshToken!,
          expiresAt: token.expiresAt!,
        });

        return token;
      } catch {
        token.error = "RefreshTokenError";
        return token;
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
});

export function isOwner(email: string | null | undefined): boolean {
  return !!email && email === process.env.OWNER_EMAIL;
}
