import { ArrowRight, CircleHelp, Sparkles, Target } from "lucide-react";
import Image from "next/image";

const calEmbedUrl = process.env.NEXT_PUBLIC_CAL_EMBED_URL;
const showIntegrations = process.env.NEXT_PUBLIC_SHOW_INTEGRATIONS === "true";

export default function TalkToOurTeamPage() {
  const hasCalUrl = Boolean(calEmbedUrl);
  const iframeSrc = hasCalUrl
    ? `${calEmbedUrl}${calEmbedUrl?.includes("?") ? "&" : "?"}embed=true&theme=light`
    : "";

  return (
    <main className="min-h-screen page-shell">
      <div className="relative z-10">
        <div className="pointer-events-none absolute -top-48 right-10 h-[40rem] w-[40rem] rounded-full bg-electric/10 blur-[180px]" />
        <div className="pointer-events-none absolute top-32 -left-32 h-96 w-96 rounded-full bg-teal/10 blur-[160px]" />

        <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <a
              href="/"
              className="flex items-center transition-opacity hover:opacity-90"
            >
              <Image src="/logo.png" alt="LeadNexa logo" width={170} height={40} className="h-8 w-auto" priority />
            </a>
            <nav className="hidden items-center gap-10 text-sm font-medium text-white/60 md:flex">
              <a href="/#how" className="hover:text-teal transition-colors">
                How it works
              </a>
              <a href="/#case-studies" className="hover:text-teal transition-colors">
                Case Studies
              </a>
              <a href="/#comparison" className="hover:text-teal transition-colors">
                Why AI Agents
              </a>
              {showIntegrations && (
                <a href="/#integrations" className="hover:text-teal transition-colors">
                  Integrations
                </a>
              )}
              <a href="/#pricing" className="hover:text-teal transition-colors">
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <a
                href="/talk-to-our-team"
                className="rounded-full bg-teal px-6 py-2.5 text-sm font-bold text-ink shadow-glow transition hover:-translate-y-0.5"
              >
                Talk to Our Team
              </a>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 md:pt-20">
          <div className="mb-10 text-center">
            <p className="mb-4 text-xs font-bold tracking-[0.32em] text-teal">BOOK A CALL</p>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-6xl">Talk to Our Team</h1>
            <p className="mx-auto mt-4 max-w-3xl text-base text-white/60 md:text-lg">
              Pick a time that works for you. We will review your goals, audit your current outbound, and suggest a
              practical next step.
            </p>
          </div>

          <div className="glass-panel rounded-[28px] border-white/10 p-4 shadow-2xl md:p-6">
            {hasCalUrl ? (
              <iframe
                src={iframeSrc}
                title="Cal.com booking"
                className="h-[780px] w-full rounded-2xl border border-white/10 bg-white"
                loading="lazy"
                allow="camera; microphone; fullscreen; payment"
              />
            ) : (
              <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 text-amber-100">
                <p className="mb-2 font-semibold">Cal.com is not configured yet.</p>
                <p className="text-sm">
                  Add <code>NEXT_PUBLIC_CAL_EMBED_URL</code> in your environment variables, then reload the app.
                </p>
                <p className="mt-2 text-sm">
                  Example: <code>NEXT_PUBLIC_CAL_EMBED_URL=https://cal.com/your-username/intro-call</code>
                </p>
              </div>
            )}
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="glass-panel rounded-2xl border-white/10 p-6">
              <div className="mb-4 inline-flex rounded-xl bg-teal/15 p-3 text-teal">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">Personalized Strategy</h3>
              <p className="mt-2 text-white/60">
                Get a quick outbound plan tailored to your ICP, motion, and current pipeline stage.
              </p>
            </div>

            <div className="glass-panel rounded-2xl border-white/10 p-6">
              <div className="mb-4 inline-flex rounded-xl bg-electric/15 p-3 text-electric">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">End-to-End Walkthrough</h3>
              <p className="mt-2 text-white/60">
                We will walk through the full process from ICP setup to outreach execution and qualified meeting handoff.
              </p>
            </div>

            <div className="glass-panel rounded-2xl border-white/10 p-6">
              <div className="mb-4 inline-flex rounded-xl bg-emerald-500/15 p-3 text-emerald-300">
                <CircleHelp className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold text-white">Questions Answered</h3>
              <p className="mt-2 text-white/60">
                Bring any concerns about deliverability, targeting, pricing, or rollout and we will address them clearly.
              </p>
            </div>
          </div>

          <div className="glass-panel mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border-white/10 px-6 py-5 text-center md:flex-row md:text-left">
            <p className="text-white/70">
              Prefer to review details first? Explore how similar teams scaled meetings with AI outbound.
            </p>
            <a
              href="/case-studies/saas"
              className="inline-flex items-center gap-2 rounded-full bg-teal px-5 py-2.5 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
            >
              View Case Study
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
