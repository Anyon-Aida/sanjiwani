import { redis } from "@/lib/redis";

export const CATALOG_KEY = "catalog:v1";

export type Catalog = {
  categories: {
    id: string;
    name: string;            // pl. "Olajos", "Meleg / herbál"...
    order?: number;
    services: {
      id: string;            // pl. "oily-bali"
      name: string;          // kártya címe
      image?: string | null; // /public képfájl (opcionális)
      short?: string | null;
      order?: number;
      variants: Array<{
        durationMin: number; // pl. 45,60,90,120,180
        priceHUF: number;    // pl. 12000
      }>;
    }[];
  }[];
  faq?: { order?: number; q: string; a: string }[];
};

// egyszerű olvasó/író – az admin oldalt már be tudjuk kötni később
export async function getCatalog(): Promise<Catalog | null> {
  const raw = await redis.get(CATALOG_KEY);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as Catalog);
}
