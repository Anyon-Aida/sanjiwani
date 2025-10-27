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
  const fromAddr = process.env.RESEND_FROM || "onboarding@resend.dev";

  // ha nincs beállítva e-mail küldés, akkor is válaszolunk OK-val (ne akadjon meg a folyamat)
  if (!apiKey || !owner) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  function getErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
        if (
            typeof e === "object" &&
            e !== null &&
            "message" in e &&
            typeof (e as { message: unknown }).message === "string"
        ) {
            return (e as { message: string }).message;
        }
        return "MAIL_ERROR";
    }

  try {
    const resend = new Resend(apiKey);

    // Tulaj értesítése
    await resend.emails.send({
      from: fromAddr,
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
      from: fromAddr,
      to: email,
      subject: "Üzeneted megérkezett",
      text:
        "Köszönjük a megkeresést! Hamarosan felvesszük veled a kapcsolatot.\n\nÜdv,\nSanjiwani",
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = getErrorMessage(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
