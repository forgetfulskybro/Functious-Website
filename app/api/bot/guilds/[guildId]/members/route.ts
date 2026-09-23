import { NextRequest, NextResponse } from "next/server";
import { getSession, getSessionGuilds } from "@/lib/auth";
import { searchBotGuildMembers } from "@/lib/api";

type Params = { params: Promise<{ guildId: string }> };

function canManageGuild(permissions: string, owner: boolean): boolean {
  if (owner) return true;
  const perms = BigInt(permissions);
  const MANAGE_GUILD = BigInt(0x20);
  const ADMINISTRATOR = BigInt(0x8);
  return (perms & MANAGE_GUILD) === MANAGE_GUILD || (perms & ADMINISTRATOR) === ADMINISTRATOR;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { guildId } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  const guilds = await getSessionGuilds(session.accessToken);
  const userGuild = guilds.find((g) => g.id === guildId);
  if (!userGuild || !canManageGuild(userGuild.permissions, userGuild.owner)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const query = req.nextUrl.searchParams.get("query") ?? "";

  try {
    const data = await searchBotGuildMembers(guildId, query);
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Failed to load members" }, { status: 500 });
  }
}