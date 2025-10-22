// src/app/api/email-test/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_EMAIL;
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";

  if (!apiKey || !to) {
    return NextResponse.json({ ok:false, reason:"missing_config", have:{ apiKey:!!apiKey, to:!!to, from } }, { status:400 });
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const resp = await resend.emails.send({
      from,
      to,
      subject: "Sanjiwani – tesztlevél",
      text: "Ha ezt megkapod, a Resend működik.",
    });
    console.log("TESTMAIL_RESULT", JSON.stringify(resp));
    return NextResponse.json({ ok:true, mail: resp });
  } catch (e) {
    console.error("TESTMAIL_ERROR", e);
    return NextResponse.json({ ok:false, error: String((e as Error).message ?? e) }, { status:500 });
  }
}
