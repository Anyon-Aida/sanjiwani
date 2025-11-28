import { NextResponse } from "next/server";
import { redis } from "@/lib/redis"; // ugyanaz, amit a foglalásnál vagy máshol használsz

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 1) egy sima PING – Upstash felől ez már "forgalom"
    const pong = await redis.ping();

    // 2) írjunk egy kulcsot is, hogy Upstash konzolon tudd ellenőrizni
    const now = new Date().toISOString();
    await redis.set("heartbeat:sanjwani", now);

    return NextResponse.json({
      ok: true,
      pong,
      writtenAt: now,
    });
  } catch (e) {
    console.error("REDIS_KEEPALIVE_ERROR", e);
    return NextResponse.json(
      { ok: false, error: (e as Error).message },
      { status: 500 }
    );
  }
}
