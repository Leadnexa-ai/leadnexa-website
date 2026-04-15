import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionFromCookie } from "../../lib/auth-session";
import { createServerSupabase } from "../../lib/supabase-admin";
import LeadSearchClient from "./lead-search-client";

export const metadata: Metadata = {
  title: "Target Market Snapshot",
  description: "Validate your reachable market with an AI-generated lead snapshot.",
  robots: {
    index: false,
    follow: false
  },
  alternates: {
    canonical: "/lead-search"
  }
};

export default async function LeadSearchPage() {
  const session = await getSessionFromCookie();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent("/lead-search")}`);
  }

  let isPendingSession = false;

  if (session.session_type === "pending") {
    const supabase = createServerSupabase();
    const result = await supabase
      .from("pending_signups")
      .select("email_verified_at")
      .eq("id", session.pending_signup_id)
      .maybeSingle();

    // If email_verified_at is null, the session is still pending
    isPendingSession = !result.data?.email_verified_at;
  }

  return <LeadSearchClient isPendingSession={isPendingSession} />;
}
