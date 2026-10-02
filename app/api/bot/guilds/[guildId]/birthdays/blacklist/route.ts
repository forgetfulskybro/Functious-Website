import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionGuilds, canManageGuild } from "@/lib/auth";
import type { Session } from "@/lib/types";
import { addBirthdayBlacklist, removeBirthdayBlacklist } from "@/lib/api";

type Params = { params: Promise<{ guildId: string }> };


async function authorize(session: Session | null, guildId: string) {
  if (!session) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find((g) => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild, String(session.user.id))) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { userGuild };
}

const SNOWFLAKE_RE = /^\d{17,20}$/;

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const session = await getSession();
  const auth = await authorize(session, guildId);
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const userId = body?.userId ?? "";
    if (!SNOWFLAKE_RE.test(userId)) {
      return NextResponse.json({ error: "A valid Fluxer user ID is required" }, { status: 400 });
    }
    const result = await addBirthdayBlacklist(guildId, userId, session!.user.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to update blacklist" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const session = await getSession();
  const auth = await authorize(session, guildId);
  if (auth.error) return auth.error;

  try {
    const userId = req.nextUrl.searchParams.get("userId") ?? "";
    if (!SNOWFLAKE_RE.test(userId)) {
      return NextResponse.json({ error: "A valid Fluxer user ID is required" }, { status: 400 });
    }
    const result = await removeBirthdayBlacklist(guildId, userId, session!.user.id);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to update blacklist" }, { status: 500 });
  }
}