import { NextRequest, NextResponse } from "next/server";
import { getJWTFromCookies } from "./jwt";

export async function jwtMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const protectedRoutes = ["/profile", "/dashboard", "/settings"];

  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute) {
    try {
      const jwtPayload = await getJWTFromCookies();

      if (!jwtPayload) {
        const loginUrl = new URL("/loginname", request.url);
        return NextResponse.redirect(loginUrl);
      }

      if (jwtPayload.exp * 1000 < Date.now()) {
        const loginUrl = new URL("/loginname", request.url);
        return NextResponse.redirect(loginUrl);
      }

      return NextResponse.next();
    } catch (error) {
      const loginUrl = new URL("/loginname", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}
