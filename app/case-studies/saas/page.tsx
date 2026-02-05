import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

export default function SaasCaseStudyPage() {
  return (
    <div className="min-h-screen page-shell">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white">
            <div className="bg-teal p-1.5 rounded-lg" />
            Leadnexa.Ai
          </Link>
          <nav className="hidden items-center gap-10 text-sm font-medium text-white/60 md:flex">
            <Link href="/#how" className="hover:text-teal transition-colors">
              How it works
            </Link>
            <Link href="/#case-studies" className="hover:text-teal transition-colors">
              Case Studies
            </Link>
            <Link href="/#comparison" className="hover:text-teal transition-colors">
              Why AI Agents
            </Link>
            <Link href="/#pricing" className="hover:text-teal transition-colors">
              Pricing
            </Link>
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Link
          href="/#case-studies"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-teal mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to case studies
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
          B2B SaaS - From Founder-Led Sales to Scalable Outbound
        </h1>
        <p className="text-white/50 mb-8">
          How an early-stage SaaS company used Leadnexa AI Agents to take outbound off the founder's plate and
          generate a predictable flow of qualified demos.
        </p>

        <div className="glass-panel rounded-3xl p-8 border-white/10 mb-10 grid md:grid-cols-3 gap-6 text-sm text-white/70">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-1">Company Type</p>
            <p>Early-stage B2B SaaS (Series A)</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-1">Sales Model</p>
            <p>Founder-led sales with 1 AE</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-1">Outcome (90 days)</p>
            <p>+38 qualified demos, more time for closing and product</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-white mb-4">Challenges</h2>
        <ul className="space-y-3 text-sm text-white/70 mb-8">
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Founder splitting time between product, fundraising and manually sending outbound campaigns.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>No internal SDR team and limited budget to hire and ramp new reps.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Inconsistent meeting volume from month to month, making revenue forecasting difficult.</span>
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">How Leadnexa Helped</h2>
        <ul className="space-y-3 text-sm text-white/70 mb-8">
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Configured AI Agents to own lead research, list building and enrichment for the core ICP.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Launched multi-variant Cold Email and LinkedIn sequences based on the founder's best-performing scripts.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>AI Agents handled replies, basic qualification and follow-ups, only handing off when a meeting was ready to be booked.</span>
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">Results</h2>
        <ul className="space-y-3 text-sm text-white/70 mb-8">
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>38 qualified demos booked in the first 90 days.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Outbound meeting volume became predictable week over week.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>The founder reclaimed time to focus on product, hiring and closing larger opportunities.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
