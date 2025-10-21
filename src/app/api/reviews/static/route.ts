import { NextResponse } from "next/server";
import { redis } from "@/lib/redis";

const CACHE_KEY = "reviews:google";

export async function GET() {
  const raw = await redis.get<string>(CACHE_KEY);
  if (!raw) {
    return NextResponse.json(
      { lastUpdated: null, rating: null, count: 0, mapsUrl: null, reviews: [] },
      { headers: { "Cache-Control": "public, max-age=300" } } // 5 perc
    );
  }
  const data = JSON.parse(raw);
  return NextResponse.json(data, {
    headers: { "Cache-Control": "public, max-age=1800" }, // 30 perc
  });
}
