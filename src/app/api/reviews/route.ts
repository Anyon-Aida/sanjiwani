// src/app/api/reviews/route.ts
import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const CACHE_KEY = "reviews:google";
export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET() {
  const raw = await redis.get(CACHE_KEY);
  if (!raw) {
    return NextResponse.json(
      { ok: false, message: "Nincs cache-ben adat, futtasd a /api/cron/reviews-t." },
      { status: 404 }
    );
  }

  // Upstash Redis .get visszaadhat stringet vagy objektumot – mi stringet mentettünk.
  const data = typeof raw === "string" ? JSON.parse(raw) : raw;
  return NextResponse.json({ ok: true, data });
}
