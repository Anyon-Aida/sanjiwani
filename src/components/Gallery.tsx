"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Pic = { src: string; alt?: string; w?: number; h?: number };

export default function Gallery({
  title = "Galéria",
  subtitle = "Hangulatképek a szalonból",
  pics,
  height = 240,
  gap = 16,
}: {
  title?: string;
  subtitle?: string;
  pics: Pic[];
  height?: number;
  gap?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollerRef.current!;
    const cardW = (height * 4) / 3 + gap;
    el.scrollBy({ left: dir * cardW * 2, behavior: "smooth" });
  };

  // görgő -> vízszintes (kényelmi)
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        el.scrollBy({ left: e.deltaY, behavior: "auto" });
        e.preventDefault();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // LIGHTBOX
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const close = () => setOpenIdx(null);
  const prev = () =>
    setOpenIdx((i) => (i == null ? i : (i - 1 + pics.length) % pics.length));
  const next = () => setOpenIdx((i) => (i == null ? i : (i + 1) % pics.length));

  useEffect(() => {
    if (openIdx == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIdx]);

  return (
    <section className="container-narrow my-16">
      {/* középre zárt, azonos max-width mint a többi szekciónál */}
      <div className="mx-auto w-full">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-bold font-serif tracking-tight">{title}</h2>
            <p className="text-[var(--color-muted)] mt-1">{subtitle}</p>
          </div>
          <div className="hidden md:flex gap-2 z-10">
            <button
              aria-label="Előző képek"
              onClick={() => scrollByCards(-1)}
              className="rounded-full border px-3 py-1 hover:bg-neutral-50"
            >
              ←
            </button>
            <button
              aria-label="Következő képek"
              onClick={() => scrollByCards(1)}
              className="rounded-full border px-3 py-1 hover:bg-neutral-50"
            >
              →
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="relative overflow-x-auto select-none"
          style={{
            scrollSnapType: "x proximity",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          aria-label="Képgaléria"
        >
          {/* webkit scrollbar off */}
          <style jsx>{`div::-webkit-scrollbar{display:none;}`}</style>

          {/* szélső fade – NEM fogja a klikket */}
          <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-[var(--color-bg)] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[var(--color-bg)] to-transparent" />

          <ul className="flex" style={{ gap, paddingBottom: 4, paddingRight: 4 }}>
            {pics.map((p, i) => (
              <li
                key={i}
                className="shrink-0 rounded-2xl overflow-hidden bg-neutral-100 shadow-sm cursor-zoom-in"
                style={{
                  width: (height * 4) / 3,
                  height,
                  scrollSnapAlign: "start",
                }}
                onClick={() => setOpenIdx(i)} // <- KATT = NAGYÍT
              >
                <Image
                  src={p.src}
                  alt={p.alt || "Galéria kép"}
                  width={p.w || 1200}
                  height={p.h || 900}
                  sizes="(max-width: 768px) 80vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                  priority={i < 2}
                />
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* LIGHTBOX (nagyított nézet sötét háttérrel) */}
      {openIdx != null && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/90 px-3 py-1 text-sm shadow hover:bg-white"
            onClick={close}
            aria-label="Bezárás"
          >
            ✕
          </button>

          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1 text-lg shadow hover:bg-white"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Előző"
          >
            ←
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/80 px-3 py-1 text-lg shadow hover:bg-white"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Következő"
          >
            →
          </button>

          <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
            <Image
              src={pics[openIdx].src}
              alt={pics[openIdx].alt || "Nagyított kép"}
              width={pics[openIdx].w || 1600}
              height={pics[openIdx].h || 1200}
              className="w-full h-auto rounded-xl shadow-2xl"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}
    </section>
  );
}
