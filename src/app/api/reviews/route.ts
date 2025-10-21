// src/app/api/reviews/route.ts
import { NextResponse } from "next/server";

export const revalidate = 6 * 60 * 60; // 6 óra

// --- Google Places v1 response típusok (szűkített) ---
type PlaceText = { text?: string; languageCode?: string };
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

export async function GET() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) {
    return NextResponse.json(
      { error: "MISSING_ENV", message: "Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID" },
      { status: 500 }
    );
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set("languageCode", "hu");
  url.searchParams.set("regionCode", "HU");

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
      },
      next: { revalidate },
    });

    const json = (await res.json()) as PlaceDetails & GoogleError;

    if (!res.ok) {
      return NextResponse.json(
        { error: "PLACES_V1_ERROR", message: json?.error?.message, raw: json },
        { status: 500 }
      );
    }

    const reviews = (json.reviews ?? [])
      .map((r): {
        author_name: string;
        rating: number | undefined;
        publishTime: string | undefined;
        text: string;
        profile_photo_url?: string;
      } => ({
        author_name: r.authorAttribution?.displayName ?? "Vendég",
        rating: r.rating,
        publishTime: r.publishTime,
        text: r.text?.text ?? "",
        profile_photo_url: r.authorAttribution?.photoUri,
      }))
      .sort((a, b) => (b.publishTime ?? "").localeCompare(a.publishTime ?? ""));

    return NextResponse.json({
      rating: json.rating,
      count: json.userRatingCount,
      mapsUrl: json.googleMapsUri,
      reviews,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "FETCH_ERROR", message: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    );
  }
}
