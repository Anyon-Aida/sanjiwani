// src/components/FAQ.tsx
"use client";
import React from "react";

type QA = { q: string; a: string };

const ITEMS: QA[] = [
  {
    q: "Melyik masszázst válasszam első alkalommal?",
    a: "Ha bizonytalan vagy, a 60 perces Traditional Thai Massage jó kiindulás. Erősséget a helyszínen egyeztetünk, és az aktuális állapotodhoz igazítjuk."
  },
  {
    q: "Vannak ellenjavallatok?",
    a: "Láz, fertőzés, bőrgyulladás, friss műtét/sérülés, trombózis, előrehaladott terhesség vagy orvosi tiltás esetén nem végzünk kezelést. Kérdés esetén jelezd foglaláskor!"
  },
  {
    q: "Hogyan módosíthatom vagy mondhatom le az időpontot?",
    a: "Ingyenesen módosíthatod/lemondhatod legalább 12 órával a foglalt időpont előtt. Későbbi lemondásnál a kezelési díj 50%-át felszámíthatjuk."
  },
  {
    q: "Mennyi ideig tart egy kezelés?",
    a: "A legtöbb kezelés 60 / 90 / 120 perces. Az érkezést és felkészülést érdemes 5–10 perccel korábban kezdeni, hogy pontosan tudjunk indulni."
  },
  {
    q: "Mit vigyek magammal?",
    a: "Semmit nem muszáj. Tiszta lepedőt, törölközőt és minden szükségest biztosítunk. Érdemes kényelmes ruhában érkezni."
  },
  {
    q: "Kártyával vagy készpénzzel fizethetek?",
    a: "Mindkettő megoldható. Ajándékutalványt is kínálunk, amely a legtöbb szolgáltatásra felhasználható."
  }
];

export default function FAQ() {
  // SEO: struktúrált adat
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": ITEMS.map((i) => ({
      "@type": "Question",
      "name": i.q,
      "acceptedAnswer": { "@type": "Answer", "text": i.a }
    }))
  };

  return (
    <section className="container-narrow my-16">
      <h2 className="section-title">Gyakori kérdések</h2>

      <div className="space-y-3">
        {ITEMS.map((item, idx) => (
          <details
            key={idx}
            className="group rounded-xl border border-[var(--color-soft-border)] bg-[var(--color-soft-bg)] p-0"
          >
            <summary className="flex cursor-pointer select-none items-center gap-3 px-4 py-4 text-[var(--color-text)]">
              {/* chevron */}
              <span
                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-soft-border)]
                           text-[var(--color-muted)] transition-transform group-open:rotate-90"
                aria-hidden
              >
                ▶
              </span>
              <span className="font-medium">{item.q}</span>
            </summary>

            <div className="px-4 pb-4 pt-0 text-[var(--color-muted)] leading-relaxed">
              {item.a}
            </div>
          </details>
        ))}
      </div>

      {/* SEO schema.org */}
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD szükséges
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
    </section>
  );
}
