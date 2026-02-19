import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // maintenance mindenhol (kivéve maintenance oldal maga)
  if (process.env.MAINTENANCE_MODE === "true" &&
      !req.nextUrl.pathname.startsWith("/admin") &&
      req.nextUrl.pathname !== "/maintenance.html")
  {
    return NextResponse.rewrite(new URL("/maintenance.html", req.url));
  }

  // admin védelem
  if (
    req.nextUrl.pathname.startsWith("/admin") &&
    !req.nextUrl.pathname.startsWith("/admin/login")
  ) {
    const c = req.cookies.get("admin");
    if (!c) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// fusson minden oldalra, de ne API-ra, ne _next staticra, ne faviconra, stb.
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
