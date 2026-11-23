import { NextRequest, NextResponse } from "next/server";
// First gate only: the real session and role checks run on the server in every admin page, server action and API route.
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname !== "/admin/login" && !req.cookies.get("session")) return NextResponse.redirect(new URL("/admin/login", req.url));
}
export const config = { matcher: ["/admin/:path*"] };
