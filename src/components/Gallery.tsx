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
  const wrapRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // drag state + momentum
  const drag = useRef({
    active: false,
    x: 0,
    lastX: 0,
    lastT: 0,
    scrollLeft: 0,
    vx: 0, // px/ms
    raf: 0,
  });

  const stopMomentum = () => {
    if (drag.current.raf) cancelAnimationFrame(drag.current.raf);
    drag.current.vx = 0;
    drag.current.raf = 0;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current!;
    el.setPointerCapture(e.pointerId);
    drag.current.active = true;
    drag.current.x = e.clientX;
    drag.current.lastX = e.clientX;
    drag.current.lastT = performance.now();
    drag.current.scrollLeft = el.scrollLeft;
    stopMomentum();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current.active) return;
    const el = scrollerRef.current!;
    const now = performance.now();
    const dx = e.clientX - drag.current.x;
    el.scrollLeft = drag.current.scrollLeft - dx;

    // sebesség becslés a momentumhoz
    const dt = now - drag.current.lastT || 1;
    drag.current.vx = (e.clientX - drag.current.lastX) / dt; // px/ms
    drag.current.lastX = e.clientX;
    drag.current.lastT = now;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    drag.current.active = false;
    try { scrollerRef.current?.releasePointerCapture(e.pointerId); } catch {}

    // momentum görgetés
    const el = scrollerRef.current!;
    const decay = 0.95; // csillapítás
    const step = () => {
      drag.current.vx *= decay;
      el.scrollLeft -= drag.current.vx * 16; // kb 60fps → ~16ms
      if (Math.abs(drag.current.vx) > 0.02) {
        drag.current.raf = requestAnimationFrame(step);
      } else {
        drag.current.raf = 0;
      }
    };
    if (Math.abs(drag.current.vx) > 0.1) step();
  };

  // görgő → vízszintes
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

  // lightbox
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const close = () => setOpenIdx(null);
  const prev = () => setOpenIdx((i) => (i == null ? i : (i - 1 + pics.length) % pics.length));
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

  const scrollByCards = (dir: 1 | -1) => {
    const el = scrollerRef.current!;
    const cardW = (height * 4) / 3 + gap;
    el.scrollBy({ left: dir * cardW * 2, behavior: "smooth" });
  };

  return (
    <section className="my-16">
      {/* KÖZÉPRE zárt, max-width mint a többi szekciónál */}
      <div ref={wrapRef} className="mx-auto w-full max-w-5xl px-4">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="text-3xl font-serif tracking-tight">Galéria</h2>
            <p className="text-[var(--color-muted)] mt-1">{subtitle}</p>
          </div>
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
          className="relative overflow-x-auto select-none"
          style={{
            scrollSnapType: "x proximity",
            WebkitOverflowScrolling: "touch",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          aria-label="Képgaléria – húzd jobbra/balra"
        >
          {/* scrollbar elrejtés webkitnél */}
          <style jsx>{`div::-webkit-scrollbar { display: none; }`}</style>

          {/* szélső árnyalat */}
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
                onClick={() => setOpenIdx(i)}
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

      {/* LIGHTBOX */}
      {openIdx != null && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          onClick={(e) => {
            // csak háttérre kattintva zárjon
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

          {/* navigáció */}
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

          <div className="mx-auto max-w-5xl w-[92vw]">
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
