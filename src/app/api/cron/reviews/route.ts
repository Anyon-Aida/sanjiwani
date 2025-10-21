// src/app/api/cron/reviews/route.ts
import { NextRequest, NextResponse } from "next/server";
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

// futtassuk edge-en, és mindig dinamikusan
export const runtime = "edge";
export const dynamic = "force-dynamic";

/** Headerből vagy queryből kiolvassuk a titkot. */
function getProvidedSecret(req: NextRequest) {
  // 1) header (cronoknál ez a természetes)
  const fromHeader =
    req.headers.get("x-cron-secret") ?? req.headers.get("X-Cron-Secret");
  if (fromHeader && fromHeader.trim().length > 0) return fromHeader.trim();

  // 2) query param (?secret=...)
  const fromQuery = req.nextUrl.searchParams.get("secret");
  return (fromQuery ?? "").trim();
}

export async function GET(req: NextRequest) {
  const isCron = req.headers.get("x-vercel-cron") === "1";
  const provided = getProvidedSecret(req);
  const needed = (process.env.CRON_SECRET ?? "").trim();
  const isDev = process.env.NODE_ENV !== "production";

  // DEBUG – ideiglenes visszajelzés (böngészőben: ?debug=1)
  if (req.nextUrl.searchParams.get("debug") === "1") {
    return NextResponse.json({
      ok: true,
      debug: true,
      provided,
      needStartsWith: needed ? needed.slice(0, 4) + "…" : null,
      isCron,
      headersEcho: {
        "x-cron-secret": req.headers.get("x-cron-secret"),
        "x-vercel-cron": req.headers.get("x-vercel-cron"),
      },
    });
  }

  // Guard: prod-ban csak Vercel Cron vagy helyes secret engedett.
  // Dev-ben kézzel is hívható.
  if (!isDev) {
    if (!isCron && (!provided || (needed && provided !== needed))) {
      return NextResponse.json(
        {
          ok: false,
          reason: "FORBIDDEN",
          diag: {
            provided,
            needStartsWith: needed ? needed.slice(0, 4) + "…" : null,
            isCron,
          },
        },
        { status: 403 }
      );
    }
  } else {
    // dev: ha van CRON_SECRET megadva, és adsz is titkot, ellenőrizzük
    if (provided && needed && provided !== needed) {
      return NextResponse.json(
        {
          ok: false,
          reason: "FORBIDDEN_DEV",
          diag: {
            provided,
            needStartsWith: needed ? needed.slice(0, 4) + "…" : null,
            isCron,
          },
        },
        { status: 403 }
      );
    }
  }

  // --- Google Places v1 lekérés ---
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) {
    return NextResponse.json(
      { ok: false, error: "MISSING_ENV" },
      { status: 500 }
    );
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
      {
        ok: false,
        error: "PLACES_V1_ERROR",
        message: json?.error?.message,
        raw: json,
      },
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

  // Mentés Upstash Redis-be
  await redis.set(CACHE_KEY, JSON.stringify(payload));
  // ha szeretnél TTL-t:
  // await redis.set(CACHE_KEY, JSON.stringify(payload), { ex: 60 * 60 * 24 * 3 });

  return NextResponse.json({ ok: true, saved: CACHE_KEY, count: reviews.length });
}
