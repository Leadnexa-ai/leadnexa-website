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

function extractMainKeywords(text: string): string {
  // Common stop words to filter out
  const stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by", "from",
    "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "must", "can", "that", "this", "these",
    "those", "i", "you", "he", "she", "it", "we", "they", "what", "which", "who", "when", "where",
    "why", "how", "all", "each", "every", "both", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "just", "as"
  ]);

  // Split text into words and clean
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove special characters
    .split(/\s+/)
    .filter((word) => {
      // Keep words that are not stop words and have more than 2 characters
      return word.length > 2 && !stopWords.has(word);
    });

  // Get top 1 main keyword only
  const mainKeyword = Array.from(new Set(words))[0];
  
  // Return single keyword
  return mainKeyword || "";
}

function buildKeywordText(input: LeadSearchQuestionnaire): string {
  // Only extract keywords from product description
  if (input.product_description) {
    const extractedKeywords = extractMainKeywords(input.product_description);
    if (extractedKeywords) {
      return trimKeywordText(extractedKeywords);
    }
  }
  return "";
}

function normalizeFilterOutput(input: AiFilterOutput, fallback: LeadSearchQuestionnaire): ApolloPeopleSearchFilters {
  const personTitles = sanitizeStringList(input.person_titles, MAX_LIST_ITEMS);
  const personLocations = sanitizeStringList(input.person_locations, MAX_LIST_ITEMS);
  const employeeRanges = sanitizeStringList(input.organization_num_employees_ranges, MAX_LIST_ITEMS);
  let qKeywords =
    typeof input.q_keywords === "string" && input.q_keywords.trim()
      ? trimKeywordText(input.q_keywords)
      : buildKeywordText(fallback);

  // Safety check: Remove location words from keywords if they somehow ended up there
  if (personLocations.length > 0 && qKeywords) {
    const locationWords = personLocations
      .flatMap((loc) => loc.split(/[,\s]+/).filter(Boolean))
      .map((word) => word.toLowerCase());
    
    const keywordParts = qKeywords.toLowerCase().split(/[,\s]+/);
    const filteredKeywords = keywordParts.filter((word) => !locationWords.includes(word));
    qKeywords = trimKeywordText(filteredKeywords.join(" "));
  }

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
    "",
    "IMPORTANT RULES:",
    "- person_locations: Extract ONLY specific country or city names from target_markets (e.g., 'United States', 'Germany', 'London, UK'). NEVER include locations in q_keywords.",
    "- person_titles: B2B buyer job titles only (Manager, Director, VP, etc.)",
    "- organization_num_employees_ranges: Size ranges like '1-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10001+'",
    "- q_keywords: Extract ONLY two keywords from the whole sentence product_description. two words only, e.g., 'vending machines', 'b2b meeting', 'software', 'consulting'. NO phrases, NO locations, NO multiple words.",
    "",
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
