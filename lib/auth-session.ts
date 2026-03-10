import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const SESSION_COOKIE_NAME = "leadnexa_session";
export const INTERNAL_ADMIN_SESSION_COOKIE_NAME = "leadnexa_internal_admin_session";
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

export type InternalAdminSessionClaims = BaseSessionClaims & {
  session_type: "internal_admin";
  internal_admin_user_id: string;
  role: "support_admin";
};

export type SessionClaims =
  | AppSessionClaims
  | PendingSessionClaims
  | InternalAdminSessionClaims;

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
      payload.session_type === "internal_admin" &&
      typeof payload.internal_admin_user_id === "string" &&
      payload.role === "support_admin"
    ) {
      return {
        session_type: "internal_admin",
        email: payload.email,
        internal_admin_user_id: payload.internal_admin_user_id,
        role: "support_admin"
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

export function getSessionFromCookie(cookieName = SESSION_COOKIE_NAME): SessionClaims | null {
  const token = cookies().get(cookieName)?.value;
  if (!token) {
    return null;
  }
  return verifySessionToken(token);
}

export function getInternalAdminSessionFromCookie(): InternalAdminSessionClaims | null {
  const internalSession = getSessionFromCookie(INTERNAL_ADMIN_SESSION_COOKIE_NAME);
  if (internalSession?.session_type === "internal_admin") {
    return internalSession;
  }

  const primarySession = getSessionFromCookie();
  if (primarySession?.session_type === "internal_admin") {
    return primarySession;
  }

  return null;
}

export function setSessionCookie(
  response: NextResponse,
  token: string,
  cookieName = SESSION_COOKIE_NAME
): void {
  response.cookies.set({
    name: cookieName,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    domain: getCookieDomain(),
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });
}

export function setInternalAdminSessionCookie(response: NextResponse, token: string): void {
  setSessionCookie(response, token, INTERNAL_ADMIN_SESSION_COOKIE_NAME);
}

export function clearSessionCookie(response: NextResponse, cookieName = SESSION_COOKIE_NAME): void {
  const baseCookie = {
    name: cookieName,
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

  response.cookies.set(baseCookie);
}

export function clearInternalAdminSessionCookie(response: NextResponse): void {
  clearSessionCookie(response, INTERNAL_ADMIN_SESSION_COOKIE_NAME);
}
