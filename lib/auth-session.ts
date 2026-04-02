import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE_NAME = "leadnexa_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

type BaseSessionClaims = {
  email: string;
};

export type AppSessionClaims = BaseSessionClaims & {
  session_type: "app";
  user_id: string;
  client_id: string;
  role: string;
};

export type PendingSessionClaims = BaseSessionClaims & {
  session_type: "pending";
  pending_signup_id: string;
};

export type SessionClaims = AppSessionClaims | PendingSessionClaims;

function getCookieDomain(): string | undefined {
  const raw = (process.env.SESSION_COOKIE_DOMAIN ?? "").trim();
  return raw ? raw : undefined;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("Missing JWT_SECRET (must be at least 32 characters).");
  }
  return secret;
}

export function signSessionToken(claims: SessionClaims): string {
  return jwt.sign(claims, getJwtSecret(), {
    algorithm: "HS256",
    expiresIn: SESSION_TTL_SECONDS,
    issuer: "leadnexa",
    audience: "leadnexa-web"
  });
}

export function verifySessionToken(token: string): SessionClaims | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
      issuer: "leadnexa",
      audience: "leadnexa-web"
    });

    if (!payload || typeof payload !== "object" || typeof payload.email !== "string") {
      return null;
    }

    if (
      payload.session_type === "app" &&
      typeof payload.user_id === "string" &&
      typeof payload.client_id === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        session_type: "app",
        email: payload.email,
        user_id: payload.user_id,
        client_id: payload.client_id,
        role: payload.role
      };
    }

    if (
      payload.session_type === "pending" &&
      typeof payload.pending_signup_id === "string"
    ) {
      return {
        session_type: "pending",
        email: payload.email,
        pending_signup_id: payload.pending_signup_id
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function getSessionFromCookie(): Promise<SessionClaims | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: getCookieDomain(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export function clearSessionCookie(response: NextResponse): void {
  const baseCookie = {
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true as const,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  };

  const domain = getCookieDomain();
  if (domain) {
    response.cookies.set({
      ...baseCookie,
      domain
    });
  }

  // Also clear host-only cookie variant for users who still have legacy scoped cookies.
  response.cookies.set(baseCookie);
}
