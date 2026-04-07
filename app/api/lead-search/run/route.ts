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
  const fallbackKeywords = [questionnaire.product_description, ...questionnaire.target_markets]
    .map((item) => sanitizeString(item, 80))
    .filter(Boolean)
    .join(" ")
    .slice(0, 240);

  return {
    person_titles: Array.isArray(baseFilters.person_titles) ? baseFilters.person_titles.slice(0, 4) : [],
    person_locations: [],
    organization_num_employees_ranges: [],
    q_keywords: fallbackKeywords || baseFilters.q_keywords || ""
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
  const result = await supabase
    .from("lead_search_daily_usage")
    .upsert(payload, { onConflict: "user_id,usage_date" });

  if (result.error) {
    throw new Error(`Failed to update daily usage: ${result.error.message}`);
  }
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
  if (session.session_type !== "app") {
    return NextResponse.json({ error: "Only activated app users can run snapshots." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as LeadSearchRequestBody;
    const questionnaire = toQuestionnaire(body);
    if (!questionnaire.company_name) {
      return NextResponse.json({ error: "Company name is required." }, { status: 400 });
    }
    if (!questionnaire.product_description) {
      return NextResponse.json({ error: "Product description is required." }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    
    // Clean up previous day records for this user
    await deletePreviousDayUsage(session.user_id, today);
    
    const usedToday = await readDailyUsage(session.user_id, today);
    const userLimit = await readUserLimit(session.user_id);
    if (!userLimit.isUnlimited && usedToday >= userLimit.dailyLimit) {
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

    // Only decrement quota if results were found
    let finalUsedCount = usedToday;
    if (preview.length > 0) {
      finalUsedCount = usedToday + 1;
      await writeDailyUsage(session.user_id, today, finalUsedCount);
    }

    const filtersHash = createHash("sha256").update(JSON.stringify(appliedFilters)).digest("hex");
    await insertEvent({
      userId: session.user_id,
      clientId: session.client_id,
      resultCount: preview.length,
      filtersHash
    });

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
