"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

type Review = {
  author_name: string;
  rating: number;
  relative_time_description: string;
  text: string;
  profile_photo_url?: string;
};

type Payload = {
  rating?: number;
  count?: number;
  reviews: Review[];
};

export default function Reviews() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((j) => (j.error ? setErr(j.error) : setData(j)))
      .catch((e) => setErr(String(e)));
  }, []);

  return (
    <section id="reviews" className="py-12 md:py-16">
      <div className="mx-auto px-6" style={{ maxWidth: "1120px" }}>
        <div className="flex items-end justify-between gap-6 flex-wrap">
          <h2 className="font-heading text-[36px] md:text-[32px] leading-tight">Vélemények</h2>
          <div className="text-[var(--color-muted)]">
            Valós visszajelzések vendégeinktől
          </div>
        </div>

        {/* fej összesítés */}
        {data?.rating && data?.count ? (
          <div className="mt-3 text-[15px]">
            <Stars value={data.rating} />
            <span className="ml-2 align-middle">
              {data.rating.toFixed(1)} / 5 • {data.count} értékelés a Google-ön
            </span>
          </div>
        ) : null}

        {/* hiba / töltő */}
        {err && (
          <div className="mt-6 rounded-lg border p-4 text-sm"
               style={{ borderColor: "var(--color-line)" }}>
            Nem sikerült betölteni a véleményeket. Később próbáld újra.
          </div>
        )}
        {!data && !err && (
          <div className="mt-6 h-[140px] rounded-lg border bg-[var(--color-bg)] animate-pulse"
               style={{ borderColor: "var(--color-line)" }} />
        )}

        {/* kártyák */}
        {data?.reviews?.length ? (
          <div className="mt-6 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.reviews.map((r, i) => (
              <article key={i}
                className="bg-white border rounded-xl shadow-spa p-5 flex flex-col"
                style={{ borderColor: "var(--color-line)" }}>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-[var(--color-bg)] shrink-0">
                    {r.profile_photo_url ? (
                      <Image src={r.profile_photo_url} alt={r.author_name} width={36} height={36} />
                    ) : null}
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold">{r.author_name}</div>
                    <div className="text-xs text-[var(--color-muted)]">{r.relative_time_description}</div>
                  </div>
                </div>

                <div className="mt-3">
                  <Stars value={r.rating} />
                </div>

                <p className="mt-3 text-[15px] leading-6 text-[var(--color-foreground)]/85 line-clamp-6">
                  {r.text}
                </p>
              </article>
            ))}
          </div>
        ) : null}

        {/* CTA a Google-re */}
        <div className="mt-6">
          <a
            href={`https://www.google.com/maps/place/?q=place_id:${process.env.NEXT_PUBLIC_PLACE_ID ?? ""}`}
            target="_blank" rel="noreferrer"
            className="inline-flex items-center rounded-full px-5 py-3 font-bold text-white shadow-spa"
            style={{ backgroundColor: "var(--color-primary)" }}
          >
            További vélemények a Google-ön
          </a>
        </div>
      </div>
    </section>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.floor(value);
  const half = value - full >= 0.5;
  return (
    <div className="inline-flex items-center gap-0.5 align-middle">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24"
             className={i < full || (i === full && half) ? "text-yellow-500" : "text-gray-300"}
             fill="currentColor" aria-hidden>
          <path d="M12 .587l3.668 7.568L24 9.748l-6 5.853 1.417 8.262L12 19.771 4.583 23.863 6 15.601 0 9.748l8.332-1.593z" />
        </svg>
      ))}
    </div>
  );
}
