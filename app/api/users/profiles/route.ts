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

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });

  try {
    const body = await req.json();
    const ids = Array.isArray(body?.ids)
      ? [...new Set((body.ids as unknown[]).map((id) => String(id)))]
      : [];
    const validIds = ids.filter((id): id is string => /^\d{17,20}$/.test(id));

    if (validIds.length === 0) {
      return NextResponse.json({ profiles: {} });
    }

    const res = await safeBotFetch(`${BOT_API_URL}/api/users/profiles`, {
      method: "POST",
      headers: botHeaders(),
      body: JSON.stringify({ ids: validIds }),
      cache: "no-store",
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
  } catch (err) {
    console.error("[profiles POST]", err);
    return NextResponse.json({ error: "Bot API unreachable" }, { status: 503 });
  }
}