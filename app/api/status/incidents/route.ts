import { NextRequest, NextResponse } from "next/server";
import { vanta } from "@/lib/vanta";
import { ADMIN_ID } from "@/lib/constants";
import { getSession } from '@/lib/auth';

export async function PATCH(req: NextRequest) {
  const user = await getSession();
  if (!user || user.user.id !== ADMIN_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { incidentId, title, description } = (body ?? {}) as {
    incidentId?: string;
    title?: string;
    description?: string;
  };

  if (!incidentId || typeof incidentId !== "string") {
    return NextResponse.json({ error: "incidentId required" }, { status: 400 });
  }

  const data: { title?: string; description?: string } = {};
  if (typeof title === "string") data.title = title.trim();
  if (typeof description === "string") data.description = description.trim();

  try {
    await vanta.uptime.updateIncident({
      incidentId,
      data,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("updateIncident failed", err);
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}