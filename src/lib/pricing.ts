import { getCatalog } from "./catalog";

export async function getPriceBy(serviceId: string, durationMin: number): Promise<number | null> {
  const cat = await getCatalog();
  for (const c of cat.categories) {
    const s = c.services.find(x => x.id === serviceId);
    if (!s) continue;
    const v = s.variants.find(v => v.durationMin === durationMin);
    return v ? v.priceHUF : null;
  }
  return null;
}

export function fmtHUF(v: number) {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(v);
}
