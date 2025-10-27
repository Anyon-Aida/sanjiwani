"use client";
import Image from "next/image";
import { useRef, useState, useEffect } from "react";

type Pic = { src: string; alt?: string; w?: number; h?: number };

export default function Gallery({
  title = "Galéria",
  subtitle = "Hangulatképek a szalonból",
  pics,
  height = 240,              // kártyák magassága (px)
  gap = 16,                  // kártyák közti térköz (px)
}: {
  title?: string;
  subtitle?: string;
  pics: Pic[];
  height?: number;
  gap?: number;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState({ active: false, x: 0, scrollLeft: 0 });

  // egér húzás (asztali)
  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current!;
    el.setPointerCapture(e.pointerId);
    setDrag({ active: true, x: e.clientX, scrollLeft: el.scrollLeft });
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.active) return;
    const el = scrollerRef.current!;
    const delta = e.clientX - drag.x;
    el.scrollLeft = drag.scrollLeft - delta;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    setDrag((d) => ({ ...d, active: false }));
    try { scrollerRef.current?.releasePointerCapture(e.pointerId); } catch {}
  };

  // egér görgő → vízszintes görgetés
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

  // segéd gombok
  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollerRef.current!;
    const cardW = (height * 4) / 3 + gap; // kb. 4:3 kártya + rés
    el.scrollBy({ left: dir * cardW * 2, behavior: "smooth" });
  };

  return (
    <section aria-labelledby="gallery-title" className="my-16">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 id="gallery-title" className="text-3xl font-serif tracking-tight">
            {title}
          </h2>
          <p className="text-[var(--color-muted)] mt-1">{subtitle}</p>
        </div>

        {/* navigációs gombok (opcionális) */}
        <div className="hidden md:flex gap-2">
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
        className="relative group overflow-x-auto overscroll-x-contain select-none"
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        aria-label="Képgaléria – húzd jobbra/balra"
      >
        {/* scrollbar elrejtése webkitnél */}
        <style jsx>{`
          div::-webkit-scrollbar { display: none; }
        `}</style>

        {/* láthatatlan “fogd-és-húzd” réteg (asztalin segít) */}
        <div
          aria-hidden
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
        />

        {/* gradient maszkok széleken */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-10 bg-gradient-to-r from-[var(--color-bg)] to-transparent" />
        <div className="pointer-events-none absolute right-0 top-0 h-full w-10 bg-gradient-to-l from-[var(--color-bg)] to-transparent" />

        <ul
          className="flex"
          style={{ gap, paddingBottom: 4, paddingRight: 4 }}
        >
          {pics.map((p, i) => (
            <li
              key={i}
              className="shrink-0 rounded-2xl overflow-hidden bg-neutral-100 shadow-sm"
              style={{
                width: (height * 4) / 3, // 4:3 szélesség
                height,
                scrollSnapAlign: "start",
              }}
            >
              <Image
                src={p.src}
                alt={p.alt || "Galéria kép"}
                width={p.w || 1200}
                height={p.h || 900}
                sizes="(max-width: 768px) 80vw, 33vw"
                className="h-full w-full object-cover"
                priority={i < 2}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
