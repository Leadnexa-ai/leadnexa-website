import { NextResponse } from "next/server";
import { getSessionFromCookie } from "../../../../lib/auth-session";
import { createServerSupabase } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

const DAILY_LIMIT = 3;

type UsageRow = {
  user_id: string;
  usage_date: string;
  used_count: number;
};

async function readDailyUsage(userId: string, usageDate: string): Promise<number> {
  const supabase = createServerSupabase();
  const result = await supabase
    .from("lead_search_daily_usage")
    .select("user_id, usage_date, used_count")
    .eq("user_id", userId)
    .eq("usage_date", usageDate)
    .maybeSingle();

  if (result.error) {
    throw new Error(`Failed to load daily usage: ${result.error.message}`);
  }
  const row = result.data as UsageRow | null;
  return row?.used_count ?? 0;
}

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let userId: string;

  if (session.session_type === "app") {
    userId = (session as any).user_id;
  } else if (session.session_type === "pending") {
    const supabase = createServerSupabase();
    const result = await supabase
      .from("pending_signups")
      .select("email_verified_at")
      .eq("id", (session as any).pending_signup_id)
      .maybeSingle();

    if (!result.data?.email_verified_at) {
      return NextResponse.json(
        { error: "Please verify your email first." },
        { status: 403 }
      );
    }

    userId = (session as any).pending_signup_id;
  } else {
    return NextResponse.json({ error: "Invalid session type." }, { status: 403 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    
    const usedToday = await readDailyUsage(userId, today);
    return NextResponse.json({
      used_today: usedToday,
      limit: DAILY_LIMIT,
      remaining: Math.max(0, DAILY_LIMIT - usedToday)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch quota." },
      { status: 500 }
    );
  }
}
