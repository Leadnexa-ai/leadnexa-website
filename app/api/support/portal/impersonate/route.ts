import { NextResponse } from "next/server";
import {
  getInternalAdminSessionFromCookie,
  setSessionCookie,
  signSessionToken
} from "../../../../../lib/auth-session";
import { sanitizeRedirectTarget } from "../../../../../lib/auth-redirect";
import {
  assertInternalAdminCanAccessClient,
  chooseImpersonationTargetAppUser,
  logInternalAdminImpersonation
} from "../../../../../lib/internal-admin";
import { createServerSupabase } from "../../../../../lib/supabase-admin";

export const runtime = "nodejs";

function getDefaultPortalTarget(): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001").trim().replace(/\/$/, "");
  return `${appUrl}/portal`;
}

function buildSupportRedirect(message: string, nextTarget: string): NextResponse {
  const baseUrl = process.env.WEBSITE_URL ?? "http://localhost:3000";
  const url = new URL(`/support/portal?next=${encodeURIComponent(nextTarget)}`, baseUrl);
  url.searchParams.set("error", message);
  return NextResponse.redirect(url);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const clientId = String(formData.get("clientId") ?? "").trim();
  const nextTarget = sanitizeRedirectTarget(
    String(formData.get("next") ?? getDefaultPortalTarget()),
    new URL(request.url).origin
  );
  const internalSession = await getInternalAdminSessionFromCookie();

  if (!internalSession || internalSession.session_type !== "internal_admin") {
    return NextResponse.redirect(
      new URL(
        `/login?next=${encodeURIComponent(`/support/portal?next=${encodeURIComponent(nextTarget)}`)}`,
        request.url
      )
    );
  }

  if (!clientId) {
    return buildSupportRedirect("Missing client selection.", nextTarget);
  }

  try {
    const supabase = createServerSupabase();
    await assertInternalAdminCanAccessClient({
      supabase,
      internalAdminUserId: internalSession.internal_admin_user_id,
      clientId
    });

    const appUser = await chooseImpersonationTargetAppUser({ supabase, clientId });
    if (!appUser?.id) {
      return buildSupportRedirect("This client does not have an active portal user yet.", nextTarget);
    }

    await logInternalAdminImpersonation({
      supabase,
      internalAdminUserId: internalSession.internal_admin_user_id,
      clientId,
      appUserId: appUser.id,
      destinationPath: nextTarget
    });

    const appSessionToken = signSessionToken({
      session_type: "app",
      email: appUser.email,
      user_id: appUser.id,
      client_id: appUser.client_id,
      role: appUser.role
    });

    const response = NextResponse.redirect(new URL(nextTarget, request.url));
    setSessionCookie(response, appSessionToken);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to enter the client portal.";
    return buildSupportRedirect(message, nextTarget);
  }
}
