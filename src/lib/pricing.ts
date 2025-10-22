export const BASE_PRICES: Record<number, number> = {
  60: 15000,
  90: 20000,
  120: 25000,
};

export function priceFor(durationMin: number): number {
  return BASE_PRICES[durationMin] ?? 0;
}

export function fmtHUF(v: number) {
  return new Intl.NumberFormat("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 }).format(v);
}
