// src/app/api/admin/catalog/route.ts
import { NextResponse } from "next/server";
import type { Catalog } from "@/lib/catalog";
import {
  getCatalog,   // <- nálad már létezik
  setCatalog,     // <- nálad már létezik
  FALLBACK_CATALOG,   // <- ha van; ha nincs, tegyél be egy minimálisat
} from "@/lib/catalog";

export async function GET() {
  const catalog = await getCatalog();   // Promise<Catalog | null>
  if (catalog) {
    return NextResponse.json({ ok: true, catalog, source: "kv" });
  }
  return NextResponse.json({ ok: true, catalog: FALLBACK_CATALOG, source: "fallback" });
}

export async function POST(req: Request) {
  try {
    // kerüljük az 'any'-t: unknown -> runtime check
    const body: unknown = await req.json();
    if (
      typeof body === "object" &&
      body !== null &&
      "catalog" in body
    ) {
      const catalog = (body as { catalog: Catalog }).catalog;
      await setCatalog(catalog);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ ok: false, error: "MISSING_CATALOG" }, { status: 400 });
  } catch {
    return NextResponse.json({ ok: false, error: "SERVER_ERROR" }, { status: 500 });
  }
}
