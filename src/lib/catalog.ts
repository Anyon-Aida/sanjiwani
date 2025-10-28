import { redis } from "@/lib/redis";

export const CATALOG_KEY = "catalog:v1";

export type Catalog = {
  categories: {
    id: string;          // pl. "oily", "warm"…
    name: string;        // pl. "Olajos masszázsok"
    order?: number;
    services: {
      id: string;        // pl. "oily-bali"
      name: string;
      description?: string | null;
      image?: string | null; // opcionális – ha nincs, a Services saját fallbackje
      order?: number;
      variants: { durationMin: number; priceHUF: number }[];
    }[];
  }[];
  faq: { order?: number; q: string; a: string }[];
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
