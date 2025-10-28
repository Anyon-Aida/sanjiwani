import type { Catalog } from "./catalog";

// egy szolgáltatás variánsából ad vissza árat egy adott percért
export function priceOf(
  service: Catalog["categories"][number]["services"][number],
  durationMin: number
): number | null {
  const v = service.variants.find(v => v.durationMin === durationMin);
  return v ? v.priceHUF : null;
}

export function fmtHUF(v: number) {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency: "HUF",
    maximumFractionDigits: 0,
  }).format(v);
}
