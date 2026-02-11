"use client";

import { useEffect, useRef, useState } from "react";
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
  Zap,
  Globe,
  BarChart3,
  MessageSquare,
  Lock,
  Brain,
  Bot,
  Activity,
  ChevronDown,
  Star
} from "lucide-react";

// --- Data Definitions ---

const valueProps = [
  {
    title: "Zero Hiring Needed",
    description:
      "Replace high-cost SDR teams without the overhead of salaries, benefits, or turnover.",
    icon: Users,
    size: "col-span-1 md:col-span-1"
  },
  {
    title: "Predictable Lead Flow",
    description:
      "Our AI agents work 24/7 to ensure your sales pipeline is always filled with high-quality leads.",
    icon: TrendingUp,
    size: "col-span-1 md:col-span-1"
  },
  {
    title: "Infinite Scalability",
    description:
      "Scale from 5 to 100+ AI sales reps instantly based on your business demand.",
    icon: Zap,
    size: "col-span-1 md:col-span-1"
  },
  {
    title: "B2B Native Intelligence",
    description:
      "Built for Email + LinkedIn decision-makers, understanding the nuances of professional outreach.",
    icon: ShieldCheck,
    size: "col-span-1 md:col-span-1"
  }
];

const steps = [
  {
    title: "Strategic Onboarding",
    description:
      "We deep-dive into your business to define your Ideal Customer Profile (ICP) and craft highly-personalized multi-channel strategies."
  },
  {
    title: "Infrastructure Setup",
    description:
      "We set up dedicated sending domains, perform professional email warming, and synchronize LinkedIn profiles to ensure maximum deliverability and safety."
  },
  {
    title: "AI-Powered Outreach",
    description:
      "Our AI agents launch hyper-personalized campaigns, adapting messaging in real-time based on prospect behavior and intent signals."
  },
  {
    title: "Qualified Lead Delivery",
    description:
      "High-intent leads are filtered by AI and synced to your existing workflow (CRM/Slack) instantly."
  }
];

// const pricingServices = [
//   "1 established LinkedIn account per AI sales agent",
//   "Email & LinkedIn outreach done for you",
//   "Unlimited email campaigns",
//   "High-volume cold email delivery",
//   "Thousands of follow-up messages",
//   "Custom ICP & messaging strategy",
//   "Qualified lead list built",
//   "1-on-1 onboarding & support",
//   "Weekly performance insights",
//   "Dedicated Success Manager"
// ];

const pricingServices = [
  "1 established LinkedIn account per AI sales agent",
  "2 dedicated email inboxes per AI sales agent",

  "Email & LinkedIn outreach with team handoff",
  "Flexible outbound campaign setup",
  "Automated follow-up sequences",
  "Scalable cold email delivery",
  "Designed for ~1,000 emails per agent per month when fully warmed",

  "Custom ICP & messaging strategy",
  "Qualified lead list built based on your ICP",

  "Weekly performance insights",
  "1-on-1 onboarding & support",
  "Dedicated Success Manager"
];



const comparison = {
  traditional: [
    "Salary, bonuses, benefits & tooling for each SDR",
    "3-6 months ramp time before full productivity",
    "Works 8 hours a day, Monday to Friday",
    "High turnover, constant hiring & training",
    "Manual list building and copywriting"
  ],
  ai: [
    "Pay per AI Agent seat with predictable pricing",
    "Deploy in days with battle-tested playbooks",
    "Runs 24/7 across time zones without burnout",
    "Performance improves with every campaign",
    "Automated research, personalization & follow-ups"
  ]
};

const comparisonRows = [
  { label: "Monthly cost", traditional: "$6k-$9k per SDR", ai: "From $3.5k for 5 AI seats" },
  { label: "Time to productivity", traditional: "60-90 days", ai: "4-14 days" },
  { label: "Working hours", traditional: "40 hrs/week", ai: "168 hrs/week" },
  { label: "Daily outreach", traditional: "40-60 contacts", ai: "300-500 contacts" },
  { label: "Management time", traditional: "5-10 hrs/week", ai: "Near-zero" },
  { label: "Consistency", traditional: "Varies by rep", ai: "Consistent, tracked" }
];

const stepTimeline = ["Day 1", "Days 2-3", "Day 4+", "Daily / Ongoing"];

const agentCapabilities = [
  {
    title: "Lead Research & ICP Targeting",
    description:
      "Agents identify and prioritize accounts that fit your ICP across industry, size, tech stack and signals.",
    icon: Globe
  },
  {
    title: "Cold Email & LinkedIn Copywriting",
    description:
      "Multi-variant messaging tested across segments to steadily increase open, reply and booked-call rates.",
    icon: Mail
  },
  {
    title: "Intent Detection & Qualification",
    description:
      "AI understands objections, buying signals and qualification criteria, not just simple keywords.",
    icon: Brain
  },
  {
    title: "Automated Follow-Up & Handoff",
    description:
      "Agents run structured follow-up sequences and push qualified meetings straight into your calendar.",
    icon: CalendarCheck
  }
];

const testimonials = [
  {
    quote:
      "Leadnexa's AI Agents replaced what used to be an entire SDR pod. In the first 90 days we added over 40 qualified demos to our pipeline.",
    name: "Growth Lead",
    detail: "B2B SaaS, Series A  -  North America",
    initials: "GL"
  },
  {
    quote:
      "We cut outbound tooling costs by ~30% while increasing meetings by 2.3x. The team now spends time on closing, not chasing replies.",
    name: "VP Sales",
    detail: "IT Services, Mid-market  -  Global",
    initials: "VS"
  },
  {
    quote:
      "The AI Agent understands our value prop better than most new hires. Ramp time went from months to days.",
    name: "Founder",
    detail: "Marketing Agency, 10-50 employees",
    initials: "FA"
  }
];

const motionProps = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
  viewport: { once: true, amount: 0.2 }
};

// --- Components ---

const TrustedLogos = () => (
  <div className="py-16 border-y border-white/5 bg-white/[0.02] overflow-hidden">
    <p className="text-center text-xs uppercase tracking-[0.4em] text-white/30 mb-10 font-medium">
      Trusted by Modern B2B Revenue Teams
    </p>
    <div className="flex w-max">
      <div className="flex animate-marquee space-x-16 items-center px-8">
        {["B2B SAAS", "REVOPS CLOUD", "PIPELINE LABS", "NEXUS DATA", "GLOBAL SYSTEMS", "GROWTHFUEL", "QUANTUM"]
          .map((logo) => (
            <span
              key={logo}
              className="text-2xl font-bold text-white/20 hover:text-white/40 transition-colors cursor-default"
            >
              {logo}
            </span>
          ))}
      </div>
      <div className="flex animate-marquee space-x-16 items-center px-8">
        {["B2B SAAS", "REVOPS CLOUD", "PIPELINE LABS", "NEXUS DATA", "GLOBAL SYSTEMS", "GROWTHFUEL", "QUANTUM"]
          .map((logo) => (
            <span
              key={logo + "_clone"}
              className="text-2xl font-bold text-white/20 hover:text-white/40 transition-colors cursor-default"
            >
              {logo}
            </span>
          ))}
      </div>
    </div>
  </div>
);

const UIMockup = () => (
  <div className="relative space-y-6">
    {/* Main campaign performance card */}
    <div className="relative group">
      <div className="absolute -inset-1 bg-gradient-to-r from-teal to-electric rounded-[32px] blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
      <div className="relative glass-panel-strong rounded-[28px] p-2 shadow-2xl overflow-hidden border-white/10">
        <div className="bg-ink/50 rounded-[22px] p-6 border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
              </div>
              <div className="ml-4 h-6 w-32 bg-white/5 rounded-full flex items-center px-3 text-[10px] text-white/40">
                AI Sales Executives
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-[10px] text-teal flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal"></span>
              </span>
              LIVE CAMPAIGN
            </div>
          </div>

          <div className="space-y-4">
            <div className="glass-panel p-4 rounded-xl border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-electric/20 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-electric" />
                </div>
                <div>
                  <div className="text-xs text-white/40 mb-1">Cold Emails Today</div>
                  <div className="text-xs text-white/30">Multi-variant sequence  -  ICP: SaaS</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-white">1,240</div>
                <div className="text-[10px] text-white/40">SENT</div>
              </div>
            </div>

            <div className="glass-panel p-4 rounded-xl border-teal/20 bg-teal/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-teal" />
                </div>
                <div>
                  <div className="text-xs text-white/80 mb-1">Positive Replies</div>
                  <div className="text-[11px] text-white/60">"Sounds interesting"  -  "Let's talk"  -  "Send more details"</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-teal">24%</div>
                <div className="text-[10px] text-teal/60">REPLY RATE</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="glass-panel p-4 rounded-xl border-white/5 text-center">
                <div className="text-xs text-white/40 mb-1">BOOKED THIS WEEK</div>
                <div className="text-xl font-bold text-white">42</div>
              </div>
              <div className="glass-panel p-4 rounded-xl border-white/5 text-center">
                <div className="text-xs text-white/40 mb-1">NEW PIPELINE</div>
                <div className="text-xl font-bold text-electric">$120k</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Agent avatars + conversation mock */}
    <div className="glass-panel rounded-3xl border-white/10 bg-ink/60 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-white/[0.03]">
        <div className="flex items-center gap-2 text-xs text-white/40 uppercase tracking-[0.2em]">
          <Bot className="w-4 h-4 text-teal" />
          AI SALES AGENT SQUAD
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/40">
          <span className="inline-flex h-2 w-2 rounded-full bg-electric/70" />
          Running outbound across Email & LinkedIn
        </div>
      </div>
      <div className="px-5 py-4 flex items-center gap-2 border-b border-white/5">
        {["Ava", "Leo", "Mia", "Kai"].map((name) => (
          <div
            key={name}
            className="w-8 h-8 rounded-full border border-white/10 bg-gradient-to-br from-teal/30 to-electric/30 flex items-center justify-center text-[10px] font-semibold text-white"
          >
            {name}
          </div>
        ))}
        <span className="ml-2 text-[10px] text-white/40 uppercase tracking-[0.2em]">Live now</span>
      </div>
      <div className="px-5 py-5 space-y-4 text-sm text-white/70">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center text-[10px] font-bold text-teal">
            AV
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-white">Ava — AI Agent</span>
              <span className="text-[10px] text-white/40">09:41</span>
            </div>
            <div className="max-w-[520px] px-4 py-3 rounded-2xl bg-teal/10 border border-teal/30">
              LinkedIn connection accepted by Sarah Miller. Deploying personalized follow-up.
            </div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-teal/20 border border-teal/30 flex items-center justify-center text-[10px] font-bold text-teal">
            LE
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-white">Leo — AI Agent</span>
              <span className="text-[10px] text-white/40">09:48</span>
            </div>
            <div className="max-w-[520px] px-4 py-3 rounded-2xl bg-teal/10 border border-teal/30">
              Intent detected: [High Interest]. Prospect is asking about pricing and case studies.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [agentCount, setAgentCount] = useState(5);
  const showTrustedLogos = process.env.NEXT_PUBLIC_SHOW_TRUSTED_LOGOS === "true";
  const showIntegrations = process.env.NEXT_PUBLIC_SHOW_INTEGRATIONS === "true";

  const unitPrice =
    agentCount <= 4 ? 750 : agentCount <= 10 ? 700 : agentCount <= 20 ? 650 : 600;
  const monthlyTotal = agentCount * unitPrice;
  const sliderProgress = ((agentCount - 1) / 29) * 100;

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      try {
        const response = await fetch("/api/me", { method: "GET" });
        if (!isMounted) {
          return;
        }

        if (!response.ok) {
          setIsAuthenticated(false);
          setCompanyName("");
          return;
        }

        const payload = await response.json().catch(() => ({}));
        const email = typeof payload?.email === "string" ? payload.email : "";
        const fallbackFromEmail = email.includes("@") ? email.split("@")[0] : email;
        const normalizedCompanyName =
          typeof payload?.company_name === "string" && payload.company_name.trim().length > 0
            ? payload.company_name.trim()
            : fallbackFromEmail || "Account";

        setIsAuthenticated(true);
        setCompanyName(normalizedCompanyName);
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setCompanyName("");
        }
      } finally {
        if (isMounted) {
          setAuthResolved(true);
        }
      }
    };

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!isAccountMenuOpen) {
        return;
      }

      const target = event.target as Node | null;
      if (!target) {
        return;
      }

      if (accountMenuRef.current && !accountMenuRef.current.contains(target)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isAccountMenuOpen]);

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setAuthError(null);
    setIsLoggingOut(true);
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST"
      });

      if (!response.ok) {
        throw new Error("Unable to log out right now.");
      }

      setIsAuthenticated(false);
      setCompanyName("");
      setIsAccountMenuOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log out right now.";
      setAuthError(message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleCheckout = async () => {
    if (isLoading) {
      return;
    }

    setCheckoutError(null);
    setIsLoading(true);

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey
        },
        body: JSON.stringify({ agents: agentCount })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          window.location.assign("/login?next=/#pricing");
          return;
        }
        throw new Error(payload?.error ?? "Unable to start checkout session.");
      }

      const checkoutUrl = payload?.url;
      if (typeof checkoutUrl !== "string" || checkoutUrl.length === 0) {
        throw new Error("Stripe did not return a checkout URL.");
      }

      window.location.assign(checkoutUrl);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to start checkout session.";
      setCheckoutError(message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-shell">
      <div className="relative z-10">
        {/* Background Glows */}
        <div className="pointer-events-none absolute -top-48 right-10 h-[40rem] w-[40rem] rounded-full bg-electric/10 blur-[180px]" />
        <div className="pointer-events-none absolute top-32 -left-32 h-96 w-96 rounded-full bg-teal/10 blur-[160px]" />

        <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <a
              href="/"
              className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white hover:text-teal transition-colors"
            >
              <div className="bg-teal p-1.5 rounded-lg">
                <Sparkles className="h-5 w-5 text-ink" />
              </div>
              LeadNexa.ai
            </a>
            <nav className="hidden items-center gap-10 text-sm font-medium text-white/60 md:flex">
              <a href="#how" className="hover:text-teal transition-colors">
                How it works
              </a>
              <a href="#case-studies" className="hover:text-teal transition-colors">
                Case Studies
              </a>
              <a href="#comparison" className="hover:text-teal transition-colors">
                Why AI Agents
              </a>
              {showIntegrations && (
                <a href="#integrations" className="hover:text-teal transition-colors">
                  Integrations
                </a>
              )}
              <a href="#pricing" className="hover:text-teal transition-colors">
                Pricing
              </a>
            </nav>
            <div className="flex items-center gap-2 sm:gap-4">
              {authResolved &&
                (isAuthenticated ? (
                  <div className="relative" ref={accountMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsAccountMenuOpen((open) => !open)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal/40 hover:bg-white/10"
                    >
                      <span className="max-w-[140px] truncate">{companyName || "Account"}</span>
                      <ChevronDown className="h-4 w-4 text-white/70" />
                    </button>
                    {isAccountMenuOpen && (
                      <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[160px] rounded-xl border border-white/15 bg-slate-900/95 p-2 shadow-xl backdrop-blur">
                        <button
                          type="button"
                          onClick={handleLogout}
                          disabled={isLoggingOut}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
                        >
                          {isLoggingOut ? "Logging out..." : "Logout"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <a
                      href="/login?next=/#pricing"
                      className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal/40 hover:bg-white/10"
                    >
                      Login
                    </a>
                    <a
                      href="/register?next=/#pricing"
                      className="rounded-full border border-teal/40 bg-teal/10 px-4 py-2 text-sm font-semibold text-teal transition hover:bg-teal/20"
                    >
                      Register
                    </a>
                  </>
                ))}
              <a
                href="/talk-to-our-team"
                className="rounded-full bg-teal px-6 py-2.5 text-sm font-bold text-ink shadow-glow transition hover:-translate-y-0.5"
              >
                Talk to Our Team
              </a>
            </div>
          </div>
          {authError && (
            <div className="mx-auto max-w-7xl px-6 pb-3">
              <p className="text-right text-xs text-rose-300">{authError}</p>
            </div>
          )}
        </header>

        <main>
          {/* Hero Section */}
          <motion.section
            {...motionProps}
            className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-24 pt-24 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div>
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.3em] text-teal">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal"></span>
                </span>
                B2B Lead Generation with AI Sales Agents
              </div>
              <h1 className="text-6xl font-bold leading-[1.05] tracking-tighter text-white lg:text-8xl">
                Scale B2B Pipeline with
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-electric">
                  {" "}
                  AI Sales Agents
                </span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
                We help B2B teams generate qualified leads with AI-powered sales reps that run cold email and
                LinkedIn outreach end-to-end.
              </p>
              <div className="mt-10 grid gap-3 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal" />
                  <span>Each AI agent operates with two dedicated email inboxes and one established LinkedIn account.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal" />
                  <span>Agents handle prospecting, personalized outreach, and follow-ups — routing qualified replies directly to your team.</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal" />
                  <span>Built for B2B teams that want predictable lead generation at scale.</span>
                </div>
              </div>
              <div className="mt-12 flex flex-wrap gap-5">
                <a
                  href="/talk-to-our-team"
                  className="group inline-flex items-center gap-2 rounded-full bg-teal px-8 py-4 text-base font-bold text-ink shadow-glow transition hover:-translate-y-1"
                >
                  Talk to Our Team
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <div className="flex -space-x-3 items-center ml-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full border-2 border-ink bg-navy flex items-center justify-center overflow-hidden"
                    >
                      <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="user" />
                    </div>
                  ))}
                  <div className="pl-6 text-sm text-white/50 font-medium">
                    Joined by <span className="text-white font-bold">B2B teams in SaaS, services and tech</span>
                  </div>
                </div>
              </div>
            </div>
            <UIMockup />
          </motion.section>

          <div className="mt-6 md:mt-10">
            {showTrustedLogos && <TrustedLogos />}
          </div>

          {/* Comparison: AI Agents vs Traditional SDRs */}
          <motion.section
            {...motionProps}
            className="scroll-mt-28 mx-auto max-w-7xl px-6 pt-16 pb-32"
            id="comparison"
          >
            <div className="mb-12 text-center">
              <p className="text-xs font-semibold tracking-[0.3em] text-teal mb-4">WHY AI AGENTS</p>
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                Why AI Agents Beat Traditional SDR Teams
              </h2>
              <p className="mt-4 text-white/50 text-lg max-w-2xl mx-auto">
                Keep your closers focused on revenue. We run prospecting, outreach, follow-ups, and reply triage—powered by AI and managed like an internal team.

              </p>
            </div>
            <div className="mx-auto max-w-5xl glass-panel rounded-[36px] border border-teal/30 bg-ink/80 shadow-[0_0_80px_rgba(0,0,0,0.45)] overflow-hidden">
              <div className="grid lg:grid-cols-[1fr_auto_1fr]">
                <div className="p-8 md:p-10">
                  <div className="flex items-center gap-3 mb-6">
                    <Users className="w-5 h-5 text-white/60" />
                    <span className="text-xs font-semibold text-white/60 uppercase tracking-[0.2em]">
                      Traditional SDR Team
                    </span>
                  </div>
                  <div className="space-y-5 text-sm text-white/60">
                    {comparisonRows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-6">
                        <span className="text-white/40">{row.label}</span>
                        <span className="text-white/70 font-semibold">{row.traditional}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-teal/50 to-transparent" />
                <div className="p-8 md:p-10 bg-teal/5 border-t border-teal/20 lg:border-t-0 lg:border-l">
                  <div className="flex items-center gap-3 mb-6">
                    <Bot className="w-5 h-5 text-teal" />
                    <span className="text-xs font-semibold text-teal uppercase tracking-[0.2em]">
                      Leadnexa AI Agents
                    </span>
                  </div>
                  <div className="space-y-5 text-sm">
                    {comparisonRows.map((row) => (
                      <div key={row.label} className="flex items-center justify-between gap-6">
                        <span className="text-white/40">{row.label}</span>
                        <span className="text-teal font-semibold">{row.ai}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { value: "24/7", label: "Always on outreach" },
                { value: "2-3x", label: "Lead conversion rate" },
                { value: "4-14 days", label: "Launch window" },
                { value: "-87%", label: "Hiring cost reduction" }
              ].map((item) => (
                <div
                  key={item.label}
                  className="glass-panel rounded-3xl p-6 text-center border-white/5 hover:border-teal/30 transition-colors"
                >
                  <div className="text-2xl font-bold text-teal mb-2">{item.value}</div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Case Studies Section */}
          <motion.section {...motionProps} className="mx-auto max-w-7xl px-6 pt-32 pb-28" id="case-studies">
            <div className="mb-16 text-center max-w-3xl mx-auto">
              <p className="text-xs font-semibold tracking-[0.3em] text-teal mb-4">CASE STUDIES</p>
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl mb-4">
                Real results from real companies
              </h2>
              <p className="text-white/60 text-lg">
                See how B2B companies across industries are using AI sales agents to scale pipeline, reduce
                outbound costs and book more meetings.
              </p>
              <p className="mt-4 text-xs text-white/30">
                * Company identities are anonymized to protect client confidentiality. All outcomes are based on
                real campaigns.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {/* SaaS Case */}
              <div className="glass-panel rounded-[32px] p-10 hover:border-teal/30 transition-all duration-500 group flex min-h-[580px] flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-teal/10 transition-colors">
                    <BarChart3 className="h-6 w-6 text-teal" />
                  </div>
                  <h3 className="mt-8 text-2xl font-bold text-white">B2B SaaS</h3>
                  <p className="mt-3 text-sm font-semibold text-teal">+38 qualified demos in 90 days</p>
                  <p className="mt-4 text-white/50 leading-relaxed text-sm">
                    Early-stage SaaS team relying on founder-led sales. Leadnexa AI Agents took over outbound
                    research and messaging, generating a steady flow of qualified demos while freeing the founder
                    to focus on product and closing.
                  </p>
                </div>
                <div className="mt-8">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Reply Rate</p>
                      <p className="mt-1 text-xl font-bold text-teal">21%</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Leads / Month</p>
                      <p className="mt-1 text-xl font-bold text-white">42</p>
                    </div>
                  </div>
                  <a
                    href="/case-studies/saas"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal"
                  >
                    Learn more <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* IT Services Case */}
              <div className="glass-panel rounded-[32px] p-10 hover:border-teal/30 transition-all duration-500 group flex min-h-[580px] flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-teal/10 transition-colors">
                    <Users className="h-6 w-6 text-teal" />
                  </div>
                  <h3 className="mt-8 text-2xl font-bold text-white">IT Services</h3>
                  <p className="mt-3 text-sm font-semibold text-teal">2.5x more meetings with mid-market prospects</p>
                  <p className="mt-4 text-white/50 leading-relaxed text-sm">
                    Services provider with long sales cycles and a lean sales team. AI Agents built targeted
                    account lists and ran multi-channel outreach, resulting in 2.5x more meetings with
                    decision-makers in 90 days.
                  </p>
                </div>
                <div className="mt-8">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Reply Rate</p>
                      <p className="mt-1 text-xl font-bold text-teal">17%</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Leads / Month</p>
                      <p className="mt-1 text-xl font-bold text-white">31</p>
                    </div>
                  </div>
                  <a
                    href="/case-studies/it-services"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal"
                  >
                    Learn more <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>

              {/* Henderson Case */}
              <div className="glass-panel rounded-[32px] p-10 hover:border-teal/30 transition-all duration-500 group flex min-h-[580px] flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-teal/10 transition-colors">
                    <Sparkles className="h-6 w-6 text-teal" />
                  </div>
                  <h3 className="mt-8 text-2xl font-bold text-white">Professional Services</h3>
                  <p className="mt-3 text-sm font-semibold text-teal">SR&ED and government funding advisory</p>
                  <p className="mt-4 text-white/50 leading-relaxed text-sm">
                    Specialized advisory firm helping Canadian businesses secure SR&ED tax credits and government
                    funding. Leadnexa AI Agents targeted innovation-driven companies and booked qualified
                    consultations with CFOs and technical leaders without adding SDR headcount.
                  </p>
                </div>
                <div className="mt-8">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Reply Rate</p>
                      <p className="mt-1 text-xl font-bold text-teal">19%</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Leads / Month</p>
                      <p className="mt-1 text-xl font-bold text-white">26</p>
                    </div>
                  </div>
                  <a
                    href="/case-studies/henderson"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal"
                  >
                    Learn more <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Process Section */}
          <motion.section
            {...motionProps}
            className="scroll-mt-28 mx-auto max-w-7xl px-6 py-32 bg-white/[0.02] rounded-[48px] border border-white/5"
            id="how"
          >
            <div className="text-center max-w-3xl mx-auto">
              <p className="text-xs font-semibold tracking-[0.3em] text-teal mb-4">HOW IT WORKS</p>
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">High-Touch Setup in 4 Steps</h2>
              <p className="mt-6 text-white/60 text-lg leading-relaxed">
                A concierge process that launches quickly, protects your brand, and keeps pipeline flowing—without you managing the day-to-day. With these four steps, we can start delivering qualified leads in{" "}
                <span className="text-teal font-semibold">under two weeks</span>.
              </p>
            </div>
            <div className="mt-12 hidden lg:grid grid-cols-4 gap-6 lg:gap-10">
              {steps.map((_, i) => (
                <div key={`step-ui-${i}`} className="flex items-center justify-start gap-3">
                  <div className="w-11 h-11 rounded-full border-2 border-teal/50 bg-ink/70 flex items-center justify-center text-teal font-bold">
                    0{i + 1}
                  </div>
                  <div className="text-xs uppercase tracking-[0.2em] text-white font-semibold">
                    {stepTimeline[i]}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-10">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="glass-panel rounded-[28px] p-6 border-white/10 hover:border-teal/30 transition-colors"
                >
                  <h4 className="text-base font-bold text-white">{step.title}</h4>
                  <p className="mt-2 text-white/50 text-sm leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Testimonials Section */}
          <motion.section {...motionProps} className="mx-auto max-w-7xl px-6 py-32">
            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-16 items-center">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl mb-4">
                  What Revenue Leaders Say
                </h2>
                <p className="text-white/60 text-lg max-w-xl mb-8">
                  Leadnexa helps B2B teams move beyond manual prospecting and inconsistent outbound performance.
                  Here's what it looks like in practice.
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  {testimonials.map((t) => (
                    <div key={t.name} className="glass-panel rounded-3xl p-6 border-white/10">
                      <div className="flex items-center gap-1 text-amber-400 mb-4">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <Star key={i} className="h-4 w-4 fill-amber-400" />
                        ))}
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed mb-5">{t.quote}</p>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                          {t.initials}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{t.name}</p>
                          <p className="text-xs text-white/40">{t.detail}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-panel rounded-[32px] p-8 border-teal/30 bg-teal/5 flex flex-col justify-between gap-8">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-6 h-6 text-teal" />
                    <span className="text-xs uppercase tracking-[0.2em] text-teal font-semibold">
                      Typical 90-Day Snapshot
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="rounded-2xl bg-ink/60 border border-teal/30 p-4">
                      <div className="text-xs text-white/50 mb-1">New meetings</div>
                      <div className="text-2xl font-bold text-white">30-50</div>
                      <div className="text-[11px] text-white/40">for a mid-market B2B sales team</div>
                    </div>
                    <div className="rounded-2xl bg-ink/60 border border-teal/30 p-4">
                      <div className="text-xs text-white/50 mb-1">Outbound costs</div>
                      <div className="text-2xl font-bold text-teal">-30%</div>
                      <div className="text-[11px] text-white/40">vs. traditional SDR stack</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-white/50">
                    Numbers above are based on typical outcomes for B2B SaaS and services customers using Leadnexa
                    AI Agents with consistent outbound for at least 90 days.
                  </p>
                </div>
                <div className="rounded-2xl bg-ink/70 border border-white/10 p-4 flex items-center gap-3 text-xs text-white/60">
                  <ShieldCheck className="w-5 h-5 text-teal" />
                  <div>
                    <p className="font-semibold text-white text-[11px] uppercase tracking-[0.2em] mb-1">
                      Risk-Free to Get Started
                    </p>
                    <p>No long-term contracts. 14-day free trial, cancel anytime.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {showIntegrations && (
            <motion.section {...motionProps} className="mx-auto max-w-7xl px-6 py-24" id="integrations">
              <div className="mb-12 text-center max-w-3xl mx-auto">
                <p className="text-xs font-semibold tracking-[0.3em] text-teal mb-4">INTEGRATIONS</p>
                <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl mb-4">
                  Works With Your Stack
                </h2>
                <p className="text-white/60 text-lg">
                  No more logging into dozens of tools. Our AI filters for high-intent responses and routes them instantly to your existing stack (Slack, CRM, or Email). You focus on closing; we handle the plumbing.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {["Gmail", "Outlook", "HubSpot", "Salesforce", "Calendly", "Slack", "Apollo", "Zapier"].map((tool) => (
                  <div
                    key={tool}
                    className="glass-panel rounded-2xl p-6 border-white/10 text-center text-sm text-white/70 hover:border-teal/30 transition-colors"
                  >
                    {tool}
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* FAQ */}
          <motion.section {...motionProps} className="mx-auto max-w-7xl px-6 py-32">
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <p className="text-xs font-semibold tracking-[0.3em] text-teal mb-4">FAQ</p>
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl mb-4">
                Common Questions
              </h2>
              <p className="text-white/60 text-lg">
                Clear answers on deliverability, ramp time, and how the agents work.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  q: "How do you protect deliverability?",
                  a: "We protect deliverability through gradual warm-up, controlled sending volumes, and continuous engagement monitoring — ensuring long-term sender reputation."
                },
                {
                  q: "How fast can we go live?",
                  a: "Most teams launch in 4-14 days after a kickoff and ICP alignment call."
                },
                {
                  q: "What does the AI agent handle vs. our team?",
                  a: "Our AI agents handle prospecting, personalized outreach, and follow-ups. Once a prospect shows interest, the conversation is handed off to your team to take over."
                },
                {
                  q: "Do you write and optimize messaging?",
                  a: "Yes. We create and test multi-variant outbound messaging, optimizing based on engagement signals and campaign performance."
                }
              ].map((item) => (
                <div key={item.q} className="glass-panel rounded-3xl p-6 border-white/10">
                  <p className="text-sm font-semibold text-white mb-2">{item.q}</p>
                  <p className="text-sm text-white/60 leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Pricing Section */}
          <motion.section
            {...motionProps}
            className="mx-auto max-w-7xl px-6 py-32 text-center"
            id="pricing"
          >
            <div className="max-w-3xl mx-auto mb-20">
              <p className="text-xs font-semibold tracking-[0.3em] text-teal mb-4">PRICING</p>
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                Simple, Transparent Pricing
              </h2>
              <p className="mt-6 text-white/50 text-lg">
                No long-term contracts. Scale your AI sales force as you grow.
              </p>
            </div>

            <div className="mx-auto w-full max-w-5xl">
              <div className="mb-12 rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-left">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">Number of AI Sales Agents</p>
                    <p className="mt-2 text-3xl font-bold text-white">{agentCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">Unit Price</p>
                    <p className="mt-2 text-2xl font-bold text-teal">${unitPrice}/agent</p>
                  </div>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  step={1}
                  value={agentCount}
                  onChange={(event) => setAgentCount(Number(event.target.value))}
                  aria-label="Select number of AI sales agents"
                  className="h-3 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-teal"
                  style={{
                    background: `linear-gradient(to right, rgb(45 212 191) 0%, rgb(45 212 191) ${sliderProgress}%, rgba(255,255,255,0.12) ${sliderProgress}%, rgba(255,255,255,0.12) 100%)`
                  }}
                />
                <div className="mt-5 grid gap-3 text-xs text-white/50 sm:grid-cols-4">
                  <div className={agentCount <= 4 ? "text-teal font-semibold" : ""}>1-4 agents: $750 each</div>
                  <div className={agentCount >= 5 && agentCount <= 10 ? "text-teal font-semibold" : ""}>
                    5-10 agents: $700 each
                  </div>
                  <div className={agentCount >= 11 && agentCount <= 20 ? "text-teal font-semibold" : ""}>
                    11-20 agents: $650 each
                  </div>
                  <div className={agentCount >= 21 ? "text-teal font-semibold" : ""}>21-30 agents: $600 each</div>
                </div>
              </div>

              <div className="glass-panel relative overflow-hidden rounded-[48px] border-teal/30 p-12 text-left shadow-glow">
                <div className="absolute top-0 right-0 bg-teal px-8 py-2 rounded-bl-3xl text-ink text-xs font-black uppercase tracking-widest">
                  Dynamic Plan
                </div>
                <div className="mb-8 flex items-center gap-4 text-teal">
                  <ShieldCheck className="h-8 w-8" />
                  <span className="text-2xl font-bold uppercase tracking-tight">AI Agent Growth Plan</span>
                </div>
                <div className="mb-10 flex items-end gap-3">
                  <span className="text-7xl font-bold text-white tracking-tighter">${monthlyTotal.toLocaleString()}</span>
                  <span className="pb-2 text-white/40 font-medium">/ month</span>
                </div>
                <p className="mb-8 text-sm text-white/50">
                  {agentCount} agents × ${unitPrice}/agent — covering cold email and LinkedIn outreach. 
                </p>
                <div className="mb-12 grid gap-x-12 gap-y-6 md:grid-cols-2">
                  {pricingServices.map((service) => (
                    <div key={service} className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-teal/20 p-0.5">
                        <Check className="h-3.5 w-3.5 text-teal" />
                      </div>
                      <span className="text-sm font-medium leading-relaxed text-white/70">{service}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className="w-full rounded-2xl bg-teal py-5 text-lg font-black text-ink shadow-glow transition hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                >
                  {isLoading ? "Redirecting..." : "Get Started & Begin Setup"}
                </button>
                {checkoutError && (
                  <p className="mt-4 text-center text-sm text-rose-300">{checkoutError}</p>
                )}
                <p className="mt-6 text-center text-xs font-medium uppercase tracking-widest text-white/30">
                  Paid upfront. Subscription renews after the 14-day setup period. Cancel anytime.
                </p>
              </div>
            </div>
          </motion.section>
        </main>

        <footer className="border-t border-white/5 bg-ink/50 pt-20 pb-10">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col md:flex-row justify-between gap-12 mb-20">
              <div className="max-w-xs">
                <div className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white mb-6">
                  <div className="bg-teal p-1.5 rounded-lg">
                    <Sparkles className="h-5 w-5 text-ink" />
                  </div>
                  LeadNexa.ai
                </div>
                <p className="text-white/40 text-sm leading-relaxed">
                  Driving B2B scale through AI-powered multi-channel outbound infrastructure.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
                <div>
                  <h5 className="text-white font-bold mb-6">Product</h5>
                  <ul className="space-y-4 text-sm text-white/40">
                    <li>
                      <a href="#how" className="hover:text-teal transition-colors">
                        How it works
                      </a>
                    </li>
                    <li>
                      <a href="#pricing" className="hover:text-teal transition-colors">
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a href="#comparison" className="hover:text-teal transition-colors">
                        Why AI Agents
                      </a>
                    </li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-bold mb-6">Company</h5>
                  <ul className="space-y-4 text-sm text-white/40">
                    <li>
                      <a href="#" className="hover:text-teal transition-colors">
                        About
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-teal transition-colors">
                        Careers
                      </a>
                    </li>
                    <li>
                      <a href="#" className="hover:text-teal transition-colors">
                        Contact
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/30 uppercase tracking-[0.2em] font-bold">
              <p>(c) 2026 LeadNexa.ai Inc. All rights reserved.</p>
              <div className="flex gap-8">
                <a href="/privacy" className="hover:text-white">
                  Privacy Policy
                </a>
                <a href="/terms" className="hover:text-white">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
