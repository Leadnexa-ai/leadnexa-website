import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";

export default function ItServicesCaseStudyPage() {
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
            <Link href="/#solutions" className="hover:text-teal transition-colors">
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
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-teal mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to homepage
        </Link>

        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
          IT Services - Filling a Thin Pipeline With AI Agents
        </h1>
        <p className="text-white/50 mb-8">
          How a services provider with long sales cycles used Leadnexa AI Agents to build a healthier top of
          funnel and create more meetings with mid-market prospects.
        </p>

        <div className="glass-panel rounded-3xl p-8 border-white/10 mb-10 grid md:grid-cols-3 gap-6 text-sm text-white/70">
          <div>
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-1">Company Type</p>
            <p>IT services and integration</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-1">Target Market</p>
            <p>Mid-market and enterprise buyers</p>
          </div>
          <div>
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-1">Outcome (90 days)</p>
            <p>2.5x more qualified meetings vs. previous outbound efforts</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-white mb-4">Challenges</h2>
        <ul className="space-y-3 text-sm text-white/70 mb-8">
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Sales team focused on existing projects and renewals, leaving little time for prospecting.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Manual list building across multiple tools created a fragmented and outdated view of target accounts.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Outreach cadence was inconsistent, so pipeline fluctuated from quarter to quarter.</span>
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">How Leadnexa Helped</h2>
        <ul className="space-y-3 text-sm text-white/70 mb-8">
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>AI Agents continuously refreshed and prioritized target account lists based on fit and activity.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Launched email and LinkedIn sequences tailored to technical and business stakeholders.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Handled replies and basic qualification, surfacing only serious opportunities to the sales team.</span>
          </li>
        </ul>

        <h2 className="text-2xl font-semibold text-white mb-4">Results</h2>
        <ul className="space-y-3 text-sm text-white/70 mb-8">
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>2.5x increase in qualified meetings with mid-market prospects in the first 90 days.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>More predictable pipeline entering the top of the funnel each month.</span>
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4 text-teal mt-0.5" />
            <span>Sales team spent more time on discovery, proposals and closing instead of prospecting.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
