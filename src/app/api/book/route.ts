import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";
import { keyDay, keyBooking, slotsNeeded, DAY_SLOTS, hhmmFromIndex } from "@/lib/booking";
import { priceFor, fmtHUF } from "@/lib/pricing";

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
  email?: string; // ÚJ
};

function isEmail(x?: string) {
  return !!x && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x);
}

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

  const ok = await redis.eval(LUA_TRY_BOOK, [keyDay(b.date)], indices);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "CONFLICT" }, { status: 409 });
  }

  // rekord mentés
  const price = priceFor(b.durationMin);
  const record = {
    serviceId: b.serviceId,
    serviceName: b.serviceName,
    customerName: b.customerName,
    phone: b.phone,
    email: b.email ?? null,
    durationMin: b.durationMin,
    startIndex: b.startIndex,
    date: b.date,
    price,
    createdAt: new Date().toISOString(),
  };
  await redis.hset(keyBooking(b.date, b.startIndex), record);

  // e-mail(ek)
  const apiKey = process.env.RESEND_API_KEY;
  const owner = process.env.OWNER_EMAIL;
  const fromAddr = process.env.RESEND_FROM || "onboarding@resend.dev";

  let mail: any = null;
  if (apiKey && (owner || isEmail(b.email))) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(apiKey);
      const timeLabel = hhmmFromIndex(b.startIndex);
      const lines = [
        `Szolgáltatás: ${b.serviceName} (${b.durationMin} perc)`,
        `Időpont: ${b.date} ${timeLabel}`,
        `Végösszeg: ${fmtHUF(price)}`,
        `Név: ${b.customerName}`,
        `Telefon: ${b.phone}`,
      ].join("\n");

      // tulajnak
      if (owner) {
        await resend.emails.send({
          from: fromAddr,
          to: owner,
          subject: `Új foglalás – ${b.serviceName} (${b.date} ${timeLabel})`,
          text: lines,
        });
      }

      // vásárlónak
      if (isEmail(b.email)) {
        mail = await resend.emails.send({
          from: fromAddr,
          to: b.email!,
          subject: "Foglalás visszaigazolás",
          text:
            `Köszönjük a foglalásod!\n\n` +
            `${lines}\n\n` +
            `Ha módosítani szeretnél, hívd ezt a számot: ${b.phone}`,
        });
      }
    } catch (err) {
      console.error("Resend error:", err);
      mail = { error: "MAIL_ERROR" };
    }
  }

  return NextResponse.json({ ok: true, mail });
}
