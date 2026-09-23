import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionGuilds } from "@/lib/auth";
import { getBotGuildBirthdays, forceBotBirthday } from "@/lib/api";

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

export async function GET(_req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const session = await getSession();
  const auth = await authorize(session, guildId);
  if (auth.error) return auth.error;

  try {
    const data = await getBotGuildBirthdays(guildId);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to load birthdays" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const session = await getSession();
  const auth = await authorize(session, guildId);
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    if (!body.userId || typeof body.userId !== "string") {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }
    const result = await forceBotBirthday(guildId, body.userId, session!.user.id);
    return NextResponse.json(
      result,
      result?.error ? { status: 400 } : { status: 200 },
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to announce birthday" }, { status: 500 });
  }
}