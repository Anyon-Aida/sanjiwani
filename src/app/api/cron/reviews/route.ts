import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

type PlaceText = { text?: string };
type PlaceAuthorAttr = { displayName?: string; photoUri?: string; uri?: string };
type PlaceReview = {
  authorAttribution?: PlaceAuthorAttr;
  rating?: number;
  publishTime?: string; // ISO
  text?: PlaceText;
};
type PlaceDetails = {
  rating?: number;
  userRatingCount?: number;
  googleMapsUri?: string;
  reviews?: PlaceReview[];
};
type GoogleError = {
  error?: { message?: string; status?: string; code?: number };
};

const CACHE_KEY = "reviews:google";
const FIELD_MASK = "rating,userRatingCount,reviews,googleMapsUri";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const provided = u.searchParams.get("secret") ?? "";
  const needed = process.env.CRON_SECRET ?? "";
  const isCron = req.headers.get("x-vercel-cron") === "1";

  if (!isCron && provided !== needed) {
    // >>> ideiglenes diagnosztika, hogy lásd miért 403
    return NextResponse.json(
      { ok: false, reason: "FORBIDDEN", diag: {
          provided,
          needStartsWith: needed ? needed.slice(0, 4) + "…" : null,
          isCron
        }},
      { status: 403 }
    );
  }
  // Csak Vercel Cron hívhatja prod-ban (dev-ben kézzel is mehet)
  const isDev = process.env.NODE_ENV !== "production";
  if (!isCron && !isDev) {
    return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
  }

  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) {
    return NextResponse.json({ ok: false, error: "MISSING_ENV" }, { status: 500 });
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set("languageCode", "hu");
  url.searchParams.set("regionCode", "HU");

  const res = await fetch(url.toString(), {
    headers: {
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    cache: "no-store",
  });

  const json = (await res.json()) as PlaceDetails & GoogleError;

  if (!res.ok) {
    return NextResponse.json(
      { ok: false, error: "PLACES_V1_ERROR", message: json?.error?.message, raw: json },
      { status: 500 }
    );
  }

  const reviews = (json.reviews ?? [])
    .map((r) => ({
      author_name: r.authorAttribution?.displayName ?? "Vendég",
      rating: r.rating ?? null,
      publishTime: r.publishTime ?? null,
      text: r.text?.text ?? "",
      profile_photo_url: r.authorAttribution?.photoUri,
    }))
    .sort((a, b) => (b.publishTime ?? "").localeCompare(a.publishTime ?? ""));

  const payload = {
    lastUpdated: new Date().toISOString(),
    rating: json.rating ?? null,
    count: json.userRatingCount ?? 0,
    mapsUrl: json.googleMapsUri ?? null,
    reviews,
  };

  // mentsük Redis-be (stringként)
  await redis.set(CACHE_KEY, JSON.stringify(payload));
  // (opció: TTL, pl. 3 nap)  await redis.set(CACHE_KEY, JSON.stringify(payload), { ex: 60*60*24*3 });

  return NextResponse.json({ ok: true, saved: CACHE_KEY, count: reviews.length });
}
