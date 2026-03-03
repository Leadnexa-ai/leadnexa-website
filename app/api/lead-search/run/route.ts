import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { ApolloApiError, getPersonDetail, searchPeople, type ApolloSearchPerson } from "../../../../lib/apollo";
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
    industry: sanitizeString(body.industry),
    target_regions: sanitizeArray(body.target_regions),
    job_titles: sanitizeArray(body.job_titles),
    company_size_ranges: sanitizeArray(body.company_size_ranges),
    keywords_include: sanitizeArray(body.keywords_include),
    keywords_exclude: sanitizeArray(body.keywords_exclude)
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

function nameFromPerson(person: ApolloSearchPerson, detail: Awaited<ReturnType<typeof getPersonDetail>>): string | null {
  const fromDetail = sanitizeString(detail?.person?.name);
  if (fromDetail) {
    return fromDetail;
  }
  const first = sanitizeString(person.first_name);
  const last = sanitizeString(person.last_name_obfuscated);
  return [first, last].filter(Boolean).join(" ").trim() || null;
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

async function insertEvent(input: {
  userId: string;
  clientId: string;
  resultCount: number;
  filtersHash: string;
}): Promise<void> {
  const supabase = createServerSupabase();
  const result = await supabase.from("lead_search_events").insert({
    user_id: input.userId,
    client_id: input.clientId,
    result_count: input.resultCount,
    filters_hash: input.filtersHash,
    cta_shown: true
  });

  if (result.error) {
    // Keep MVP request successful even when optional analytics table is not available yet.
    console.warn("lead_search_events insert skipped:", result.error.message);
  }
}

export async function POST(request: Request) {
  const session = getSessionFromCookie();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  if (session.session_type !== "app") {
    return NextResponse.json({ error: "Only activated app users can run snapshots." }, { status: 403 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as LeadSearchRequestBody;
    const questionnaire = toQuestionnaire(body);
    if (!questionnaire.industry) {
      return NextResponse.json({ error: "Industry is required." }, { status: 400 });
    }
    if (questionnaire.job_titles.length === 0) {
      return NextResponse.json({ error: "At least one job title is required." }, { status: 400 });
    }

    const today = new Date().toISOString().slice(0, 10);
    const usedToday = await readDailyUsage(session.user_id, today);
    if (usedToday >= DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: "Daily limit reached.",
          quota: { used_today: usedToday, limit: DAILY_LIMIT, remaining: 0 }
        },
        { status: 429 }
      );
    }

    const filters = await generateApolloFilters(questionnaire);
    const searchResponse = await searchPeople(filters);
    const searchPeopleRows = Array.isArray(searchResponse.people) ? searchResponse.people.slice(0, 20) : [];

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

    const newCount = usedToday + 1;
    await writeDailyUsage(session.user_id, today, newCount);

    const filtersHash = createHash("sha256").update(JSON.stringify(filters)).digest("hex");
    await insertEvent({
      userId: session.user_id,
      clientId: session.client_id,
      resultCount: preview.length,
      filtersHash
    });

    return NextResponse.json({
      quota: {
        used_today: newCount,
        limit: DAILY_LIMIT,
        remaining: Math.max(0, DAILY_LIMIT - newCount)
      },
      applied_filters: filters,
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
