import { createHash } from "crypto";
import { NextResponse } from "next/server";
import {
  ApolloApiError,
  getPersonDetail,
  searchPeople,
  type ApolloPeopleSearchFilters,
  type ApolloSearchPerson
} from "../../../../lib/apollo";
import { getSessionFromCookie } from "../../../../lib/auth-session";
import { generateApolloFilters, type LeadSearchQuestionnaire } from "../../../../lib/lead-search-ai";
import { createServerSupabase } from "../../../../lib/supabase-admin";

export const runtime = "nodejs";

const DAILY_LIMIT = 3;
const SNAPSHOT_MESSAGE = {
  headline: "This preview validates your reachable market.",
  detail: "Before launching, we refine and quality-control your list using multiple data sources and AI filtering."
};
const CTA = {
  label: "Book a strategy call",
  href: "/talk-to-our-team"
};

type LeadSearchRequestBody = Partial<LeadSearchQuestionnaire>;

type UsageRow = {
  user_id: string;
  usage_date: string;
  used_count: number;
};

type UserLimitRow = {
  is_unlimited: boolean;
  daily_limit: number | null;
};

type PreviewLead = {
  full_name: string | null;
  title: string | null;
  company_name: string | null;
  linkedin_url: string | null;
  location_label: string | null;
};

function sanitizeString(value: unknown, maxLength = 120): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function sanitizeArray(value: unknown, maxItems = 10, maxLength = 80): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const unique = new Set<string>();
  for (const item of value) {
    const next = sanitizeString(item, maxLength);
    if (!next) {
      continue;
    }
    unique.add(next);
    if (unique.size >= maxItems) {
      break;
    }
  }
  return Array.from(unique);
}

function toQuestionnaire(body: LeadSearchRequestBody): LeadSearchQuestionnaire {
  return {
    company_name: sanitizeString(body.company_name),
    company_website: sanitizeString(body.company_website, 200),
    product_description: sanitizeString(body.product_description, 400),
    target_markets: sanitizeArray(body.target_markets),
    exclusions: sanitizeArray(body.exclusions)
  };
}

function locationLabel(input: {
  city?: string;
  state?: string;
  country?: string;
}): string | null {
  const pieces = [input.city, input.state, input.country]
    .map((item) => sanitizeString(item, 50))
    .filter(Boolean);
  return pieces.length > 0 ? pieces.join(", ") : null;
}

function nameFromPerson(
  person: ApolloSearchPerson,
  detail: Awaited<ReturnType<typeof getPersonDetail>>
): string | null {
  const fromDetail = sanitizeString(detail?.person?.name);
  if (fromDetail) {
    return fromDetail;
  }
  const first = sanitizeString(person.first_name);
  const last = sanitizeString(person.last_name_obfuscated);
  return [first, last].filter(Boolean).join(" ").trim() || null;
}

function buildRelaxedFilters(
  baseFilters: ApolloPeopleSearchFilters,
  questionnaire: LeadSearchQuestionnaire
): ApolloPeopleSearchFilters {
  return {
    person_locations: [],
    organization_num_employees_ranges: [],
    q_organization_keyword_tags: []
  };
}

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
    // In case table is unavailable in some environments, fall back to default limit.
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

async function writeDailyUsage(userId: string, usageDate: string, newCount: number): Promise<void> {
  const supabase = createServerSupabase();
  const payload = {
    user_id: userId,
    usage_date: usageDate,
    used_count: newCount
  };

  console.log(`[Quota] Attempting insert with payload:`, JSON.stringify(payload));

  // First try to insert new record
  const insertResult = await supabase
    .from("lead_search_daily_usage")
    .insert([payload]);

  if (!insertResult.error) {
    console.log(`[Quota] ✓ Inserted new usage record for user ${userId} on ${usageDate}`);
    return;
  }

  // If insert fails (likely duplicate), try update instead
  console.log(`[Quota] Insert failed, code:`, insertResult.error.code, `message:`, insertResult.error.message);
  console.log(`[Quota] Attempting update for user ${userId} on ${usageDate}`);
  
  const updateResult = await supabase
    .from("lead_search_daily_usage")
    .update({ used_count: newCount })
    .eq("user_id", userId)
    .eq("usage_date", usageDate);

  if (updateResult.error) {
    console.error(`[Quota] ✗ Both insert and update failed:`, updateResult.error);
    throw new Error(`Failed to update daily usage: ${updateResult.error.message}`);
  }

  console.log(`[Quota] ✓ Updated usage record for user ${userId} on ${usageDate}`);
}

async function deletePreviousDayUsage(userId: string, usageDate: string): Promise<void> {
  const supabase = createServerSupabase();
  const result = await supabase
    .from("lead_search_daily_usage")
    .delete()
    .eq("user_id", userId)
    .neq("usage_date", usageDate);

  if (result.error) {
    // Log the error but don't throw - this is a cleanup operation
    console.warn(`Failed to delete previous day usage records: ${result.error.message}`);
  }
}

async function insertEvent(input: {
  userId: string;
  clientId: string;
  resultCount: number;
  filtersHash: string;
}): Promise<void> {
  const supabase = createServerSupabase();
  const result = await supabase.from("lead_search_events").upsert(
    {
      user_id: input.userId,
      client_id: input.clientId,
      result_count: input.resultCount,
      filters_hash: input.filtersHash,
      cta_shown: true
    },
    { onConflict: "user_id" }
  );

  if (result.error) {
    // Keep MVP request successful even when optional analytics table is not available yet.
    console.warn("lead_search_events insert skipped:", result.error.message);
  }
}

export async function POST(request: Request) {
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
        { error: "Please verify your email before generating snapshots." },
        { status: 403 }
      );
    }

    userId = (session as any).pending_signup_id;
  } else {
    return NextResponse.json({ error: "Invalid session type." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as LeadSearchRequestBody;
    const questionnaire = toQuestionnaire(body);
    if (!questionnaire.product_description) {
      return NextResponse.json({ error: "Product description is required." }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    console.log(`[Quota] Starting lead search for user: ${userId}, today: ${today}`);
    
    let usedToday = 0;
    let userLimit = { isUnlimited: false, dailyLimit: DAILY_LIMIT };

    // Clean up old records
    try {
      await deletePreviousDayUsage(userId, today);
    } catch (error) {
      console.error("[Quota] Failed to delete previous day usage:", error);
    }

    // Read current usage
    try {
      usedToday = await readDailyUsage(userId, today);
      console.log(`[Quota] User ${userId} has used ${usedToday} on ${today}`);
    } catch (error) {
      console.error("[Quota] Failed to read daily usage:", error);
      usedToday = 0;
    }

    // Read user limit
    try {
      userLimit = await readUserLimit(userId);
      console.log(`[Quota] User ${userId} limit: ${userLimit.isUnlimited ? 'unlimited' : userLimit.dailyLimit} daily searches`);
    } catch (error) {
      console.error("[Quota] Failed to read user limit:", error);
      userLimit = { isUnlimited: false, dailyLimit: DAILY_LIMIT };
    }
    
    if (!userLimit.isUnlimited && usedToday >= userLimit.dailyLimit) {
      console.log(`[Quota] User ${userId} has hit daily limit`);
      return NextResponse.json(
        {
          error: "Daily limit reached.",
          quota: { used_today: usedToday, limit: userLimit.dailyLimit, remaining: 0 }
        },
        { status: 429 }
      );
    }

    const generatedFilters = await generateApolloFilters(questionnaire);
    const initialSearchResponse = await searchPeople(generatedFilters);
    let searchPeopleRows = Array.isArray(initialSearchResponse.people)
      ? initialSearchResponse.people.slice(0, 20)
      : [];
    let appliedFilters: ApolloPeopleSearchFilters = generatedFilters;

    if (searchPeopleRows.length === 0) {
      const relaxedFilters = buildRelaxedFilters(generatedFilters, questionnaire);
      const relaxedResponse = await searchPeople(relaxedFilters);
      searchPeopleRows = Array.isArray(relaxedResponse.people) ? relaxedResponse.people.slice(0, 20) : [];
      appliedFilters = relaxedFilters;
    }

    const enrichedRows = await Promise.all(
      searchPeopleRows.map(async (person) => {
        const personId = sanitizeString(person.id, 50);
        if (!personId) {
          return { person, detail: null };
        }
        try {
          const detail = await getPersonDetail(personId);
          return { person, detail };
        } catch {
          return { person, detail: null };
        }
      })
    );

    const preview: PreviewLead[] = enrichedRows.map(({ person, detail }) => ({
      full_name: nameFromPerson(person, detail),
      title: sanitizeString(detail?.person?.title ?? person.title, 120) || null,
      company_name:
        sanitizeString(detail?.person?.organization?.name ?? person.organization?.name, 120) || null,
      linkedin_url: sanitizeString(detail?.person?.linkedin_url, 300) || null,
      location_label: locationLabel({
        city: detail?.person?.city,
        state: detail?.person?.state,
        country: detail?.person?.country
      })
    }));

    // Only write daily usage if results were found
    let finalUsedCount = usedToday;
    console.log(`[Lead Search] Preview has ${preview.length} results for user ${userId}`);
    
    if (preview.length > 0) {
      finalUsedCount = usedToday + 1;
      console.log(`[Lead Search] Incrementing usage for ${userId}: ${usedToday} -> ${finalUsedCount}`);
      try {
        console.log(`[Lead Search] Calling writeDailyUsage with payload: user_id=${userId}, usage_date=${today}, used_count=${finalUsedCount}`);
        await writeDailyUsage(userId, today, finalUsedCount);
        console.log(`[Lead Search] Successfully wrote usage: ${finalUsedCount}`);
      } catch (error) {
        console.error("[Lead Search] Failed to write daily usage:", error);
      }
    } else {
      console.log(`[Lead Search] No results found, usage not incremented`);
    }

    const filtersHash = createHash("sha256").update(JSON.stringify(appliedFilters)).digest("hex");
    
    // Track events for all users
    try {
      await insertEvent({
        userId: userId,
        clientId: (session as any).client_id || "",
        resultCount: preview.length,
        filtersHash
      });
    } catch (error) {
      // Analytics tracking is optional, don't fail the request
      console.warn("Failed to track event:", error);
    }

    return NextResponse.json({
      quota: {
        used_today: finalUsedCount,
        limit: userLimit.isUnlimited ? null : userLimit.dailyLimit,
        remaining: userLimit.isUnlimited ? null : Math.max(0, userLimit.dailyLimit - finalUsedCount)
      },
      applied_filters: appliedFilters,
      preview,
      snapshot_message: SNAPSHOT_MESSAGE,
      cta: CTA
    });
  } catch (error) {
    if (error instanceof ApolloApiError) {
      return NextResponse.json(
        { error: `Apollo request failed (${error.status}).` },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Snapshot generation failed." },
      { status: 500 }
    );
  }
}
