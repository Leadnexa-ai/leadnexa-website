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

type UserLimitRow = {
  is_unlimited: boolean;
  daily_limit: number | null;
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

async function readUserLimit(userId: string): Promise<{ isUnlimited: boolean; dailyLimit: number }> {
  const supabase = createServerSupabase();
  const result = await supabase
    .from("lead_search_user_limits")
    .select("is_unlimited, daily_limit")
    .eq("user_id", userId)
    .maybeSingle();

  if (result.error) {
    return { isUnlimited: false, dailyLimit: DAILY_LIMIT };
  }

  const row = (result.data as UserLimitRow | null) ?? null;
  if (!row) {
    return { isUnlimited: false, dailyLimit: DAILY_LIMIT };
  }
  if (row.is_unlimited) {
    return { isUnlimited: true, dailyLimit: Number.MAX_SAFE_INTEGER };
  }

  const parsedLimit = Number(row.daily_limit ?? DAILY_LIMIT);
  if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
    return { isUnlimited: false, dailyLimit: DAILY_LIMIT };
  }

  return { isUnlimited: false, dailyLimit: parsedLimit };
}

export async function GET() {
  const session = await getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (session.session_type !== "app") {
    return NextResponse.json({ error: "Only activated app users can check quota." }, { status: 403 });
  }

  try {
    const today = new Date().toISOString().slice(0, 10);
    const usedToday = await readDailyUsage(session.user_id, today);
    const userLimit = await readUserLimit(session.user_id);

    return NextResponse.json({
      used_today: usedToday,
      limit: userLimit.isUnlimited ? null : userLimit.dailyLimit,
      remaining: userLimit.isUnlimited ? null : Math.max(0, userLimit.dailyLimit - usedToday)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch quota." },
      { status: 500 }
    );
  }
}
