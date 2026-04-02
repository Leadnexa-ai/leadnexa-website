"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

type LeadSearchFormState = {
  companyName: string;
  companyWebsite: string;
  productDescription: string;
  targetMarkets: string;
  exclusions: string;
};

type PreviewLead = {
  full_name: string | null;
  title: string | null;
  company_name: string | null;
  linkedin_url: string | null;
  location_label: string | null;
};

type RunResponse = {
  quota: {
    used_today: number;
    limit: number | null;
    remaining: number | null;
  };
  applied_filters: {
    person_titles?: string[];
    person_locations?: string[];
    organization_num_employees_ranges?: string[];
    q_keywords?: string;
  };
  preview: PreviewLead[];
  snapshot_message: {
    headline: string;
    detail: string;
  };
  cta: {
    label: string;
    href: string;
  };
};

type QuotaInfo = {
  used_today: number;
  limit: number | null;
  remaining: number | null;
};

const INITIAL_FORM: LeadSearchFormState = {
  companyName: "",
  companyWebsite: "",
  productDescription: "",
  targetMarkets: "",
  exclusions: ""
};

function parseMultiValueInput(value: string): string[] {
  return value
    .split(/[,\n]/g)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 10);
}

export default function LeadSearchClient({ isPendingSession }: { isPendingSession: boolean }) {
  const [form, setForm] = useState<LeadSearchFormState>(INITIAL_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [quota, setQuota] = useState<QuotaInfo | null>(null);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const response = await fetch("/api/lead-search/quota");
        if (response.ok) {
          const data = (await response.json()) as QuotaInfo;
          setQuota(data);
        }
      } catch {
        // Silently fail - quota will show default message
      }
    };

    fetchQuota();
  }, []);

  const usedQuotaText = useMemo(() => {
    const currentQuota = result?.quota ?? quota;
    if (!currentQuota) {
      return "Daily usage limit: 3 snapshots";
    }
    if (currentQuota.limit === null) {
      return `Daily usage: ${currentQuota.used_today} (unlimited for this account)`;
    }
    return `Daily usage: ${currentQuota.used_today}/${currentQuota.limit} (remaining ${currentQuota.remaining})`;
  }, [result, quota]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading || isPendingSession) {
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await fetch("/api/lead-search/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_name: form.companyName,
          company_website: form.companyWebsite,
          product_description: form.productDescription,
          target_markets: parseMultiValueInput(form.targetMarkets),
          exclusions: parseMultiValueInput(form.exclusions)
        })
      });
      const payload = (await response.json().catch(() => ({}))) as Partial<RunResponse> & {
        error?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to generate snapshot.");
      }
      setResult(payload as RunResponse);
      setQuota(payload.quota);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Failed to generate snapshot.";
      setError(message);
      
      // Keep previous result if daily limit reached, only clear for other errors
      const isDailyLimitError = message.includes("Daily limit reached");
      if (!isDailyLimitError) {
        setResult(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.2),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.18),transparent_40%),linear-gradient(180deg,#020617_0%,#0b1120_45%,#111827_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal">Sales Snapshot</p>
            <h1 className="mt-2 text-4xl font-bold">Target Market Snapshot</h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              Validate reachable market with AI-generated searches based on your inputs and a controlled preview. This is not a lead
              database.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/profile"
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10"
            >
              Profile
            </Link>
            <Link
              href="/talk-to-our-team"
              className="rounded-full bg-teal px-4 py-2 text-sm font-bold text-ink transition hover:opacity-90"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>

        {isPendingSession && (
          <div className="mb-6 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-sm text-amber-100">
            Your account is not fully activated yet. Complete activation before generating snapshots.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <form
            onSubmit={onSubmit}
            className="rounded-3xl border border-white/15 bg-slate-900/60 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.5)] backdrop-blur-md"
          >
            <h2 className="text-xl font-semibold">AI Questionnaire</h2>
            <p className="mt-1 text-sm text-slate-300">Share your company context. AI will generate targeting filters for you.</p>

            <label className="mt-5 block text-sm font-medium text-slate-200">Company name</label>
            <input
              required
              value={form.companyName}
              onChange={(event) => setForm((prev) => ({ ...prev, companyName: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-teal/50"
              placeholder="e.g. LeadNexa"
              disabled={isPendingSession || isLoading}
            />

            <label className="mt-4 block text-sm font-medium text-slate-200">Company website</label>
            <input
              value={form.companyWebsite}
              onChange={(event) => setForm((prev) => ({ ...prev, companyWebsite: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-teal/50"
              placeholder="https://yourcompany.com"
              disabled={isPendingSession || isLoading}
            />

            <label className="mt-4 block text-sm font-medium text-slate-200">What do you sell? (one short paragraph)</label>
            <textarea
              required
              value={form.productDescription}
              onChange={(event) => setForm((prev) => ({ ...prev, productDescription: event.target.value }))}
              className="mt-2 h-20 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-teal/50"
              placeholder="e.g. We help B2B companies automate outbound and book qualified meetings."
              disabled={isPendingSession || isLoading}
            />

            <label className="mt-4 block text-sm font-medium text-slate-200">Target market hints (optional)</label>
            <textarea
              value={form.targetMarkets}
              onChange={(event) => setForm((prev) => ({ ...prev, targetMarkets: event.target.value }))}
              className="mt-2 h-20 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-teal/50"
              placeholder="North America, B2B SaaS, Seed to Series B"
              disabled={isPendingSession || isLoading}
            />

            <label className="mt-4 block text-sm font-medium text-slate-200">Exclusions (optional)</label>
            <textarea
              value={form.exclusions}
              onChange={(event) => setForm((prev) => ({ ...prev, exclusions: event.target.value }))}
              className="mt-2 h-20 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none focus:border-teal/50"
              placeholder="agency, freelancer"
              disabled={isPendingSession || isLoading}
            />

            <p className="mt-4 text-xs text-slate-400">{usedQuotaText}</p>
            {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

            <button
              type="submit"
              disabled={isPendingSession || isLoading}
              className="mt-5 w-full rounded-xl bg-teal px-5 py-3 text-sm font-bold text-ink transition hover:opacity-90 disabled:opacity-60"
            >
              {isLoading ? "Generating snapshot..." : "Generate Snapshot"}
            </button>
          </form>

          <section className="rounded-3xl border border-white/15 bg-slate-900/60 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.5)] backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Search Result Preview</h2>
              <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-100">
                Preview only - export disabled
              </span>
            </div>

            {!result && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/40 p-6 text-sm text-slate-300">
                Submit the questionnaire to generate up to 20 preview results.
              </div>
            )}

            {result && (
              <>
                <div className="mt-5 overflow-hidden rounded-2xl border border-white/10">
                  <table className="min-w-full divide-y divide-white/10 text-sm">
                    <thead className="bg-white/5">
                      <tr className="text-left text-xs uppercase tracking-[0.15em] text-slate-300">
                        <th className="px-3 py-3">Name</th>
                        <th className="px-3 py-3">Title</th>
                        <th className="px-3 py-3">Company</th>
                        <th className="px-3 py-3">Location</th>
                        <th className="px-3 py-3">LinkedIn</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {result.preview.length === 0 && (
                        <tr>
                          <td className="px-3 py-4 text-slate-300" colSpan={5}>
                            No matching leads found for this snapshot. Try broadening your inputs.
                          </td>
                        </tr>
                      )}
                      {result.preview.map((lead, index) => (
                        <tr key={`${lead.full_name ?? "row"}-${index}`} className="align-top">
                          <td className="px-3 py-3 text-white">{lead.full_name ?? "-"}</td>
                          <td className="px-3 py-3 text-slate-200">{lead.title ?? "-"}</td>
                          <td className="px-3 py-3 text-slate-200">{lead.company_name ?? "-"}</td>
                          <td className="px-3 py-3 text-slate-300">{lead.location_label ?? "-"}</td>
                          <td className="px-3 py-3">
                            {lead.linkedin_url ? (
                              <a
                                href={lead.linkedin_url}
                                target="_blank"
                                rel="noreferrer"
                                className="font-semibold text-teal hover:underline"
                              >
                                Open Profile
                              </a>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 rounded-2xl border border-teal/30 bg-teal/10 p-4">
                  <p className="text-sm font-semibold text-white">{result.snapshot_message.headline}</p>
                  <p className="mt-2 text-sm text-slate-200">{result.snapshot_message.detail}</p>
                </div>

                <Link
                  href={result.cta.href}
                  className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-teal px-4 py-3 text-sm font-bold text-ink transition hover:opacity-90"
                >
                  {result.cta.label}
                </Link>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
