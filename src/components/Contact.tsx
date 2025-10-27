"use client";

import { useMemo, useState } from "react";

// Ezeket kényelmes .env-ből hozni (publikus, mert csak UI-hoz kellenek):
// NEXT_PUBLIC_BUSINESS_ADDRESS="1055 Budapest, Példa utca 12."
// NEXT_PUBLIC_BUSINESS_PHONE="+36 30 123 4567"
// NEXT_PUBLIC_GOOGLE_PLACE_ID="xxxxxxxxxxxxxxxxxxxx"  // ha van Place ID-d
const ADDRESS =
  process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || "1055 Budapest, Példa utca 12.";
const PHONE =
  process.env.NEXT_PUBLIC_BUSINESS_PHONE || "+36 30 123 4567";
const PLACE_ID =
  process.env.NEXT_PUBLIC_GOOGLE_PLACE_ID || "";

/** Google Maps beágyazás: ha van Place ID, azt használjuk, különben cím stringet. */
function useEmbedMapSrc() {
  return useMemo(() => {
    if (PLACE_ID) {
      return `https://www.google.com/maps?q=place_id:${PLACE_ID}&output=embed`;
    }
    const q = encodeURIComponent(ADDRESS);
    return `https://www.google.com/maps?q=${q}&output=embed`;
  }, []);
}

export default function Contact() {
  const mapSrc = useEmbedMapSrc();

  const [sending, setSending] = useState(false);
  const [okMsg, setOkMsg] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setOkMsg(null);
    setErrMsg(null);
    const fd = new FormData(e.currentTarget);
    const agreed = fd.get("agree") === "on";

    if (!agreed) {
      setErrMsg("A küldéshez el kell fogadnod az adatkezelési tájékoztatót.");
      return;
    }

    const payload = {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      message: String(fd.get("message") || ""),
    };

    // nagyon minimális front validáció
    if (!payload.name || !payload.email || !payload.message) {
      setErrMsg("Kérlek töltsd ki a nevet, e-mailt és az üzenetet.");
      return;
    }

    try {
      setSending(true);
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || "Hiba történt");
      setOkMsg("Üzenetedet megkaptuk, hamarosan jelentkezünk!");
      (e.target as HTMLFormElement).reset();
    } catch (err: unknown) {
      setErrMsg(
        err instanceof Error ? err.message : "Nem sikerült elküldeni az üzenetet."
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="container-narrow my-21">
      {/* Fejléc + jobb oldalt cím/telefon, mint a figmán */}
      <div className="flex items-end justify-between gap-6 mb-6">
        <h2 className="text-3xl font-bold font-serif tracking-tight">
          Kapcsolat &amp; Megközelítés
        </h2>
        <div className="text-sm text-[color:var(--muted,#5b534a)]">
          Cím: {ADDRESS} &nbsp;•&nbsp; Telefon: {PHONE}
        </div>
      </div>

      <div className="grid gap-8 md:gap-10 md:grid-cols-2">
        {/* Bal oszlop – űrlap */}
        <form onSubmit={onSubmit} className="space-y-3">
          <input
            name="name"
            placeholder="Name"
            className="w-full rounded-md border border-[color:var(--border,#e9e5df)] bg-white/70 px-4 py-3 outline-none focus:border-[color:var(--accent,#b28c6a)]"
          />
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            className="w-full rounded-md border border-[color:var(--border,#e9e5df)] bg-white/70 px-4 py-3 outline-none focus:border-[color:var(--accent,#b28c6a)]"
          />
          <input
            name="phone"
            placeholder="Phone"
            className="w-full rounded-md border border-[color:var(--border,#e9e5df)] bg-white/70 px-4 py-3 outline-none focus:border-[color:var(--accent,#b28c6a)]"
          />
          <textarea
            name="message"
            placeholder="Message"
            rows={7}
            className="w-full rounded-md border border-[color:var(--border,#e9e5df)] bg-white/70 px-4 py-3 outline-none focus:border-[color:var(--accent,#b28c6a)]"
          />

        <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
        {/* Bal oldal – GDPR checkbox */}
        <label className="flex items-start gap-3 text-sm leading-5 text-[color:var(--muted,#5b534a)] max-w-[70%]">
            <input type="checkbox" name="agree" className="mt-1 size-4 shrink-0" />
            <span>
            I have read and accept the{" "}
            <a
                href="/privacy"
                className="underline underline-offset-2 hover:opacity-80"
            >
                Privacy statement
            </a>{" "}
            and I consent to the storage of my given data.
            </span>
        </label>

        {/* Jobb oldal – Figma gomb */}
        <button
            type="submit"
            disabled={sending}
            className="relative inline-flex h-[45px] w-[110px] items-center justify-center text-[15px] font-light text-white bg-[#9c7a58] border border-[#b9a18d]
            before:absolute before:inset-[-6px] before:border before:border-[#9c7a58] before:content-[''] before:pointer-events-none before:bg-[#f6f2ed]
            hover:brightness-[1.05] active:translate-y-[1px] disabled:opacity-60 disabled:cursor-not-allowed transition-all">

            {sending ? "Küldés…" : "Send"}
        </button>
        </div>

          {/* Visszajelzés */}
          {okMsg && (
            <p className="text-sm text-green-600">{okMsg}</p>
          )}
          {errMsg && (
            <p className="text-sm text-red-600">{errMsg}</p>
          )}
        </form>

        {/* Jobb oszlop – térkép (beágyazott Google Maps) */}
        <div className="rounded-md overflow-hidden border border-[color:var(--border,#e9e5df)] bg-[#e4e3e1]">
          <iframe
            title="Sanjiwani – Térkép"
            src={mapSrc}
            className="h-full w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </section>
  );
}
