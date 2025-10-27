"use client";

type QA = { q: string; a: string };

const QA_ITEMS: QA[] = [
  {
    q: "Melyik masszázst válasszam első alkalommal?",
    a: "Ha még nem jártál nálunk, a 60 perces Traditional Thai vagy az Oily Bali masszázs a legjobb kezdés. A terapeutád az első pár percben rákérdez az igényeidre, és ahhoz igazítja az erősséget.",
  },
  {
    q: "Vannak ellenjavallatok?",
    a: "Akut láz, fertőzés, friss műtét/sérülés, trombózis gyanúja, valamint várandósság első trimeszterében nem javasolt. Kérdés esetén hívj minket!",
  },
  {
    q: "Hogyan módosíthatom vagy mondhatom le az időpontot?",
    a: "Az időpontod a foglalás visszaigazoló emailben kapott hivatkozással, vagy telefonon tudod módosítani/lemondani. Kérjük, legalább 24 órával előtte jelezd.",
  },
  {
    q: "Mennyi ideig tart egy kezelés?",
    a: "Szolgáltatástól függően 60 / 90 / 120 perc. Az érkezést és a felkészülést a kezelési időn felül, plusz 5–10 percben számold.",
  },
];

export default function FAQ() {
  return (
    <section className="container-narrow my-16">
      <h2 className="text-3xl md:text-4xl font-serif tracking-tight mb-6">
        Gyakori kérdések
      </h2>

      <div className="space-y-3">
        {QA_ITEMS.map((item, i) => (
          <details
            key={i}
            className="group rounded-2xl border border-[color:var(--border,#ece8e3)]
                       bg-[color:var(--card-bg,#fff)]/60 shadow-sm open:shadow
                       transition-shadow"
          >
            <summary
              className="flex items-center gap-3 cursor-pointer select-none
                         px-4 md:px-5 py-4 md:py-4
                         text-[15px] md:text-[16px] font-medium
                         list-none"
            >
              <span
                className="inline-flex size-5 shrink-0 items-center justify-center
                           rounded-full border border-[color:var(--border,#ece8e3)]
                           bg-white transition-transform duration-200
                           group-open:rotate-90"
                aria-hidden
              >
                {/* kis „chevron” – fima-szerű */}
                <svg viewBox="0 0 24 24" fill="none" className="size-3.5">
                  <path
                    d="M9 18l6-6-6-6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <span className="flex-1 text-[color:var(--text,#2a261f)]">
                {item.q}
              </span>
            </summary>

            <div className="px-4 md:px-5 pb-5 pt-1 text-[15px] leading-relaxed text-[color:var(--muted,#5b534a)]">
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
