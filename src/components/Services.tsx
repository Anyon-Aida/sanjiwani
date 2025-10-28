"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import BookingDialog from "./BookingDialog";

type Category =
  | "Mind"
  | "Olajos"
  | "Meleg / herbál"
  | "Szegmentált"
  | "Száraz (thai)"
  | "Scrub / testradír";

type ServiceVM = {
  id: string;
  name: string;
  category: Exclude<Category, "Mind">;
  durations: number[];
  image: string;
  short?: string;
  pricesByDuration: Record<number, number>;
};

const DURATIONS = [30, 45, 60, 90, 120, 180] as const;

// ha egy szolgáltatásnál nincs image az adatbázisban, innen adunk “fallbacket”
const IMAGE_FALLBACKS: Record<string, string> = {
  "traditional-thai": "/services/traditional-thai.png",
  "oily-bali": "/services/oily-bali.png",
  "thai-foot": "/services/thai-foot.png",
};

const CATEGORY_NAME_MAP: Record<string, Category> = {
  oily: "Olajos",
  warm: "Meleg / herbál",
  segmented: "Szegmentált",
  dry: "Száraz (thai)",
  scrub: "Scrub / testradír",
};

export default function Services() {
  const [cat, setCat] = useState<Category>("Mind");
  const [dur, setDur] = useState<number | "mind">("mind");
  const [q, setQ] = useState("");
  const [booking, setBooking] =
    useState<{ service: ServiceVM; duration: number } | null>(null);

  const [allServices, setAllServices] = useState<ServiceVM[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([
    "Mind",
    "Olajos",
    "Meleg / herbál",
    "Szegmentált",
    "Száraz (thai)",
    "Scrub / testradír",
  ]);

  // ---- ADATOK KATALÓGUSBÓL ----
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/catalog", { cache: "no-store" });
        const j = await r.json();
        const catData = j?.data as {
          categories: {
            id: string;
            name: string;
            order?: number;
            services: {
              id: string;
              name: string;
              image?: string | null;
              order?: number;
              variants: { durationMin: number; priceHUF: number }[];
            }[];
          }[];
        };

        // kategóriák (Mind + a katalógusban lévők, a mi elnevezésünkre mapelve)
        const cats = [
          "Mind" as const,
          ...catData.categories
            .map((c) => CATEGORY_NAME_MAP[c.id] ?? (c.name as Category))
            .filter(Boolean),
        ] as Category[];
        setAllCategories(cats);

        // szolgáltatások nézetmodellje
        const list: ServiceVM[] = [];
        for (const c of catData.categories) {
          const mappedCat = CATEGORY_NAME_MAP[c.id] ?? (c.name as Category);
          if (!mappedCat || mappedCat === "Mind") continue;

          for (const s of c.services) {
            const prices: Record<number, number> = {};
            const durs: number[] = [];
            for (const v of s.variants) {
              durs.push(v.durationMin);
              prices[v.durationMin] = v.priceHUF;
            }
            list.push({
              id: s.id,
              name: s.name,
              category: mappedCat,
              durations: durs.sort((a, b) => a - b),
              image: s.image ?? IMAGE_FALLBACKS[s.id] ?? "/services/placeholder.png",
              pricesByDuration: prices,
            });
          }
        }
        setAllServices(list);
      } catch {
        // ha valamiért nem jön a katalógus, a lista marad üres – a UI marad stabil
        setAllServices([]);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    return allServices.filter((s) => {
      const byCat = cat === "Mind" ? true : s.category === cat;
      const byDur = dur === "mind" ? true : s.durations.includes(dur);
      const byQ =
        q.trim().length === 0
          ? true
          : [s.name, s.category, s.short ?? ""]
              .join(" ")
              .toLowerCase()
              .includes(q.toLowerCase());
      return byCat && byDur && byQ;
    });
  }, [cat, dur, q, allServices]);

  return (
    <section id="services" className="py-8 md:py-16">
      <div className="mx-auto px-4 md:px-6" style={{ maxWidth: "1120px" }}>
        {/* fejléc */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-6">
          <h2 className="font-heading text-[32px] md:text-[40px] leading-tight">
            Szolgáltatások
          </h2>
          <div className="text-[13px] md:text-base text-[var(--color-muted)]">
            Válassz kategóriát és időtartamot
          </div>
        </div>

        {/* szűrők */}
        <div className="mt-5 space-y-3 md:space-y-0 md:grid md:gap-4 md:items-center md:grid-cols-1">
          {/* kategóriák */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:flex lg:flex-wrap">
            {allCategories.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="px-4 py-2 text-[14px] lg:text-[15px] rounded-full border bg-white"
                style={{
                  borderColor: "var(--color-line)",
                  boxShadow: cat === c ? "inset 0 0 0 2px var(--color-accent)" : "none",
                  fontWeight: 700,
                }}
                aria-pressed={cat === c}
              >
                {c}
              </button>
            ))}
          </div>

          {/* időtartam + kereső */}
          <div className="space-y-2 md:space-y-0 md:flex md:flex-wrap md:gap-2 justify-end md:justify-start">
            <span
              className="inline-flex items-center px-4 py-2 rounded-full border bg-white text-[14px] lg:text-[15px]"
              style={{ borderColor: "var(--color-line)" }}
            >
              Időtartam: {dur === "mind" ? "mind" : `${dur} p`}
            </span>

            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 lg:flex lg:flex-wrap">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDur((prev) => (prev === d ? "mind" : d))}
                  className="px-4 py-2 text-[14px] lg:text-[15px] rounded-full border bg-white"
                  style={{
                    borderColor: "var(--color-line)",
                    boxShadow:
                      dur === d ? "inset 0 0 0 2px var(--color-accent)" : "none",
                    fontWeight: 700,
                  }}
                  aria-pressed={dur === d}
                >
                  {d} p
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-auto">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Keresés: pl. thai, reflex, lava…"
                className="h-[44px] w-full lg:w-[280px] rounded-full border bg-white px-4 text-[15px]"
                style={{ borderColor: "var(--color-line)" }}
                aria-label="Keresés"
              />
            </div>
          </div>
        </div>

        {/* kártyák — DIZÁJN VÁLTOZATLAN */}
        <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {filtered.map((s) => (
            <article
              key={s.id}
              className="bg-white border-b-2 rounded-xl shadow-spa overflow-hidden"
              style={{ borderColor: "var(--color-accent)" }}
            >
              <header className="px-4 pt-4 pb-2 md:px-5">
                <h3 className="text-[18px] md:text-[20px] font-semibold text-center">
                  {s.name}
                </h3>
              </header>

              <div>
                <Image
                  src={s.image}
                  alt={s.name}
                  width={800}
                  height={500}
                  className="w-full h-[180px] sm:h-[200px] md:h-[180px] object-cover"
                />
              </div>

              <div className="px-4 md:px-5 pt-3 pb-4 md:pb-5 flex items-end justify-between gap-3">
                <div className="text-[12.5px] md:text-[13px] leading-5 text-[var(--color-muted)] bg-[var(--color-bg)] rounded-lg px-3 py-2">
                  <div>Kategória: {s.category.toLowerCase()}</div>
                  <div>{s.durations.join("/")}&nbsp;min</div>
                </div>
                <button
                  onClick={() =>
                    setBooking({ service: s, duration: s.durations[0] })
                  }
                  className="rounded-full self-center font-bold px-5 py-2 text-white shadow-spa active:scale-[0.99]"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  Foglalok
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* foglalási modal — az extra price map-et átadjuk, a UI-n nem változtat */}
      {booking && (
        <BookingDialog
          open={true}
          service={{
            id: booking.service.id,
            name: booking.service.name,
            durations: booking.service.durations,
          }}
          pricesByDuration={booking.service.pricesByDuration}
          defaultDuration={booking.duration}
          onClose={() => setBooking(null)}
        />
      )}
    </section>
  );
}
