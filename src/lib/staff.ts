// src/lib/staff.ts
import { redis } from "@/lib/redis";

export type Staff = { id: string; name: string, title?: string | null; rating?: number | null; image?: string | null };

const STAFF_KEY = "staff:v1";

const FALLBACK: Staff[] = [
  {
    "id": "nita",
    "name": "NITA",
    "title": "Balinéz olajmasszázs",
    "rating": 4.9,
    "image": "/staff/anna.png"
  },
  {
    "id": "risma",
    "name": "RISMA",
    "title": "Sportmasszázs",
    "rating": 4.8,
    "image": "/staff/eszter.png"
  },
  {
    "id": "uma",
    "name": "UMA",
    "title": "",
    "rating": 4.7,
    "image": "/staff/csilla.png"
  }
]

export async function getStaff(): Promise<Staff[]> {
  const raw = await redis.get<string>(STAFF_KEY);
  if (!raw) return FALLBACK;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as Staff[];
  } catch {
    // no-op
  }
  return FALLBACK;
}
