import { NextResponse } from "next/server";
import { clearJWTCookie } from "@/lib/jwt";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });

  await clearJWTCookie();

  response.cookies.set("zid", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  response.cookies.set("auth_tokens", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
