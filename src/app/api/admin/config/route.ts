import { NextResponse } from "next/server";
import { auth, isOwner } from "@/lib/auth";
import { getConfig, setConfig } from "@/lib/config";
import { configSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !isOwner(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await getConfig();
  return NextResponse.json(config);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.email || !isOwner(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const result = configSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid config", details: result.error.flatten() },
      { status: 400 }
    );
  }

  try {
    await setConfig(result.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save config";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
