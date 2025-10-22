// slotolás (9:00–19:00, 30 perces lépések) – egyezik a UI-val
export const OPEN_HOUR = 9;
export const CLOSE_HOUR = 19;
export const STEP_MIN = 30;

export const DAY_SLOTS = ((CLOSE_HOUR - OPEN_HOUR) * 60) / STEP_MIN; // pl. 20

export function hhmmFromIndex(i: number) {
  const total = OPEN_HOUR * 60 + i * STEP_MIN;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function indexFromHHMM(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  return ((h * 60 + m) - OPEN_HOUR * 60) / STEP_MIN;
}

// hány egymást követő slot kell egy adott időtartamhoz
export function slotsNeeded(durationMin: number) {
  return Math.ceil(durationMin / STEP_MIN);
}

// Redis kulcsok
export const keyDay = (date: string) => `book:day:${date}`;           // Set of taken indices
export const keyBooking = (date: string, idx: number) => `book:one:${date}:${idx}`; // booking adatai
