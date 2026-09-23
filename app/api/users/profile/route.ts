import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BOT_API_URL = process.env.BOT_API_URL ?? "http://localhost:4000";
const BOT_API_KEY = process.env.BOT_API_KEY ?? "";

function botHeaders() {
  return { "Content-Type": "application/json", "x-api-key": BOT_API_KEY };
}

async function safeBotFetch(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, options);
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Bot API returned non-JSON response (status ${res.status}).`);
    }
    return res;
  } catch {
    throw new Error("Bot API unreachable");
  }
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const res = await safeBotFetch(`${BOT_API_URL}/api/users/${session.user.id}`, {
      headers: botHeaders(),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json({
      timezone: data.timezone ?? null,
      birthday: data.birthday ?? null,
    });
  } catch (err) {
    console.error("[profile GET]", err);
    return NextResponse.json({ error: "Bot API unreachable" }, { status: 503 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const body = await req.json();
    const payload: Record<string, unknown> = {};

    if (body.timezone !== undefined) payload.timezone = body.timezone;
    if (body.birthday !== undefined) payload.birthday = body.birthday;

    if (Object.keys(payload).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const res = await safeBotFetch(`${BOT_API_URL}/api/users/${session.user.id}`, {
      method: "PATCH",
      headers: botHeaders(),
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("[profile PATCH]", err);
    return NextResponse.json({ error: "Bot API unreachable" }, { status: 503 });
  }
}