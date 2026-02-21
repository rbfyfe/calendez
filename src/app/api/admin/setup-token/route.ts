import { NextResponse } from "next/server";
import { auth, isOwner } from "@/lib/auth";
import {
  isRedisConfigured,
  getLastEncryptedRefreshToken,
} from "@/lib/owner-tokens";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isOwner(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isRedisConfigured()) {
    return NextResponse.json({
      mode: "redis",
      message: "Redis is configured — tokens are stored automatically.",
    });
  }

  const encryptedToken = getLastEncryptedRefreshToken();

  if (!encryptedToken) {
    return NextResponse.json({
      mode: "no-redis",
      token: null,
      message:
        "No refresh token captured yet. Sign out and sign back in to generate the token.",
    });
  }

  return NextResponse.json({
    mode: "no-redis",
    token: encryptedToken,
    message:
      "Copy this value into your Vercel environment variables as ENCRYPTED_OWNER_REFRESH_TOKEN.",
  });
}
