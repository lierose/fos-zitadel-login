import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export interface JWTPayload {
  userId: string;
  loginName: string;
  organizationId?: string;
  displayName?: string;
  email?: string;
  exp: number;
  iat: number;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key-change-this-in-production";
const JWT_ALGORITHM = "HS256";

export async function createJWT(payload: Omit<JWTPayload, "exp" | "iat">): Promise<string> {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const now = Math.floor(Date.now() / 1000);

  const jwt = await new SignJWT({
    ...payload,
    iat: now,
  })
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setExpirationTime("24h")
    .setIssuedAt(now)
    .sign(secret);

  return jwt;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [JWT_ALGORITHM],
    });

    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}

export async function getJWTFromCookies(): Promise<JWTPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token")?.value;

    if (!token) {
      return null;
    }

    return await verifyJWT(token);
  } catch (error) {
    console.error("Failed to get JWT from cookies:", error);
    return null;
  }
}

export async function setJWTCookie(token: string, maxAge: number = 86400): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge,
    path: "/",
  });
}

export async function clearJWTCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}
