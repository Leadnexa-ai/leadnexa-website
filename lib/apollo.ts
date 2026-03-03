type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type ApolloRequestInit = {
  method?: "GET" | "POST";
  body?: Record<string, JsonValue> | null;
};

export type ApolloPeopleSearchFilters = {
  person_titles?: string[];
  person_locations?: string[];
  organization_num_employees_ranges?: string[];
  q_keywords?: string;
};

export type ApolloSearchPerson = {
  id?: string;
  first_name?: string;
  last_name_obfuscated?: string;
  title?: string;
  organization?: {
    name?: string;
  };
};

export type ApolloPeopleSearchResponse = {
  total_entries?: number;
  people?: ApolloSearchPerson[];
};

export type ApolloPersonDetail = {
  person?: {
    id?: string;
    name?: string;
    title?: string;
    linkedin_url?: string;
    city?: string;
    state?: string;
    country?: string;
    organization?: {
      name?: string;
    };
  };
};

export class ApolloApiError extends Error {
  public readonly status: number;
  public readonly body: string;

  constructor(message: string, status: number, body: string) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

function getApolloApiKey(): string {
  const key = (process.env.APOLLO_API_KEY ?? "").trim();
  if (!key) {
    throw new Error("Missing APOLLO_API_KEY.");
  }
  return key;
}

async function apolloRequest<T>(path: string, init: ApolloRequestInit = {}): Promise<T> {
  const url = `https://api.apollo.io${path}`;
  const method = init.method ?? "POST";

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": getApolloApiKey()
    },
    body: method === "GET" ? undefined : JSON.stringify(init.body ?? {})
  });

  const bodyText = await response.text();
  if (!response.ok) {
    throw new ApolloApiError(`Apollo request failed (${response.status})`, response.status, bodyText);
  }

  return (bodyText ? JSON.parse(bodyText) : {}) as T;
}

function normalizeApolloFilters(input: ApolloPeopleSearchFilters): ApolloPeopleSearchFilters {
  const normalized: ApolloPeopleSearchFilters = {};

  if (Array.isArray(input.person_titles) && input.person_titles.length > 0) {
    normalized.person_titles = input.person_titles;
  }
  if (Array.isArray(input.person_locations) && input.person_locations.length > 0) {
    normalized.person_locations = input.person_locations;
  }
  if (
    Array.isArray(input.organization_num_employees_ranges) &&
    input.organization_num_employees_ranges.length > 0
  ) {
    normalized.organization_num_employees_ranges = input.organization_num_employees_ranges;
  }
  if (typeof input.q_keywords === "string" && input.q_keywords.trim()) {
    normalized.q_keywords = input.q_keywords.trim();
  }

  return normalized;
}

export async function searchPeople(filters: ApolloPeopleSearchFilters): Promise<ApolloPeopleSearchResponse> {
  const payload = {
    page: 1,
    per_page: 20,
    ...normalizeApolloFilters(filters)
  };

  try {
    return await apolloRequest<ApolloPeopleSearchResponse>("/api/v1/mixed_people/api_search", {
      method: "POST",
      body: payload
    });
  } catch (error) {
    const isValidationError = error instanceof ApolloApiError && error.status === 422;
    if (!isValidationError) {
      throw error;
    }

    // Apollo may reject some combinations. Retry with a minimal payload to keep MVP resilient.
    return apolloRequest<ApolloPeopleSearchResponse>("/api/v1/mixed_people/api_search", {
      method: "POST",
      body: {
        page: 1,
        per_page: 20,
        q_keywords: filters.q_keywords ?? ""
      }
    });
  }
}

export async function getPersonDetail(personId: string): Promise<ApolloPersonDetail | null> {
  const id = String(personId ?? "").trim();
  if (!id) {
    return null;
  }

  try {
    return await apolloRequest<ApolloPersonDetail>(`/api/v1/people/${encodeURIComponent(id)}`, {
      method: "GET"
    });
  } catch (error) {
    if (error instanceof ApolloApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}
