import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token } = await req.json();
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin", "1", { httpOnly: true, sameSite: "lax", secure: true, path: "/" });
  return res;
}
