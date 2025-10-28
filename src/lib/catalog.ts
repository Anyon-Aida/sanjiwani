import { redis } from "@/lib/redis";

export const CATALOG_KEY = "catalog:v1";

// src/lib/catalog.ts
export type Variant = { durationMin: number; priceHUF: number };
export type Service = { id: string; name: string; image?: string; variants: Variant[] };
export type Category = { id: string; name: string; order: number; services: Service[] };
export type Catalog = { categories: Category[]; faq: { q: string; a: string }[] };

// ha még nincs, exportáld a fallbacket is
export const FALLBACK_CATALOG: Catalog = {
  categories: [
    { id: "cat-oil",   name: "Olajos",         order: 1, services: [] },
    { id: "cat-warm",  name: "Meleg / herbál", order: 2, services: [] },
    { id: "cat-seg",   name: "Szegmentált",    order: 3, services: [] },
    { id: "cat-dry",   name: "Száraz (thai)",  order: 4, services: [] },
    { id: "cat-scrub", name: "Scrub / testradír", order: 5, services: [] },
  ],
  faq: [],
};

const DEFAULT_CATALOG: Catalog = { categories: [], faq: [] };

export async function getCatalog(): Promise<Catalog> {
  const raw = await redis.get(CATALOG_KEY);
  if (!raw) return DEFAULT_CATALOG;
  if (typeof raw === "string") {
    try { return JSON.parse(raw) as Catalog; } catch { return DEFAULT_CATALOG; }
  }
  return (raw ?? DEFAULT_CATALOG) as Catalog;
}

export async function setCatalog(c: Catalog) {
  if (!Array.isArray(c.categories) || !Array.isArray(c.faq)) {
    throw new Error("Invalid catalog");
  }
  await redis.set(CATALOG_KEY, JSON.stringify(c));
}
