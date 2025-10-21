// src/components/Reviews.tsx
import Image from "next/image";

type ReviewItem = {
  author_name: string;
  rating: number | null;
  publishTime: string | null;
  text: string;
  profile_photo_url?: string | null;
};

type ReviewsPayload = {
  lastUpdated: string;
  rating: number | null;
  count: number;
  mapsUrl: string | null;
  reviews: ReviewItem[];
};

async function getData(): Promise<ReviewsPayload | null> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/reviews`, {
    // revalidate = 30 perc – nyugodtan állítsd
    next: { revalidate: 1800 },
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

export default async function Reviews() {
  const data = await getData();

  if (!data) {
    return (
      <section id="reviews" className="container-narrow py-12">
        <h2 className="text-3xl font-bold mb-2">Vélemények</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Valós visszajelzések vendégeinktől
        </p>
        <div className="rounded-xl border bg-[var(--color-bg)] p-4">
          Nem sikerült betölteni a véleményeket. Próbáld később újra.
        </div>
      </section>
    );
  }

  const { reviews, rating, count, mapsUrl } = data;

  return (
    <section id="reviews" className="container-narrow py-12">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold leading-tight">Vélemények</h2>
          <p className="text-sm text-muted-foreground">
            Valós visszajelzések vendégeinktől
          </p>
        </div>
        {rating != null && (
          <div className="text-right">
            <div className="text-2xl font-bold">{rating.toFixed(1)} ★</div>
            <div className="text-xs text-muted-foreground">{count} értékelés</div>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {reviews.slice(0, 6).map((r, i) => (
          <article key={i} className="rounded-xl border p-4 bg-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-9 w-9 rounded-full overflow-hidden bg-[var(--color-bg)] shrink-0">
                {r.profile_photo_url ? (
                  <Image
                    src={r.profile_photo_url}
                    alt={r.author_name}
                    width={36}
                    height={36}
                  />
                ) : null}
              </div>
              <div className="leading-tight">
                <div className="font-medium">{r.author_name}</div>
                {r.publishTime && (
                  <div className="text-xs text-muted-foreground">
                    {new Date(r.publishTime).toLocaleDateString("hu-HU")}
                  </div>
                )}
              </div>
            </div>

            {r.rating != null && (
              <div className="mb-2 text-[15px] font-semibold">{r.rating} ★</div>
            )}

            <p className="text-[15px] leading-relaxed">
              {r.text?.slice(0, 260)}
              {r.text && r.text.length > 260 ? "…" : ""}
            </p>
          </article>
        ))}
      </div>

      {mapsUrl && (
        <div className="mt-6">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-full border px-4 py-2 hover:bg-[var(--color-bg)]"
          >
            További vélemények a Google-ön
          </a>
        </div>
      )}
    </section>
  );
}
