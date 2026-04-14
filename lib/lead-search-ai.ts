import type { ApolloPeopleSearchFilters } from "./apollo";

export type LeadSearchQuestionnaire = {
  company_name?: string;
  company_website?: string;
  product_description: string;
  target_markets: string[];
  exclusions?: string[];
};

type AiFilterOutput = {
  person_locations?: unknown;
  organization_num_employees_ranges?: unknown;
  q_organization_keyword_tags?: unknown;
};

const MAX_LIST_ITEMS = 10;
const MAX_KEYWORD_LENGTH = 280;

function sanitizeStringList(input: unknown, maxItems: number): string[] {
  if (!Array.isArray(input)) {
    return [];
  }
  const deduped = new Set<string>();
  for (const item of input) {
    const value = String(item ?? "").trim();
    if (!value) {
      continue;
    }
    deduped.add(value);
    if (deduped.size >= maxItems) {
      break;
    }
  }
  return Array.from(deduped);
}



function normalizeFilterOutput(input: AiFilterOutput, fallback: LeadSearchQuestionnaire): ApolloPeopleSearchFilters {
  const personLocations = sanitizeStringList(input.person_locations, MAX_LIST_ITEMS);
  const employeeRanges = sanitizeStringList(input.organization_num_employees_ranges, MAX_LIST_ITEMS);
  const organizationKeywordTags = sanitizeStringList(input.q_organization_keyword_tags, MAX_LIST_ITEMS);

  return {
    person_locations: personLocations,
    organization_num_employees_ranges: employeeRanges,
    q_organization_keyword_tags: organizationKeywordTags
  };
}

function buildFallbackFilters(input: LeadSearchQuestionnaire): ApolloPeopleSearchFilters {
  return {
    person_locations: [],
    organization_num_employees_ranges: [],
    q_organization_keyword_tags: []
  };
}

function getOpenAiApiKey(): string {
  const key = (process.env.OPENAI_API_KEY ?? "").trim();
  if (!key) {
    throw new Error("Missing OPENAI_API_KEY.");
  }
  return key;
}

function extractJsonObject(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in LLM output.");
  }
  return text.slice(start, end + 1);
}

export async function generateApolloFilters(
  questionnaire: LeadSearchQuestionnaire
): Promise<ApolloPeopleSearchFilters> {
  const model = (process.env.OPENAI_MODEL ?? "gpt-4o-mini").trim();
  const fallbackFilters = buildFallbackFilters(questionnaire);

const system = [
    "You convert a B2B market questionnaire into Apollo people search filters.",
    "The questionnaire contains only company context. Infer relevant targeting.",
    "Prefer practical B2B buyer titles and target regions from the provided context.",
    "",
    "IMPORTANT RULES:",
    "- person_locations: Extract specific country or city names from BOTH target_markets and product_description. Split comma-separated locations into individual strings (e.g., 'Ontario, Canada' becomes ['Ontario', 'Canada']). Examples: 'United States', 'Germany', 'London', 'Ontario', 'Canada'. Append locations found in product_description to locations from target_markets.",
    "- organization_num_employees_ranges: Size ranges like '1-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'",
    "- q_organization_keyword_tags: Extract relevant industry keywords, verticals, and technology sectors from product_description and target_markets. Filter intelligently to keep only meaningful, industry-relevant terms. Examples: 'saas', 'fintech', 'consulting', 'ecommerce', 'healthcare'. Array of strings, max 10.",
    "",
    "Return JSON only with keys:",
    "person_locations: string[]",
    "organization_num_employees_ranges: string[]",
    "q_organization_keyword_tags: string[]",
    "No markdown. No extra keys."
].join("\n");

  const user = JSON.stringify(questionnaire);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getOpenAiApiKey()}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ]
      })
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(`OpenAI request failed (${response.status}): ${rawText.slice(0, 200)}`);
    }

    const payload = rawText ? JSON.parse(rawText) : {};
    const content: string = payload?.choices?.[0]?.message?.content ?? "";
    const jsonText = extractJsonObject(content);
    const aiOutput = JSON.parse(jsonText) as AiFilterOutput;
    const result = normalizeFilterOutput(aiOutput, questionnaire);
    console.log("=== FINAL APOLLO FILTERS ===");
    console.log(JSON.stringify(result, null, 2));
    console.log("=== END ===");
    return result;
  } catch (error) {
    console.error("Error generating Apollo filters:", error);
    // For MVP resiliency, fall back to deterministic mapping when LLM fails.
    return fallbackFilters;
  }
}
