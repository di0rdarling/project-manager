import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { CURRENT_USER_ID_HEADER } from "@/lib/current-user";

const PUBLIC_PAGE_PATHS = ["/", "/login", "/signup"];
// Only the auth endpoints that must work *without* an existing session.
// Everything else under /api/auth/ (e.g. /api/auth/me) still requires one.
const PUBLIC_API_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const session = verifySessionToken(token);

  const isPublicPage =
    pathname === "/" ||
    PUBLIC_PAGE_PATHS.some(
      (path) => path !== "/" && pathname.startsWith(path),
    );
  const isPublicApiPath = PUBLIC_API_PATHS.includes(pathname);

  if (isPublicPage || isPublicApiPath) {
    if (session) {
      if (pathname === "/login" || pathname === "/signup") {
        return NextResponse.redirect(new URL("/home", request.url));
      }

      if (pathname === "/") {
        return NextResponse.redirect(new URL("/home", request.url));
      }
    }

    return NextResponse.next();
  }

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Never trust a client-supplied value for this header; only forward the
  // userId we just verified from the signed session cookie.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(CURRENT_USER_ID_HEADER, session.userId);

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
