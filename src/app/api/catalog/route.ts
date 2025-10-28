import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/catalog";

export async function GET() {
  const data = await getCatalog();
  return NextResponse.json({ ok: true, data }, { headers: { "cache-control": "no-store" } });
}
