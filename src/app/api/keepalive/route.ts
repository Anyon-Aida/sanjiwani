import { NextResponse } from "next/server";
import { redis } from "@/lib/redis"; // ugyanaz a kliens, amit a foglalásnál használsz

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // minimális forgalom: PING vagy egy counter növelése
    await redis.ping();
    // vagy: await redis.incr("heartbeat");
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message }, { status: 500 });
  }
}
