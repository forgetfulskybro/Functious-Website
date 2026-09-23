import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionGuilds } from "@/lib/auth";
import { addBirthdayBlacklist, removeBirthdayBlacklist } from "@/lib/api";

type Params = { params: Promise<{ guildId: string }> };

function canManageGuild(permissions: string, owner: boolean): boolean {
  if (owner) return true;
  const perms = BigInt(permissions);
  const MANAGE_GUILD = BigInt(0x20);
  const ADMINISTRATOR = BigInt(0x8);
  return (perms & MANAGE_GUILD) === MANAGE_GUILD || (perms & ADMINISTRATOR) === ADMINISTRATOR;
}

async function authorize(session: { accessToken: string } | null, guildId: string) {
  if (!session) return { error: NextResponse.json({ error: "Unauthorised" }, { status: 401 }) };
  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find((g) => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild.permissions, userGuild.owner)) {
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
      return NextResponse.json({ error: "A valid Discord user ID is required" }, { status: 400 });
    }
    const result = await addBirthdayBlacklist(guildId, userId);
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
      return NextResponse.json({ error: "A valid Discord user ID is required" }, { status: 400 });
    }
    const result = await removeBirthdayBlacklist(guildId, userId);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to update blacklist" }, { status: 500 });
  }
}