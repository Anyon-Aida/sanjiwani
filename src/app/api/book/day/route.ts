import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keyDay, keyBooking } from "@/lib/booking";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const date = u.searchParams.get("date");
  if (!date) return NextResponse.json({ ok: false, error: "INVALID_DATE" }, { status: 400 });

  const taken = await redis.smembers(keyDay(date));
  const detailed: Record<string, string>[] = [];

  for (const idx of taken) {
    const rec = await redis.hgetall<Record<string, string>>(keyBooking(date, Number(idx)));
    if (rec && Object.keys(rec).length) detailed.push(rec);
  }

  return NextResponse.json({ ok: true, taken, detailed });
}
