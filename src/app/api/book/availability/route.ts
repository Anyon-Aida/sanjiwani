import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keyDay, DAY_SLOTS, slotsNeeded } from "@/lib/booking";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const date = u.searchParams.get("date") || "";
  const duration = Number(u.searchParams.get("duration") || "60");
  const staffId = u.searchParams.get("staffId") || "";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ ok: false, error: "BAD_DATE" }, { status: 400 });
  }
  if (!staffId) {
    return NextResponse.json({ ok: false, error: "MISSING_STAFF" }, { status: 400 });
  }

  const need = slotsNeeded(duration);

  // A nap foglalt slotjai staff szerint
  const taken = await redis.smembers(keyDay(date, staffId)); // ["0","1","2"...]
  const takenSet = new Set(taken.map(Number));

  const disabled: number[] = [];
  for (let start = 0; start <= DAY_SLOTS - need; start++) {
    let overlaps = false;
    for (let k = 0; k < need; k++) {
      if (takenSet.has(start + k)) { overlaps = true; break; }
    }
    if (overlaps) disabled.push(start);
  }

  return NextResponse.json({ ok: true, disabled });
}
