import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keyDay, keyBooking, slotsNeeded, DAY_SLOTS, hhmmFromIndex } from "@/lib/booking";

const LUA_TRY_BOOK = `
-- KEYS[1] = day key
-- ARGV = indices...
for i=1,#ARGV do
  if redis.call('SISMEMBER', KEYS[1], ARGV[i]) == 1 then
    return 0
  end
end
redis.call('SADD', KEYS[1], unpack(ARGV))
return 1
`;

type Body = {
  date: string;        // "2025-10-21"
  startIndex: number;  // 0..DAY_SLOTS-1
  durationMin: number;
  serviceId: string;
  serviceName: string;
  customerName: string;
  phone: string;
};

export async function POST(req: Request) {
  const b = (await req.json()) as Body;
  const errors: string[] = [];

  if (!/^\d{4}-\d{2}-\d{2}$/.test(b.date)) errors.push("date");
  if (b.startIndex < 0 || b.startIndex >= DAY_SLOTS) errors.push("startIndex");
  if (!b.customerName) errors.push("customerName");
  if (!b.phone) errors.push("phone");
  if (!b.serviceId || !b.serviceName) errors.push("service");
  if (errors.length) {
    return NextResponse.json({ ok: false, error: "BAD_REQUEST", fields: errors }, { status: 400 });
  }

  const need = slotsNeeded(b.durationMin);
  const indices = Array.from({ length: need }, (_, k) => String(b.startIndex + k));

  // atomikus próbafoglalás
  const ok = (await redis.eval(LUA_TRY_BOOK, [keyDay(b.date)], indices)) as number;
  if (!ok) {
    return NextResponse.json({ ok: false, error: "CONFLICT" }, { status: 409 });
  }

  // adatok mentése (csak a kezdő slotnál tartunk részletes rekordot)
  const record = {
    serviceId: b.serviceId,
    serviceName: b.serviceName,
    customerName: b.customerName,
    phone: b.phone,
    durationMin: b.durationMin,
    startIndex: b.startIndex,
    date: b.date,
    createdAt: new Date().toISOString(),
  };
  await redis.hset(keyBooking(b.date, b.startIndex), record);

  // ---- email értesítés (Resend) – dinamikus import + fire-and-forget
  (async () => {
    const apiKey = process.env.RESEND_API_KEY;
    const to = process.env.OWNER_EMAIL; // pl. info@sanjiwani.hu
    if (!apiKey || !to) return;

    try {
      // @ts-ignore: dynamic import for optional Resend package without bundled types
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const startLabel = hhmmFromIndex(b.startIndex);

      await resend.emails.send({
        from: "Foglalás <noreply@sanjwani.hu>", // saját verified domain után
        to,
        subject: `Új foglalás – ${b.serviceName} (${b.date} ${startLabel})`,
        text:
          `Szolgáltatás: ${b.serviceName} (${b.durationMin} perc)\n` +
          `Időpont: ${b.date} ${startLabel}\n` +
          `Név: ${b.customerName}\n` +
          `Telefon: ${b.phone}\n`,
      });
    } catch (e) {
      console.error("Resend email hiba:", e);
    }
  })();

  return NextResponse.json({ ok: true });
}
