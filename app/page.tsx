"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  Mail,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap
} from "lucide-react";

const valueProps = [
  {
    title: "No hiring",
    description: "Replace SDR teams without payroll or turnover.",
    icon: Users
  },
  {
    title: "Predictable capacity",
    description: "Outbound runs every day, consistently.",
    icon: TrendingUp
  },
  {
    title: "Scales cleanly",
    description: "Add 5, 10, or 100 AI Sales Executives as needed.",
    icon: Zap
  },
  {
    title: "B2B-native",
    description: "Built for email + LinkedIn decision-makers.",
    icon: ShieldCheck
  }
];

const steps = [
  {
    title: "30-Minute Kickoff Call",
    description:
      "We align on your business, ideal customer profile, value proposition, and what qualifies as a lead, then build prospect lists."
  },
  {
    title: "Deploy AI Sales Executives",
    description: "Daily cold email + LinkedIn outreach done by AI automatically."
  },
  {
    title: "Book Meetings",
    description: "Qualified prospects booked into your calendar."
  },
  {
    title: "Scale on Demand",
    description: "Add more executives, no ramp-up."
  }
];

const audiences = [
  "B2B SaaS",
  "SaaS Resellers",
  "Recruiting / Staffing",
  "Agencies",
  "Professional Services"
];

const motionProps = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
  viewport: { once: true, amount: 0.2 }
};

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0
});

const pricingServices = [
  "5 AI Sales Executives",
  "2,000 cold emails daily",
  "Daily LinkedIn outreach",
  "Custom ICP + offer messaging",
  "Qualified meetings booked to your calendar",
  "Weekly performance insights",
  "Dedicated success manager"
];

const comparisonRows = [
  {
    label: "Monthly Cost",
    ai: "$3,500 / month",
    human: "$4,000-$7,000+ / month"
  },
  {
    label: "Ramp-Up Time",
    ai: "Immediate",
    human: "1-3 months"
  },
  {
    label: "Hiring Risk",
    ai: "None",
    human: "High (recruiting, churn)"
  },
  {
    label: "Consistency",
    ai: "Always-on, predictable",
    human: "Varies by individual"
  },
  {
    label: "Scalability",
    ai: "Instantly add 5-100+",
    human: "Slow, linear hiring"
  },
  {
    label: "Availability",
    ai: "24/7 outbound execution",
    human: "Limited working hours"
  },
  {
    label: "Turnover",
    ai: "Never quits",
    human: "High SDR attrition"
  },
  {
    label: "Management Overhead",
    ai: "Minimal",
    human: "High (training, coaching)"
  },
  {
    label: "Channel Focus",
    ai: "Cold email + LinkedIn",
    human: "Often multi-tasked"
  },
  {
    label: "Cost per Meeting",
    ai: "Low & predictable",
    human: "High & variable"
  }
];

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const pricePerSeat = 700;
  const baseQuantity = 5;
  const baseTotal = pricePerSeat * baseQuantity;

  const handleCheckout = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout_sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: baseQuantity })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error ?? "Checkout failed.");
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-shell">
      <div className="relative z-10">
        <div className="pointer-events-none absolute -top-48 right-10 h-[28rem] w-[28rem] rounded-full bg-electric/20 blur-[160px]" />
        <div className="pointer-events-none absolute top-32 -left-32 h-80 w-80 rounded-full bg-teal/20 blur-[140px]" />

        <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/70 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
              <Sparkles className="h-5 w-5 text-teal" />
              Leadnexa.Ai
            </div>
            <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
              <a href="#how" className="hover:text-white">
                How it Works
              </a>
              <a href="#pricing" className="hover:text-white">
                Pricing
              </a>
              <a href="#faq" className="hover:text-white">
                FAQ
              </a>
            </nav>
            <a
              href="#pricing"
              className="rounded-full bg-teal px-6 py-2.5 text-sm font-semibold text-ink shadow-glow transition hover:-translate-y-0.5"
            >
              Start Scaling
            </a>
          </div>
        </header>

        <main>
          <motion.section
            {...motionProps}
            className="mx-auto grid max-w-7xl items-center gap-16 px-6 pb-28 pt-20 lg:grid-cols-[1.05fr_0.95fr]"
          >
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs uppercase tracking-[0.4em] text-white/60">
                B2B Outbound Infrastructure
              </div>
              <h1 className="text-5xl font-semibold leading-[1.05] tracking-tight text-white md:text-6xl lg:text-7xl">
                Scalable Cold Email + LinkedIn Outreach That Books B2B Meetings
              </h1>
              <p className="mt-6 max-w-xl text-lg text-white/70 md:text-xl">
                We build prospect lists, then deploy AI Sales Executives to run daily cold email
                campaigns and LinkedIn outreach that book qualified B2B meetings directly into your
                calendar.
              </p>
              <div className="mt-10 flex flex-wrap gap-5">
                <a
                  href="#pricing"
                  className="inline-flex items-center gap-2 rounded-full bg-electric px-7 py-3.5 text-sm font-semibold text-ink shadow-glow transition hover:-translate-y-0.5"
                >
                  View Pricing
                  <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#how"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-7 py-3.5 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
                >
                  How It Works
                </a>
              </div>
            </div>

            <div className="glass-panel-strong rounded-[28px] p-8 shadow-soft">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                <span>Pipeline Overview</span>
                <span className="rounded-full bg-teal/20 px-3 py-1 text-teal">Live</span>
              </div>
              <div className="mt-8 grid gap-5">
                <div className="glass-panel rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">Prospects Contacted</p>
                    <span className="text-xl font-semibold text-white">2,438</span>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[72%] rounded-full bg-teal" />
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">Emails Sent</p>
                    <span className="text-xl font-semibold text-white">10k+</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <Mail className="h-4 w-4 text-electric" />
                    Cold emails sent daily
                  </div>
                </div>
                <div className="glass-panel rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-white/70">Meetings Booked</p>
                    <span className="text-xl font-semibold text-white">86</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
                    <CalendarCheck className="h-4 w-4 text-electric" />
                    Calendar filling daily
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            {...motionProps}
            className="mx-auto max-w-7xl px-6 py-24"
            id="why"
          >
            <div className="mb-12 flex items-center justify-between">
              <h2 className="text-4xl font-semibold tracking-tight">Why Companies Use Us</h2>
              <span className="hidden text-sm uppercase tracking-[0.3em] text-white/40 md:block">
                Value Proposition
              </span>
            </div>
            <div className="grid gap-8 md:grid-cols-2">
              {valueProps.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="glass-panel rounded-3xl p-8 transition hover:border-white/25"
                  >
                    <Icon className="h-6 w-6 text-teal" />
                    <h3 className="mt-4 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-2 text-sm text-white/70">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            {...motionProps}
            className="mx-auto max-w-7xl px-6 py-24"
            id="how"
          >
            <div className="mb-12">
              <h2 className="text-4xl font-semibold tracking-tight">How It Works</h2>
              <p className="mt-4 max-w-2xl text-white/70">
                A clear, repeatable process that turns cold email + LinkedIn into a dependable meeting
                engine.
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-4">
              {steps.map((step, index) => (
                <div
                  key={step.title}
                  className="glass-panel rounded-3xl p-7"
                >
                  <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Step {index + 1}
                  </div>
                  <h3 className="mt-3 text-lg font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-white/70">{step.description}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            {...motionProps}
            className="mx-auto max-w-7xl px-6 py-24"
            id="audience"
          >
            <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="text-4xl font-semibold tracking-tight">Who This Is For</h2>
                <p className="mt-4 text-white/70">
                  Revenue teams that already know their ICP and want consistent outbound volume.
                </p>
                <p className="mt-8 text-sm text-white/50">
                  Not for early-stage startups, solopreneurs, or low-ticket offers.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                {audiences.map((audience) => (
                  <div
                    key={audience}
                    className="glass-panel flex items-center gap-3 rounded-3xl p-5"
                  >
                    <Check className="h-5 w-5 text-teal" />
                    <span className="text-sm font-medium">{audience}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            {...motionProps}
            className="mx-auto max-w-7xl px-6 py-24"
            id="comparison"
          >
            <div className="glass-panel-strong rounded-[32px] p-10">
              <div className="max-w-3xl">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Comparison
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-white">
                  AI Sales Executive vs. Traditional Human SDR
                </h2>
                <p className="mt-4 text-white/70">
                  The modern way to scale B2B outbound, with predictable cost and always-on
                  execution.
                </p>
              </div>

              <div className="mt-10 grid gap-4 md:hidden">
                {comparisonRows.map((row) => (
                  <div
                    key={row.label}
                    className="glass-panel rounded-2xl border border-white/10 p-5"
                  >
                    <div className="text-xs uppercase tracking-[0.3em] text-white/50">
                      {row.label}
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-white/70">
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">AI Sales Executive</span>
                        <span className="font-semibold text-white">{row.ai}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/60">Human SDR</span>
                        <span>{row.human}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 hidden overflow-hidden rounded-3xl border border-white/10 md:block">
                <div className="grid grid-cols-[1.2fr_1fr_1fr] bg-white/5 text-sm font-semibold text-white">
                  <div className="px-6 py-4 text-white/60">Category</div>
                  <div className="px-6 py-4">AI Sales Executive</div>
                  <div className="px-6 py-4">Human SDR</div>
                </div>
                <div className="divide-y divide-white/10 text-sm text-white/70">
                  {comparisonRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-[1.2fr_1fr_1fr] bg-transparent"
                    >
                      <div className="px-6 py-4 font-medium text-white">{row.label}</div>
                      <div className="px-6 py-4">{row.ai}</div>
                      <div className="px-6 py-4 text-white/60">{row.human}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            {...motionProps}
            className="mx-auto max-w-7xl px-6 py-24"
            id="pricing"
          >
            <div className="grid items-start gap-12 lg:justify-items-center">
              <div className="max-w-2xl text-center">
                <h2 className="text-4xl font-semibold tracking-tight">Pricing</h2>
                <p className="mt-4 text-white/70">
                  Start with a minimum of 5 AI Sales Executives. Scale up any time.
                </p>
              </div>
              <div className="glass-panel relative h-fit max-w-xl rounded-[36px] border border-teal/40 p-10 shadow-glow">
                <div className="absolute -top-4 left-10 rounded-full bg-teal px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-ink">
                  Most Popular
                </div>
                <div className="flex items-center gap-3 text-white/80">
                  <ShieldCheck className="h-6 w-6 text-teal" />
                  <span className="text-lg font-semibold">Standard</span>
                </div>
                <p className="mt-2 text-sm text-white/60">For scaling outbound teams.</p>
                <div className="mt-8 flex items-end gap-3">
                  <span className="text-5xl font-semibold text-white">
                    {currency.format(baseTotal)}
                  </span>
                  <span className="pb-1 text-sm text-white/60">/month</span>
                </div>
                <ul className="mt-8 space-y-4 text-sm text-white/70">
                  {pricingServices.map((service) => (
                    <li key={service} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-4 w-4 text-teal" />
                      <span className="leading-relaxed">{service}</span>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="mt-10 w-full rounded-full bg-teal px-7 py-3.5 text-sm font-semibold text-ink shadow-glow transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Redirecting..." : "Start Free Trial"}
                </button>
              </div>
              <div className="glass-panel max-w-xl rounded-3xl border border-white/10 px-6 py-4 text-center text-sm text-white/70">
                14-day free trial. Cancel anytime. No long-term contracts.
              </div>
            </div>
          </motion.section>

        </main>

        <footer className="border-t border-white/10 bg-ink/80">
          <div className="mx-auto flex max-w-7xl flex-col gap-6 px-6 py-12 text-sm text-white/60 md:flex-row md:items-center md:justify-between">
            <p>
              © 2026 Leadnexa.Ai. All rights reserved. Leadnexa.Ai Inc.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#" className="hover:text-white">
                LinkedIn
              </a>
              <a href="/privacy" className="hover:text-white">
                Privacy
              </a>
              <a href="/terms" className="hover:text-white">
                Terms
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

