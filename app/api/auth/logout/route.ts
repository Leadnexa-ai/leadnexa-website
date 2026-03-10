import { NextResponse } from "next/server";
import {
  clearInternalAdminSessionCookie,
  clearSessionCookie
} from "../../../../lib/auth-session";

export const runtime = "nodejs";

function getAllowedRedirectOrigins(): Set<string> {
  const allowed = new Set<string>();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      allowed.add(new URL(appUrl).origin);
    } catch {}
  }

  const extra = (process.env.NEXT_PUBLIC_ALLOWED_REDIRECT_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  for (const origin of extra) {
    try {
      allowed.add(new URL(origin).origin);
    } catch {}
  }

  return allowed;
}

function resolveNextUrl(request: Request): string {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  if (!next) {
    return "/";
  }

  if (next.startsWith("/")) {
    return next;
  }

  try {
    const parsed = new URL(next);
    const allowedOrigins = getAllowedRedirectOrigins();
    const currentOrigin = new URL(request.url).origin;
    if (parsed.origin === currentOrigin || allowedOrigins.has(parsed.origin)) {
      return parsed.toString();
    }
  } catch {}

  return "/";
}

function clearAllSessionCookies(response: NextResponse): void {
  clearSessionCookie(response);
  clearInternalAdminSessionCookie(response);
}

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAllSessionCookies(response);
  return response;
}

export async function GET(request: Request) {
  const next = resolveNextUrl(request);
  const response = NextResponse.redirect(next);
  clearAllSessionCookies(response);
  return response;
}
