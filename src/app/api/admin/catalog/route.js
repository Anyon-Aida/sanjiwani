import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCatalog, setCatalog } from "@/lib/catalog";

function isAdmin() {
  const c = cookies().get("admin");
  return c?.value === "1";
}

export async function GET() {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const data = await getCatalog();
  return NextResponse.json({ ok: true, data });
}

export async function PUT(req) {
  if (!isAdmin()) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json();
  await setCatalog(body);
  return NextResponse.json({ ok: true });
}
