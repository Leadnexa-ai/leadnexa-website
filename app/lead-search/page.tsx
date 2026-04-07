import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSessionFromCookie } from "../../lib/auth-session";
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

  return <LeadSearchClient isPendingSession={session.session_type !== "app"} />;
}
