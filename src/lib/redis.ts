import { Redis } from "@upstash/redis";

/**
 * Az Upstash kétféle env nevet adhat. Kezeljük mindkettőt:
 * - UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
 * - KV_REST_API_URL / KV_REST_API_TOKEN (KV kompat mód)
 */
const url =
  process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";

if (!url || !token) {
  // dev-ben legyen érthető hiba
  console.warn(
    "Upstash Redis env vars missing. Did you click 'Connect Project' on Vercel?"
  );
}

export const redis = new Redis({ url, token });
