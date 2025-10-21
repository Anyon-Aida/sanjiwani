// src/app/api/reviews/route.ts
import { NextResponse } from "next/server";

export const revalidate = 6 * 60 * 60; // 6 óra

export async function GET() {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!key || !placeId) {
    return NextResponse.json(
      { error: "MISSING_ENV", message: "Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID" },
      { status: 500 }
    );
  }

  // v1 GetPlace – NINCS reviewsSort param
  const url = new URL(`https://places.googleapis.com/v1/places/${placeId}`);
  url.searchParams.set("languageCode", "hu");
  url.searchParams.set("regionCode", "HU");

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": key,
        // A v1-ben kötelező a FieldMask: csak ezeket a mezőket adja vissza
        "X-Goog-FieldMask": "rating,userRatingCount,reviews,googleMapsUri",
      },
      next: { revalidate },
      // debughoz: cache: "no-store",
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: "PLACES_V1_ERROR", message: data?.error?.message, raw: data },
        { status: 500 }
      );
    }

    // review-k normalizálása + opcionális rendezés publishTime szerint (legújabb elöl)
    const reviews = (data.reviews ?? [])
      .map((r: any) => ({
        author_name: r.authorAttribution?.displayName ?? "Vendég",
        rating: r.rating,
        publishTime: r.publishTime, // ISO
        text: r.text?.text ?? "",
        profile_photo_url: r.authorAttribution?.photoUri,
      }))
      .sort((a: any, b: any) => (b.publishTime ?? "").localeCompare(a.publishTime ?? ""));

    return NextResponse.json({
      rating: data.rating,
      count: data.userRatingCount,
      mapsUrl: data.googleMapsUri,
      reviews,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "FETCH_ERROR", message: String(e) },
      { status: 500 }
    );
  }
}
