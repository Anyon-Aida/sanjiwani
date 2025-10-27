import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  const { name, email, phone, message } = await req.json();

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "MISSING_FIELDS" },
      { status: 400 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  const owner = process.env.OWNER_EMAIL;

  // ha nincs beállítva e-mail küldés, akkor is válaszolunk OK-val (ne akadjon meg a folyamat)
  if (!apiKey || !owner) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    const resend = new Resend(apiKey);

    // Tulaj értesítése
    await resend.emails.send({
      from: "Kapcsolat <noreply@your-verified-domain>",
      to: owner,
      subject: "Új üzenet a kapcsolat űrlapról",
      replyTo: email,
      text: [
        `Név: ${name}`,
        `E-mail: ${email}`,
        `Telefon: ${phone || "-"}`,
        "",
        `Üzenet:`,
        message,
      ].join("\n"),
    });

    // (opció) automata válasz a feladónak – csak ha van verified domain/teszt mód oké
    await resend.emails.send({
      from: "Sanjiwani <noreply@your-verified-domain>",
      to: email,
      subject: "Üzeneted megérkezett",
      text:
        "Köszönjük a megkeresést! Hamarosan felvesszük veled a kapcsolatot.\n\nÜdv,\nSanjiwani",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Resend hibaüzenet továbbadása – hasznos a diagnózishoz
    const msg =
      err && typeof err === "object" && "message" in err
        ? (err as any).message
        : "MAIL_ERROR";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
