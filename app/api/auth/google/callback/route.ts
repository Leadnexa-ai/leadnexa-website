import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { setSessionCookie, signSessionToken } from "../../../../../lib/auth-session";
import { sanitizeRedirectTarget } from "../../../../../lib/auth-redirect";
import { createServerSupabase } from "../../../../../lib/supabase-admin";

export const runtime = "nodejs";

const GOOGLE_STATE_COOKIE = "leadnexa_google_oauth_state";
const GOOGLE_NEXT_COOKIE = "leadnexa_google_oauth_next";

type GoogleTokenResponse = {
  access_token?: string;
  id_token?: string;
  error?: string;
  error_description?: string;
};

type GoogleUserInfo = {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
};

function getGoogleClientId(): string {
  const value = (process.env.GOOGLE_OAUTH_CLIENT_ID ?? "").trim();
  if (!value) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_ID.");
  }
  return value;
}

function getGoogleClientSecret(): string {
  const value = (process.env.GOOGLE_OAUTH_CLIENT_SECRET ?? "").trim();
  if (!value) {
    throw new Error("Missing GOOGLE_OAUTH_CLIENT_SECRET.");
  }
  return value;
}

function getGoogleRedirectUri(requestUrl: URL): string {
  const configured = (process.env.GOOGLE_OAUTH_REDIRECT_URI ?? "").trim();
  if (configured) {
    return configured;
  }
  return new URL("/api/auth/google/callback", requestUrl.origin).toString();
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function buildLoginRedirect(url: URL, message: string): NextResponse {
  const loginUrl = new URL("/login", url.origin);
  loginUrl.searchParams.set("error", message);
  return NextResponse.redirect(loginUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const urlState = String(requestUrl.searchParams.get("state") ?? "").trim();
  const code = String(requestUrl.searchParams.get("code") ?? "").trim();

  if (!urlState || !code) {
    return buildLoginRedirect(requestUrl, "Missing OAuth state or code.");
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_STATE_COOKIE)?.value ?? "";
  const rawNextCookie = cookieStore.get(GOOGLE_NEXT_COOKIE)?.value ?? "";
  let decodedNext = "/";
  if (rawNextCookie) {
    try {
      decodedNext = decodeURIComponent(rawNextCookie);
    } catch {
      decodedNext = "/";
    }
  }
  const nextTarget = sanitizeRedirectTarget(decodedNext, requestUrl.origin);

  if (!expectedState || expectedState !== urlState) {
    return buildLoginRedirect(requestUrl, "Google OAuth state mismatch.");
  }

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: getGoogleClientId(),
        client_secret: getGoogleClientSecret(),
        redirect_uri: getGoogleRedirectUri(requestUrl),
        grant_type: "authorization_code"
      }),
      cache: "no-store"
    });

    const tokenPayload = (await tokenRes.json().catch(() => ({}))) as GoogleTokenResponse;
    if (!tokenRes.ok || !tokenPayload.access_token) {
      throw new Error(tokenPayload.error_description || tokenPayload.error || "Google token exchange failed.");
    }

    const userRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokenPayload.access_token}` },
      cache: "no-store"
    });

    const userInfo = (await userRes.json().catch(() => ({}))) as Partial<GoogleUserInfo>;
    if (!userRes.ok || !userInfo.email || !userInfo.sub) {
      throw new Error("Failed to load Google user profile.");
    }

    if (!userInfo.email_verified) {
      throw new Error("Google account email is not verified.");
    }

    const email = normalizeEmail(userInfo.email);
    const supabase = createServerSupabase();

    const appUserResult = await supabase
      .from("app_users")
      .select("id, client_id, email, role, is_active, created_at")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (appUserResult.error) {
      throw new Error(`Failed to lookup app user: ${appUserResult.error.message}`);
    }

    let sessionToken: string;
    let requiresAccountNameOnboarding = false;
    const appUser = appUserResult.data;
    if (appUser?.id && appUser.is_active) {
      sessionToken = signSessionToken({
        session_type: "app",
        email: appUser.email,
        user_id: appUser.id,
        client_id: appUser.client_id,
        role: appUser.role
      });
    } else {
      const pendingLookup = await supabase
        .from("pending_signups")
        .select("id, email, status, email_verified_at, company_name, created_at")
        .eq("email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pendingLookup.error) {
        throw new Error(`Failed to lookup pending signup: ${pendingLookup.error.message}`);
      }

      let pendingId = pendingLookup.data?.id ?? null;
      let pendingCompanyName = pendingLookup.data?.company_name ?? null;
      if (!pendingId) {
        const generatedPasswordHash = await bcrypt.hash(
          `google:${userInfo.sub}:${Date.now()}:${Math.random()}`,
          12
        );

        const insertPending = await supabase
          .from("pending_signups")
          .insert({
            email,
            password_hash: generatedPasswordHash,
            company_name: null,
            status: "pending",
            email_verified_at: new Date().toISOString(),
            client_id: null,
            stripe_checkout_session_id: null,
            activated_at: null
          })
          .select("id, email")
          .single();

        if (insertPending.error || !insertPending.data?.id) {
          throw new Error(
            `Failed to create pending signup from Google account: ${insertPending.error?.message ?? "unknown error"}`
          );
        }

        pendingId = insertPending.data.id;
        pendingCompanyName = null;
      } else {
        if (pendingLookup.data?.status === "expired") {
          const resetPending = await supabase
            .from("pending_signups")
            .update({
              status: "pending",
              email_verified_at: new Date().toISOString()
            })
            .eq("id", pendingId);

          if (resetPending.error) {
            throw new Error(`Failed to reactivate expired pending signup: ${resetPending.error.message}`);
          }
        } else if (!pendingLookup.data?.email_verified_at) {
          const verifyPending = await supabase
            .from("pending_signups")
            .update({ email_verified_at: new Date().toISOString() })
            .eq("id", pendingId);

          if (verifyPending.error) {
            throw new Error(`Failed to verify pending signup email: ${verifyPending.error.message}`);
          }
        }
      }

      requiresAccountNameOnboarding = !String(pendingCompanyName ?? "").trim();

      sessionToken = signSessionToken({
        session_type: "pending",
        email,
        pending_signup_id: pendingId
      });
    }

    const redirectUrl = requiresAccountNameOnboarding
      ? new URL(
          `/onboarding/account-name?next=${encodeURIComponent(nextTarget)}`,
          requestUrl.origin
        )
      : new URL(nextTarget, requestUrl.origin);
    const response = NextResponse.redirect(redirectUrl);
    setSessionCookie(response, sessionToken);
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    response.cookies.delete(GOOGLE_NEXT_COOKIE);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sign in with Google.";
    const response = buildLoginRedirect(requestUrl, message);
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    response.cookies.delete(GOOGLE_NEXT_COOKIE);
    return response;
  }
}
