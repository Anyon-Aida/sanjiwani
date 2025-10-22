import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keyDay, keyBooking, slotsNeeded, DAY_SLOTS, hhmmFromIndex } from "@/lib/booking";


const LUA_TRY_BOOK = `
for i=1,#ARGV do
  if redis.call('SISMEMBER', KEYS[1], ARGV[i]) == 1 then
    return 0
  end
end
redis.call('SADD', KEYS[1], unpack(ARGV))
return 1
`;

type Body = {
  date: string;
  startIndex: number;
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

  // atomikus foglalás
  const need = slotsNeeded(b.durationMin);
  const indices = Array.from({ length: need }, (_, k) => String(b.startIndex + k));
  const ok = await redis.eval(LUA_TRY_BOOK, [keyDay(b.date)], indices);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "CONFLICT" }, { status: 409 });
  }

  // részletek mentése
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

    // ---- RESEND diagnosztikával
    const owner = process.env.OWNER_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

    let mail: unknown = { skipped: true as const, reason: "missing_config" as const };

    if (apiKey && owner) {
    try {
        const { Resend } = await import("resend");
        const resend = new Resend(apiKey);
        const startLabel = hhmmFromIndex(b.startIndex);

        const resp = await resend.emails.send({
        from,                // fontos: ha NINCS verifikált domain, használd ideiglenesen az onboarding@resend.dev-et
        to: owner,
        subject: `Új foglalás – ${b.serviceName} (${b.date} ${startLabel})`,
        text: [
            `Szolgáltatás: ${b.serviceName} (${b.durationMin} perc)`,
            `Időpont: ${b.date} ${startLabel}`,
            `Név: ${b.customerName}`,
            `Telefon: ${b.phone}`,
        ].join("\n"),
        });

        mail = resp;                            // { data?: {id}, error?: {...}, ... }
        console.log("RESEND_RESULT", JSON.stringify(resp));
    } catch (e) {
        mail = { error: String((e as Error).message ?? e) };
        console.error("RESEND_ERROR", e);
    }
    } else {
    console.warn("RESEND_SKIPPED", { hasKey: !!apiKey, hasOwner: !!owner, from });
    }

    return NextResponse.json({ ok: true, mail });
}
