import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { DAY_SLOTS, keyDay, slotsNeeded } from "@/lib/booking";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const date = u.searchParams.get("date");       // YYYY-MM-DD
  const duration = Number(u.searchParams.get("duration") ?? "60");

  if (!date || Number.isNaN(duration)) {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST" }, { status: 400 });
  }

  // a nap foglalt indexei (Set<String>)
  const taken: string[] = (await redis.smembers(keyDay(date))) ?? [];

  // mely kezdő indexek NEM választhatók (átfedés lenne / kilógna)
  const need = slotsNeeded(duration);
  const disabled: number[] = [];
  for (let start = 0; start <= DAY_SLOTS - need; start++) {
    // ha bármelyik érintett index foglalt → tiltjuk
    let bad = false;
    for (let k = 0; k < need; k++) {
      if (taken.includes(String(start + k))) { bad = true; break; }
    }
    if (bad) disabled.push(start);
  }

  return NextResponse.json({ ok: true, disabled });
}
