import { NextResponse } from "next/server";
import { getStaff } from "@/lib/staff";

export async function GET() {
  const staff = await getStaff();
  return NextResponse.json({ ok: true, staff });
}
