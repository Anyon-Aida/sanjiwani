"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import BookingDialog from "./BookingDialog";

/* ====== adatok ====== */

type Category =
  | "Mind"
  | "Olajos"
  | "Meleg / herbál"
  | "Szegmentált"
  | "Száraz (thai)"
  | "Scrub / testradír";

type Service = {
  id: string;
  name: string;
  category: Exclude<Category, "Mind">;
  durations: number[]; // percek
  image: string; // public útvonal
  short?: string;
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

const SERVICES: Service[] = [
  {
    id: "traditional-thai",
    name: "Traditional Thai Massage",
    category: "Száraz (thai)",
    durations: [60, 90, 120],
    image: "/services/traditional-thai.png",
  },
  {
    id: "oily-bali",
    name: "Oily Bali Massage",
    category: "Olajos",
    durations: [60, 90, 120],
    image: "/services/oily-bali.png",
  },
  {
    id: "thai-foot",
    name: "Thai Foot Massage",
    category: "Szegmentált",
    durations: [30, 60, 90],
    image: "/services/thai-foot.png",
  },
];

/** próba árazás – később Sanity-ből jön majd */
const BASE_PRICES: Record<string, Partial<Record<number, number>>> = {
  "traditional-thai": { 60: 15000, 90: 19000, 120: 23000 },
  "oily-bali": { 60: 14900, 90: 19900, 120: 23900 },
  "thai-foot": { 30: 7900, 60: 14900, 90: 19900 },
};

const fmtHUF = (n: number) =>
  new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(n);

/* ====== komponens ====== */

export default function Services() {
  const [cat, setCat] = useState<Category>("Mind");
  const [dur, setDur] = useState<number | "mind">("mind");
  const [q, setQ] = useState("");
  const [booking, setBooking] =
    useState<{ service: Service; duration: number } | null>(null);

  const filtered = useMemo(() => {
    return SERVICES.filter((s) => {
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
  }, [cat, dur, q]);

  return (
    <section id="services" className="py-8 md:py-16">
      <div className="mx-auto px-4 md:px-6" style={{ maxWidth: "1120px" }}>
        {/* fejléc */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2 md:gap-6">
          <h2 className="font-heading text-[32px] md:text-[40px] leading-tight">
            Szolgáltatások
          </h2>
          <div className="text-[13px] md:text-base text-[var(--color-muted)]">
            31+ kezelés – szűrés kategória és időtartam szerint
          </div>
        </div>

        {/* szűrők */}
        <div className="mt-5 space-y-3 md:space-y-0 md:grid md:gap-4 md:items-center md:grid-cols-1">
        {/* kategóriák – mobilon rács, desktopon a régi, sorba törő chip-sor */}
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

        {/* időtartam + kereső – mobilon egymás alatt rácsban, desktopon jobbra igazítva a régi elrendezés */}
        <div className="space-y-2 md:space-y-0 md:flex md:flex-wrap md:gap-2 justify-end md:justify-start">
            {/* flex flex-wrap gap-2 justify-end md:justify-start */}
            <span
            className="inline-flex items-center px-4 py-2 rounded-full border bg-white text-[14px] lg:text-[15px]"
            style={{ borderColor: "var(--color-line)" }}
            >
            Időtartam: {dur === "mind" ? "mind" : `${dur} p`}
            </span>

            {/* időtartam – mobilon rács, nincs sideways scroll */}
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

            {/* kereső – mobilon teljes szélesség, desktopon 280px és jobbra igazítva */}
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
          onConfirm={(payload) => {
            // ide mehet a submit / navigate
          }}
        />
      )}

      {/* kis segítség: chip-sor és scrollbar elrejtés mobilon */}
      <style jsx global>{`
        .chip-row {
          overflow-x: auto;
          white-space: nowrap;
          -webkit-overflow-scrolling: touch;
        }
        .chip-row::-webkit-scrollbar {
          display: none;
        }
        .chip-row {
          -ms-overflow-style: none; /* IE 10+ */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </section>
  );
}
