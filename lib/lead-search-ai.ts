import type { ApolloPeopleSearchFilters } from "./apollo";

export type LeadSearchQuestionnaire = {
  company_name: string;
  company_website: string;
  product_description: string;
  target_markets: string[];
  exclusions: string[];
};

type AiFilterOutput = {
  person_titles?: unknown;
  person_locations?: unknown;
  organization_num_employees_ranges?: unknown;
  q_keywords?: unknown;
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

function trimKeywordText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, MAX_KEYWORD_LENGTH);
}

function buildKeywordText(input: LeadSearchQuestionnaire): string {
  const parts: string[] = [];

  if (input.product_description) {
    parts.push(input.product_description);
  }
  for (const keyword of input.target_markets) {
    parts.push(keyword);
  }
  for (const keyword of input.exclusions) {
    parts.push(`-${keyword}`);
  }

  return trimKeywordText(parts.join(" "));
}

function normalizeFilterOutput(input: AiFilterOutput, fallback: LeadSearchQuestionnaire): ApolloPeopleSearchFilters {
  const personTitles = sanitizeStringList(input.person_titles, MAX_LIST_ITEMS);
  const personLocations = sanitizeStringList(input.person_locations, MAX_LIST_ITEMS);
  const employeeRanges = sanitizeStringList(input.organization_num_employees_ranges, MAX_LIST_ITEMS);
  const qKeywords =
    typeof input.q_keywords === "string" && input.q_keywords.trim()
      ? trimKeywordText(input.q_keywords)
      : buildKeywordText(fallback);

  return {
    person_titles: personTitles,
    person_locations: personLocations,
    organization_num_employees_ranges: employeeRanges,
    q_keywords: qKeywords
  };
}

function buildFallbackFilters(input: LeadSearchQuestionnaire): ApolloPeopleSearchFilters {
  return {
    person_titles: [],
    person_locations: [],
    organization_num_employees_ranges: [],
    q_keywords: buildKeywordText(input)
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
    "Return JSON only with keys:",
    "person_titles: string[]",
    "person_locations: string[]",
    "organization_num_employees_ranges: string[]",
    "q_keywords: string",
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
    return normalizeFilterOutput(aiOutput, questionnaire);
  } catch {
    // For MVP resiliency, fall back to deterministic mapping when LLM fails.
    return fallbackFilters;
  }
}
