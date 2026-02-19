"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type Staff = {
  id: string;
  name: string;
  title?: string | null;
  rating?: number | null;
  image?: string | null;
};

const easeOut = [0.16, 1, 0.3, 1] as const; // smooth

export default function StaffPicker({
  value,
  onChange,
}: {
  value: Staff | null;
  onChange: (staff: Staff) => void;
}) {
  const [items, setItems] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);

  const activeId = value?.id ?? null;
  const focusId = hovered ?? activeId;
  const mode: "hero" | "compact" = activeId ? "compact" : "hero";

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch("/api/staff", { cache: "no-store" });
        const j = await r.json();
        if (j.ok) setItems(j.staff as Staff[]);
        else setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // első benyomás: ha még nincs választás, legyen egy "kiemelt" alap hover
  useEffect(() => {
    if (!activeId && items.length && hovered == null) setHovered(items[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  if (loading) {
    return (
      <div className={mode === "hero" ? "mb-10" : "mb-4"}>
        <div className="text-sm text-[var(--color-muted)]">Masszőr</div>
        <div className="mt-2 text-sm text-[var(--color-muted)]">Betöltés…</div>
      </div>
    );
  }

  // méretek
  const size = mode === "hero" ? 96 : 52;
  const focusedScale = mode === "hero" ? 1.12 : 1.06;

  return (
    <div className={mode === "hero" ? "mb-10" : "mb-4"}>
      <div className="text-sm text-[var(--color-muted)]">Masszőr</div>

      <motion.div
        layout
        transition={{ duration: 0.45, ease: easeOut }}
        className={[
          "mt-3 w-full",
          mode === "hero" ? "flex justify-center" : "flex justify-start",
        ].join(" ")}
      >
        {/* FIX: items-center, hogy ne billegjen */}
        <motion.div
          layout
          transition={{ duration: 0.45, ease: easeOut }}
          className={[
            "relative flex items-center",
            mode === "hero" ? "gap-7" : "gap-3",
          ].join(" ")}
        >
          {items.map((s) => {
            const isFocused = focusId === s.id;
            const isActive = activeId === s.id;

            return (
              <motion.button
                key={s.id}
                layout
                type="button"
                onMouseEnter={() => setHovered(s.id)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(s.id)}
                onBlur={() => setHovered(null)}
                onClick={() => onChange(s)}
                className="relative outline-none"
                animate={{
                  scale: isFocused ? focusedScale : 1,
                  y: mode === "hero" ? (isFocused ? -6 : 0) : (isFocused ? -2 : 0),
                  filter: isFocused ? "brightness(1.05)" : "brightness(0.98)",
                }}
                transition={{ duration: 0.38, ease: easeOut }}
              >
                {/* STRONGER GLOW: két réteg */}
                <AnimatePresence>
                  {isFocused && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.25 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: easeOut }}
                        className="pointer-events-none absolute -inset-6 -z-10 rounded-full blur-2xl"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.3), transparent 62%)",
                        }}
                      />
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.18 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: easeOut }}
                        className="pointer-events-none absolute -inset-3 -z-10 rounded-full blur-xl"
                        style={{
                          background:
                            "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.5), transparent 52%)",
                        }}
                      />
                    </>
                  )}
                </AnimatePresence>

                {/* Avatar */}
                <div
                  className={[
                    "relative rounded-full overflow-hidden bg-white/5",
                    "ring-1",
                    isActive
                    ? "ring-emerald-400/50 dark:ring-emerald-300/40"
                    : "ring-black/10 dark:ring-white/15",
                  ].join(" ")}
                  style={{ width: size, height: size }}
                >
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.image}
                      alt={s.name}
                      className="h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-white/40 text-xs">
                      kép
                    </div>
                  )}

                  {/* FIXED rating badge: mindig ugyanoda, szebb blur */}
                  <AnimatePresence>
                    {isFocused && typeof s.rating === "number" && (
                        <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.22, ease: easeOut }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 text-[13px] font-extrabold"
                        style={{
                            textShadow:
                            "0 2px 12px rgba(0,0,0,0.65), 0 1px 2px rgba(0,0,0,0.55)",
                        }}
                        >
                        <span
                            className="leading-none"
                            style={{
                            color: "#fbbf24", // arany
                            WebkitTextStroke: "0.4px rgba(0,0,0,0.55)", // kontúr, hogy fotón se tűnjön el
                            }}
                        >
                            ★
                        </span>
                        <span
                            className="leading-none"
                            style={{
                            color: "#ffffff",
                            WebkitTextStroke: "0.35px rgba(0,0,0,0.55)",
                            }}
                        >
                            {s.rating.toFixed(1)}
                        </span>
                        </motion.div>
                    )}
                  </AnimatePresence>


                  {/* Kiválasztott pötty marad */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        transition={{ duration: 0.22, ease: easeOut }}
                        className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-full bg-emerald-400/90 ring-2 ring-black/30"
                      />
                    )}
                  </AnimatePresence>
                </div>

                {/* NAME/TITLE: abszolút alá, hogy ne tolja a layoutot (ugrás megszűnik) */}
                <AnimatePresence>
                  {isFocused && mode === "hero" && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.22, ease: easeOut }}
                      className="absolute left-1/2 top-full mt-3 w-[170px] -translate-x-1/2 text-center"
                    >
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white/90">
                        {s.name}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-600 dark:text-white/60">
                        {s.title ? s.title : "\u00A0"}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
