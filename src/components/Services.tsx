"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import BookingDialog from "./BookingDialog";
import type { Catalog } from "@/lib/catalog";
import { priceOf, fmtHUF } from "@/lib/pricing";

/* ====== adatok ====== */

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
  // árhoz az eredeti rekordot megőrizzük
  _src: Catalog["categories"][number]["services"][number];
};

const CATEGORIES: Category[] = [
  "Mind",
  "Olajos",
  "Meleg / herbál",
  "Szegmentált",
  "Száraz (thai)",
  "Scrub / testradír",
];

const DURATIONS = [30, 45, 60, 90, 120, 180] as const;

/** --- KATALÓGUS BETÖLTÉS KV-BŐL --- */
async function fetchServicesVM(): Promise<ServiceVM[]> {
  const res = await fetch("/api/catalog", { cache: "no-store" });
  if (!res.ok) return [];
  const { data } = (await res.json()) as { ok: boolean; data: Catalog };
  const svcs: ServiceVM[] = [];

  // a kategórianeveknek pontosan meg kell egyeznie a fenti CATEGORIES-szel
  for (const cat of data.categories) {
    // safety: csak ismert kategóriákat veszünk át
    const catName = cat.name as Exclude<Category, "Mind">;
    for (const s of cat.services) {
      const durations = s.variants
        .map(v => v.durationMin)
        .filter((x, i, a) => a.indexOf(x) === i)
        .sort((a, b) => a - b);

      svcs.push({
        id: s.id,
        name: s.name,
        category: catName,
        durations,
        image: s.image ?? "/services/placeholder.png",
        short: s.short ?? undefined,
        _src: s,
      });
    }
  }
  return svcs;
}

/* ====== komponens ====== */

export default function Services() {
  const [services, setServices] = useState<ServiceVM[]>([]);
  const [cat, setCat] = useState<Category>("Mind");
  const [dur, setDur] = useState<number | "mind">("mind");
  const [q, setQ] = useState("");

  useEffect(() => {
    fetchServicesVM().then(setServices).catch(() => setServices([]));
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) => {
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
  }, [services, cat, dur, q]);

  const [booking, setBooking] =
    useState<{ service: ServiceVM; duration: number } | null>(null);

  return (
    <section id="services" className="py-8 md:py-16">
      <div className="mx-auto px-4 md:px-6" style={{ maxWidth: "1120px" }}>
        {/* --- a te UI-d innen VÁLTOZATLAN --- */}
        {/* fejléc */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-6">
          <h2 className="font-heading text-[32px] md:text-[40px] leading-tight">
            Szolgáltatások
          </h2>
          <div className="text-[13px] md:text-base text-[var(--color-muted)]">
            {services.length} kezelés – szűrés kategória és időtartam szerint
          </div>
        </div>

        {/* szűrők */}
        <div className="mt-5 space-y-3 md:space-y-0 md:grid md:gap-4 md:items-center md:grid-cols-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 lg:flex lg:flex-wrap">
            {CATEGORIES.map((c) => (
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

        {/* kártyák */}
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
                  onClick={() => {
                    const defDur = s.durations[0];
                    setBooking({ service: s, duration: defDur });
                  }}
                  className="rounded-full self-center font-bold px-5 py-2 text-white shadow-spa active:scale-[0.99]"
                  style={{ backgroundColor: "var(--color-accent)" }}
                >
                  Foglalok
                </button>
              </div>

              {/* opcionális kis ár jelzés (nem változtat a designon) */}
              <div className="px-4 pb-3 text-center text-[13px] text-[var(--color-muted)]">
                {(() => {
                  const d = s.durations[0];
                  const p = priceOf(s._src, d);
                  return p ? `Alapár: ${fmtHUF(p)} / ${d}p` : null;
                })()}
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* foglalási modal */}
      {booking && (
        <BookingDialog
          open={true}
          service={{
            id: booking.service.id,
            name: booking.service.name,
            durations: booking.service.durations,
          }}
          defaultDuration={booking.duration}
          onClose={() => setBooking(null)}
        />
      )}

      {/* (te régi helper CSS-ed marad) */}
      <style jsx global>{`
        .chip-row{overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch}
        .chip-row::-webkit-scrollbar{display:none}
        .chip-row{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
    </section>
  );
}
