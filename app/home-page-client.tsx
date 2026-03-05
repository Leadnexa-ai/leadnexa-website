"use client";
import React, { useState, useEffect, useRef, ReactElement } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import SiteHeader from "./components/site-header";
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
  Star,
  ChevronDown,
  Play,
  Video,
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

type PlanCode = "linkedin_scale" | "multichannel_scale";

type PlanConfig = {
  code: PlanCode;
  label: string;
  baseMonthly: number;
  additionalMonthly: number;
  services: string[];
};

const MIN_AGENTS = 2;
const MAX_AGENTS = 30;

const PLAN_CONFIGS: Record<PlanCode, PlanConfig> = {
  linkedin_scale: {
    code: "linkedin_scale",
    label: "Plan 1 - LinkedIn Scaling",
    baseMonthly: 750,
    additionalMonthly: 300,
    services: [
      "1 established LinkedIn account per AI sales agent",
      "AI-powered LinkedIn outreach & automated follow-ups",
      "Custom ICP strategy & message positioning",
      "High-quality prospect list built to match your ICP",
      "Automated multi-step follow-up sequences",
      "Real-time reply routing to your dashboard",
      "Weekly performance reporting & optimization",
      "1-on-1 onboarding session",
      "Dedicated Success Manager"
    ]
  },
  multichannel_scale: {
    code: "multichannel_scale",
    label: "Plan 2 - Multi-Channel Scaling",
    baseMonthly: 1350,
    additionalMonthly: 550,
    services: [
      "1 established LinkedIn account per AI sales agent",
      "2 dedicated email inboxes per AI sales agent",
      "AI-powered LinkedIn + cold email outreach engine",
      "Automated cross-channel follow-up sequences",
      "Custom ICP-based messaging strategy",
      "Real-time reply routing to your dashboard",
      "Weekly performance reporting & optimization",
      "1-on-1 onboarding session",
      "Dedicated Success Manager"
    ]
  }
};



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
  { label: "Monthly cost", traditional: "$6k-$9k per SDR", ai: "From $1.65k for 5 AI seats" },
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

function isPlanCode(value: string | null): value is PlanCode {
  return value === "linkedin_scale" || value === "multichannel_scale";
}

function getInitialPlan(): PlanCode {
  if (typeof window === "undefined") {
    return "multichannel_scale";
  }

  const rawPlan = new URLSearchParams(window.location.search).get("plan");
  return isPlanCode(rawPlan) ? rawPlan : "multichannel_scale";
}

function getInitialAgentsFromQuery(): number {
  if (typeof window === "undefined") {
    return MIN_AGENTS;
  }

  const rawValue = new URLSearchParams(window.location.search).get("agents");
  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed < MIN_AGENTS || parsed > MAX_AGENTS) {
    return MIN_AGENTS;
  }

  return parsed;
}

function getPlanMonthlyTotal(plan: PlanCode, agents: number): number {
  const normalizedAgents = Math.min(Math.max(agents, MIN_AGENTS), MAX_AGENTS);
  const config = PLAN_CONFIGS[plan];
  return config.baseMonthly + Math.max(normalizedAgents - MIN_AGENTS, 0) * config.additionalMonthly;
}

// --- Components ---

const clientLogos = [
  { name: "Valencia", src: "/Valencia_Logo_2025.avif" },
  { name: "Henderson Associates", src: "/henderson-logo.webp" },
  { name: "Finn Form", src: "/Finn_and_Form_Logo.svg" },
  { name: "Steamoji", src: "/steamoji_logo.png" },
  { name: "Vesta", src: "/Vesta_logo_new_color_on_transparent_with_Canada_flag.png" },
];

const TrustedLogos = () => {
  return (
    <section className="relative w-full border-y border-white/5 py-16 overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-teal/[0.02] via-transparent to-electric/[0.02] pointer-events-none" />

      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[200px] bg-teal/5 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center mb-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/20 bg-teal/5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.3em] text-teal mb-2">
            <Star className="w-3 h-3 fill-teal" />
            Trusted By
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-[2.1rem]">
            The B2B growth teams your prospects already trust.
          </h2>
          <p className="text-base text-white/60">
            Used by revenue, marketing, and founder-led teams in North America and beyond.
          </p>
        </div>

        <div className="mt-12 relative">
          {/* Enhanced mask with smoother gradient */}
          <div className="[mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="w-max whitespace-nowrap animate-marquee-infinite flex items-center">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={`track-${i}`} className="inline-flex items-center gap-16 px-8">
                  {clientLogos.map((logo, j) => (
                    <div
                      key={`${logo.name}-${i}-${j}`}
                      className="relative h-20 w-64 shrink-0 md:h-24 md:w-80 mx-4"
                    >
                      {/* Logo container */}
                      <div className="relative h-full w-full rounded-2xl p-4">
                        <Image
                          src={logo.src}
                          alt={`${logo.name} logo`}
                          fill
                          className="object-contain p-2"
                          quality={100}
                          priority={false}
                          style={{ imageRendering: 'crisp-edges' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};


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

const renderFaqAnswer = (answer: string) => {
  const lines = answer.split('\n');
  const elements: ReactElement[] = [];
  let bulletPoints: string[] = [];
  let currentText = '';

  lines.forEach((line, index) => {
    if (line.trim().startsWith('•')) {
      if (currentText) {
        elements.push(
          <p key={`text-${elements.length}`} className="text-xs text-white/70 leading-relaxed mb-3">
            {currentText}
          </p>
        );
        currentText = '';
      }
      bulletPoints.push(line.replace(/^[•\s]+/, '').trim());
    } else if (line.trim()) {
      if (bulletPoints.length > 0) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-2 mb-3">
            {bulletPoints.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-white/70 leading-relaxed">
                <span className="text-teal mt-0.5 shrink-0">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        );
        bulletPoints = [];
      }
      currentText += (currentText ? ' ' : '') + line.trim();
    }
  });

  if (currentText) {
    elements.push(
      <p key={`text-${elements.length}`} className="text-xs text-white/70 leading-relaxed mb-3">
        {currentText}
      </p>
    );
  }

  if (bulletPoints.length > 0) {
    elements.push(
      <ul key={`list-${elements.length}`} className="space-y-2 mb-3">
        {bulletPoints.map((point, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-white/70 leading-relaxed">
            <span className="text-teal mt-0.5 shrink-0">•</span>
            <span>{point}</span>
          </li>
        ))}
      </ul>
    );
  }

  return <div className="pl-9">{elements}</div>;
};

const VideoPlayer = ({ videoPath, videoTitle }: { videoPath: string; videoTitle: string }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, [videoPath]);

  return (
    <div className="sticky top-24">
      <div className="glass-panel rounded-3xl overflow-hidden border-teal/30 bg-ink/60 shadow-[0_0_60px_rgba(45,212,191,0.1)]">
        <div className="aspect-video relative bg-ink/80 overflow-hidden">
          <video
            ref={videoRef}
            key={videoPath}
            className="absolute inset-0 w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
          >
            <source src={videoPath} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="p-6 border-t border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-teal/20">
              <Play className="w-5 h-5 text-teal fill-teal" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-teal font-semibold">Now Playing</p>
              <p className="text-sm text-white/80 font-medium mt-0.5">
                {videoTitle}
              </p>
            </div>
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            Click any question on the left to watch its corresponding video explanation. Use tabs above to browse by category.
          </p>
        </div>
      </div>
    </div>
  );
};

export default function HomePage() {
  const [isLoadingPlan, setIsLoadingPlan] = useState<PlanCode | null>(null);
  const [checkoutErrorPlan, setCheckoutErrorPlan] = useState<PlanCode | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const initialPlan = getInitialPlan();
  const initialAgents = getInitialAgentsFromQuery();
  const [linkedinAgents, setLinkedinAgents] = useState<number>(
    initialPlan === "linkedin_scale" ? initialAgents : MIN_AGENTS
  );
  const [multichannelAgents, setMultichannelAgents] = useState<number>(
    initialPlan === "multichannel_scale" ? initialAgents : MIN_AGENTS
  );
  const [expandedFaq, setExpandedFaq] = useState<number>(0);
  const [faqCategory, setFaqCategory] = useState<string>("general");
  const showIntegrations = process.env.NEXT_PUBLIC_SHOW_INTEGRATIONS === "true";
  const linkedinTotal = getPlanMonthlyTotal("linkedin_scale", linkedinAgents);
  const multichannelTotal = getPlanMonthlyTotal("multichannel_scale", multichannelAgents);
  const linkedinProgress = ((linkedinAgents - MIN_AGENTS) / (MAX_AGENTS - MIN_AGENTS)) * 100;
  const multichannelProgress =
    ((multichannelAgents - MIN_AGENTS) / (MAX_AGENTS - MIN_AGENTS)) * 100;

  const handleCheckout = async (plan: PlanCode, agents: number) => {
    if (isLoadingPlan) {
      return;
    }

    setCheckoutError(null);
    setCheckoutErrorPlan(null);
    setIsLoadingPlan(plan);

    try {
      const idempotencyKey = crypto.randomUUID();
      const response = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-idempotency-key": idempotencyKey
        },
        body: JSON.stringify({ plan, agents })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) {
          const next = encodeURIComponent(`/?plan=${plan}&agents=${agents}#pricing`);
          window.location.assign(`/login?next=${next}`);
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
      setCheckoutErrorPlan(plan);
      setIsLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen page-shell">
      <div className="relative z-10">
        {/* Background Glows */}
        <div className="pointer-events-none absolute -top-48 right-10 h-[40rem] w-[40rem] rounded-full bg-electric/10 blur-[180px]" />
        <div className="pointer-events-none absolute top-32 -left-32 h-96 w-96 rounded-full bg-teal/10 blur-[160px]" />

        <SiteHeader showIntegrations={showIntegrations} loginNext="/#pricing" />

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
                LeadNexa.ai helps B2B teams generate qualified leads with AI-powered sales reps that run cold email
                and LinkedIn outreach end-to-end.
              </p>
              <div className="mt-10 grid gap-3 text-sm text-white/50">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-teal" />
                  <span>Choose a LinkedIn-only plan or full multi-channel outreach with LinkedIn + cold email.</span>
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
            <TrustedLogos />
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
          <motion.section {...motionProps} className="scroll-mt-28 mx-auto max-w-7xl px-6 py-32" id="faq">
            <div className="mb-12 text-center max-w-3xl mx-auto">
              <p className="text-xs font-semibold tracking-[0.3em] text-teal mb-4">FAQ</p>
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl mb-4">
                Common Questions
              </h2>
              <p className="text-white/60 text-lg">
                Get clear answers on deliverability, pricing, ramp time, and how the agents work.
              </p>
            </div>

            {/* Category Tabs */}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[
                { id: "general", label: "General", icon: Sparkles },
                { id: "howitworks", label: "How It Works", icon: Activity },
                { id: "pricing", label: "Pricing & Plans", icon: BarChart3 }
              ].map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setFaqCategory(category.id);
                    setExpandedFaq(0);
                  }}
                  className={`group flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                    faqCategory === category.id
                      ? "bg-teal text-ink shadow-[0_0_30px_rgba(45,212,191,0.3)]"
                      : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white border border-white/10"
                  }`}
                >
                  <category.icon className="w-4 h-4" />
                  {category.label}
                </button>
              ))}
            </div>
            
            {(() => {
              const faqData = {
                general: [
                  {
                    q: "What is Leadnexa?",
                    a: "Leadnexa provides AI sales agents that act as an always-on SDR team, generating qualified B2B leads and meetings without hiring traditional staff.",
                    videoPath: "/LeadNexa_AI_-_The_White_Glove_Process_v8.mp4",
                    videoTitle: "What is Leadnexa"
                  },
                  {
                    q: "What are the key advantages of AI agents over traditional SDRs?",
                    a: "Agents cost less (from $750 for 2 vs. $6k-9k per SDR), ramp faster (4-14 days vs. 60-90), work 24/7 (168+ hrs/week), reach 300-500 contacts daily, require near-zero management, and deliver consistent results.",
                    videoPath: "/LeadNexa vs Traditional Sales Reps_ Simple Comparison_1080p.mp4",
                    videoTitle: "AI Agents vs Traditional SDRs"
                  },
                  {
                    q: "What types of B2B companies benefit most from Leadnexa?",
                    a: "Leadnexa is ideal for B2B companies with:\n• Deal sizes of $10k+ annually where systematic outbound generates significant ROI\n• Decision-makers reachable on LinkedIn and email\n• Sales teams ready to close qualified conversations but lacking consistent lead flow\n• Organizations looking to supplement or replace traditional prospecting\n• Companies needing predictable pipeline growth without SDR hiring overhead"
                  },
                  {
                    q: "How long does it take to launch Leadnexa campaigns?",
                    a: "Most campaigns launch within 4-14 days.\n\nThe timeline includes:\n• Onboarding questionnaire submission (1-2 days)\n• Strategy kickoff call with your Success Manager (scheduled within 1 week)\n• Infrastructure setup: domains, email warming, LinkedIn profile optimization (3-7 days)\n• Campaign launch and first outreach wave\n\nFaster launches are possible for LinkedIn-only campaigns with existing profiles."
                  },
                  {
                    q: "Is Leadnexa customizable for my brand?",
                    a: "Yes. Every aspect is customized for your brand:\n• LinkedIn profiles with custom headlines, banners, and summaries aligned to your ICP\n• Messaging crafted in your brand voice and value proposition\n• Campaign strategies tailored to your target audience and sales cycle\n• CRM and workflow integrations matched to your sales process\n• Continuous optimization based on your ideal customer feedback"
                  },
                  {
                    q: "How do Leadnexa AI agents replace traditional sales team?",
                    a: "Unlike a traditional sales team that manually searches for leads, sends outreach messages, and tracks follow-ups, LeadNexa's AI automates these tasks at scale. The AI:\n• Identifies and qualifies high-potential prospects automatically\n• Sends personalized outreach and follow-ups without human delay\n• Classifies prospect intent so your team can filter and engage with only interested leads",
                    videoPath: "/LeadNexa AI_ Smarter Prospecting_1080p.mp4",
                    videoTitle: "AI Agent Workflows"
                  },
                  {
                    q: "Do you write and optimize messaging?",
                    a: "Yes. Our team handles all messaging:\n• Initial message templates created based on your value proposition and ICP\n• Multi-variant testing across different angles and CTAs\n• Continuous optimization based on reply rates and engagement signals\n• A/B testing of subject lines, opening hooks, and follow-up timing\n• Regular performance reviews with your Success Manager to refine messaging strategy"
                  },
                  {
                    q: "How does Leadnexa handle replies and lead handoff?",
                    a: "Our AI intent routing system:\n• Monitors all replies in real-time across LinkedIn and email\n• Classifies prospect interest level (high, medium, low intent)\n• Routes qualified leads to your team via CRM, Slack, or email\n• Flags objections or questions that need human response\n• Continues nurturing lower-intent prospects automatically\n• Syncs all conversation history so your team has full context"
                  },
                  {
                    q: "What volume can one AI sales agent handle monthly?",
                    a: "Each AI sales agent manages:\n• 1 LinkedIn account: up to 500 connection requests per month\n• 2 email inboxes: up to 2,000 emails per month (after warm-up)\n• Unlimited automated follow-ups and reply handling\n• Multiple simultaneous campaigns across different ICPs\n\nTo scale volume, simply add more agents. For example:\n• 5 agents = 2,500 LinkedIn connects + 10,000 emails/month\n• 10 agents = 5,000 LinkedIn connects + 20,000 emails/month"
                  }
                ],
                howitworks: [
                  {
                    q: "How does LinkedIn outreach work with Leadnexa agents?",
                    a: "Agents build ICP-aligned lead lists, optimize and warm profiles, send personalized connects (up to 500/month per agent) with smart follow-ups, and route high-intent replies to your team.",
                    videoPath: "/LeadNexa LinkedIn Outreach Explainer_1080p.mp4",
                    videoTitle: "LinkedIn Outreach Process"
                  },
                  {
                    q: "What is the process for cold email campaigns?",
                    a: "Agents build enriched ICP lists, write personalized sequences with follow-ups, execute safe outreach (up to 2,000 emails/month per agent once warmed), monitor deliverability, and route interested replies.",
                    videoPath: "/LeadNexa_Cold_Email_Process_with_Logo_v2.mp4",
                    videoTitle: "Cold Email Campaigns"
                  },
                  {
                    q: "How does Leadnexa handle replies and lead handoff?",
                    a: "Our AI intent routing system:\n• Monitors all replies in real-time across LinkedIn and email\n• Classifies prospect interest level (high, medium, low intent)\n• Routes qualified leads to your team via CRM, Slack, or email\n• Flags objections or questions that need human response\n• Continues nurturing lower-intent prospects automatically\n• Syncs all conversation history so your team has full context"
                  },
                  {
                    q: "How does Leadnexa ensure LinkedIn account safety?",
                    a: "Leadnexa provides and manages high-quality accounts with brand positioning, ICP-aligned profiles, health checks, safe daily limits, and consistent outreach practices.",
                    videoPath: "/LinkedIn Account Safety with LeadNexa_1080p.mp4",
                    videoTitle: "LinkedIn Account Safety"
                  },
                  {
                    q: "How do you protect deliverability?",
                    a: "We protect deliverability through gradual warm-up, controlled sending volumes, and continuous engagement monitoring — ensuring long-term sender reputation.",
                    videoPath: "/LeadNexa_ LinkedIn Deliverability Protection_1080p.mp4",
                    videoTitle: "Deliverability Protection"
                  },
                  {
                    q: "What volume can one AI sales agent handle monthly?",
                    a: "Each AI sales agent manages:\n• 1 LinkedIn account: up to 500 connection requests per month\n• 2 email inboxes: up to 2,000 emails per month (after warm-up)\n• Unlimited automated follow-ups and reply handling\n• Multiple simultaneous campaigns across different ICPs\n\nTo scale volume, simply add more agents. For example:\n• 5 agents = 2,500 LinkedIn connects + 10,000 emails/month\n• 10 agents = 5,000 LinkedIn connects + 20,000 emails/month"
                  },
                  {
                    q: "How does scaling agents work for larger outreach?",
                    a: "Scale from 1-30 agents with volume pricing; e.g.:\n• 5 agents: 5 accounts, 2.5k connects, 10k emails\n• 20 agents: 20 accounts, 10k connects, 40k emails",
                    videoPath: "/Scaling LeadNexa Agents_1080p.mp4",
                    videoTitle: "Scaling Agents"
                  }
                ],
                pricing: [
                  {
                    q: "What's included in each agent subscription?",
                    a: "Each AI agent includes:\n• 1 LinkedIn account\n• 2 email inboxes\n• Unlimited campaigns\n• Automated follow-ups\n• Dedicated support from your Success Manager",
                    videoPath: "/videos/pricing-details.mp4",
                    videoTitle: "Pricing Breakdown"
                  },
                  {
                    q: "Can I cancel anytime?",
                    a: "Yes. We don't lock you into long-term contracts. Cancel anytime with 30 days notice. We also offer a 14-day free trial for new customers.",
                    videoPath: "/videos/trial-cancellation.mp4",
                    videoTitle: "Trial & Cancellation"
                  },
                  {
                    q: "Do you offer volume discounts?",
                    a: "We offer transparent flat-rate pricing:\n• LinkedIn Scale: $750 for 2 agents, then $300 per additional agent\n• Multi-Channel Scale: $1,350 for 2 agents, then $550 per additional agent\n• Get 25% off your first month\n\nFor teams needing 30+ agents, contact us for custom enterprise pricing.",
                    videoPath: "/videos/volume-pricing.mp4",
                    videoTitle: "Volume Discounts"
                  }
                ]
              };

              const currentFaqs = faqData[faqCategory as keyof typeof faqData] || faqData.general;
              const currentFaq = currentFaqs[expandedFaq] || currentFaqs[0];
              const isPricingCategory = faqCategory === "pricing";
              const hasVideo = currentFaq.videoPath && currentFaq.videoTitle;
              const showAnswerOnRight = isPricingCategory || !hasVideo;

              return (
                <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8 lg:gap-12 items-start">
                  {/* FAQ Accordion */}
                  <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-teal/20 scrollbar-track-transparent">
                    {currentFaqs.map((item, index) => (
                      <div 
                        key={item.q} 
                        className={`glass-panel rounded-2xl overflow-hidden border transition-all duration-300 cursor-pointer ${
                          expandedFaq === index 
                            ? 'border-teal/50 bg-teal/5 shadow-[0_0_30px_rgba(45,212,191,0.15)]' 
                            : 'border-white/10 hover:border-teal/30'
                        }`}
                        onClick={() => setExpandedFaq(index)}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2.5 mb-2">
                                <div className={`flex items-center justify-center w-7 h-7 rounded-full transition-colors ${
                                  expandedFaq === index ? 'bg-teal/20' : 'bg-white/5'
                                }`}>
                                  {isPricingCategory ? (
                                    <BarChart3 className={`w-3.5 h-3.5 transition-colors ${
                                      expandedFaq === index ? 'text-teal' : 'text-white/40'
                                    }`} />
                                  ) : item.videoPath ? (
                                    <Video className={`w-3.5 h-3.5 transition-colors ${
                                      expandedFaq === index ? 'text-teal' : 'text-white/40'
                                    }`} />
                                  ) : (
                                    <MessageSquare className={`w-3.5 h-3.5 transition-colors ${
                                      expandedFaq === index ? 'text-teal' : 'text-white/40'
                                    }`} />
                                  )}
                                </div>
                                <h3 className={`text-sm font-semibold transition-colors ${
                                  expandedFaq === index ? 'text-white' : 'text-white/80'
                                }`}>
                                  {item.q}
                                </h3>
                              </div>
                              {!showAnswerOnRight && (
                                <div className={`overflow-hidden transition-all duration-300 ${
                                  expandedFaq === index ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'
                                }`}>
                                  {renderFaqAnswer(item.a)}
                                </div>
                              )}
                            </div>
                            {!showAnswerOnRight && (
                              <ChevronDown 
                                className={`w-4 h-4 text-teal shrink-0 mt-1 transition-transform duration-300 ${
                                  expandedFaq === index ? 'rotate-180' : ''
                                }`}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Panel - Video or Answer */}
                  {showAnswerOnRight ? (
                    <div className="sticky top-24">
                      <div className="glass-panel rounded-3xl overflow-hidden border-teal/30 bg-ink/60 shadow-[0_0_60px_rgba(45,212,191,0.1)]">
                        <div className="p-8">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl bg-teal/20 flex items-center justify-center">
                              {isPricingCategory ? (
                                <BarChart3 className="h-6 w-6 text-teal" />
                              ) : (
                                <MessageSquare className="h-6 w-6 text-teal" />
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{currentFaq.q}</h3>
                              <p className="text-xs text-white/50 uppercase tracking-[0.2em]">
                                {isPricingCategory ? 'Pricing Details' : 'Answer'}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4 text-white/80 leading-relaxed">
                            {currentFaq.a.split('\n').map((line, i) => {
                              if (line.trim().startsWith('•')) {
                                return (
                                  <div key={i} className="flex items-start gap-3 py-2">
                                    <div className="mt-1.5 rounded-full bg-teal/20 p-1">
                                      <Check className="h-3 w-3 text-teal" />
                                    </div>
                                    <span className="text-sm">{line.replace(/^[•\s]+/, '').trim()}</span>
                                  </div>
                                );
                              } else if (line.trim()) {
                                return (
                                  <p key={i} className="text-sm leading-relaxed">
                                    {line.trim()}
                                  </p>
                                );
                              }
                              return null;
                            })}
                          </div>
                        </div>
                        {isPricingCategory && (
                          <div className="px-8 pb-8">
                            <div className="rounded-2xl bg-teal/10 border border-teal/30 p-5">
                              <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck className="w-5 h-5 text-teal" />
                                <span className="text-xs uppercase tracking-[0.2em] text-teal font-semibold">Flexible Terms</span>
                              </div>
                              <p className="text-xs text-white/60 leading-relaxed">
                                No long-term contracts required. 14-day free trial available. Cancel anytime with 30 days notice.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <VideoPlayer videoPath={currentFaq.videoPath} videoTitle={currentFaq.videoTitle} />
                  )}
                </div>
              );
            })()}
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

            <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-2">
              <div className="glass-panel relative flex h-full flex-col overflow-hidden rounded-[40px] border-teal/30 p-8 text-left shadow-glow">
                <div className="mt-5 flex items-center gap-3 text-teal">
                  <ShieldCheck className="h-6 w-6" />
                  <span className="text-xl font-bold uppercase tracking-tight">
                    {PLAN_CONFIGS.linkedin_scale.label}
                  </span>
                </div>
                <div className="mt-6 flex items-end gap-3">
                  <span className="text-5xl font-bold tracking-tighter text-white">
                    ${linkedinTotal.toLocaleString()}
                  </span>
                  <span className="pb-1 text-sm font-medium text-white/40">/ month</span>
                </div>
                <p className="mt-2 text-sm text-white/60">
                  $750 for 2 agents, then $300 per additional agent.
                </p>

                <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-3 flex items-center justify-between text-sm text-white/70">
                    <span>AI Sales Agents</span>
                    <span className="font-semibold text-white">{linkedinAgents}</span>
                  </div>
                  <input
                    type="range"
                    min={MIN_AGENTS}
                    max={MAX_AGENTS}
                    step={1}
                    value={linkedinAgents}
                    onChange={(event) => setLinkedinAgents(Number(event.target.value))}
                    aria-label="Select number of LinkedIn plan agents"
                    className="h-3 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-teal"
                    style={{
                      background: `linear-gradient(to right, rgb(45 212 191) 0%, rgb(45 212 191) ${linkedinProgress}%, rgba(255,255,255,0.12) ${linkedinProgress}%, rgba(255,255,255,0.12) 100%)`
                    }}
                  />
                  <p className="mt-3 text-xs text-white/50">Minimum 2 agents, maximum 30 agents.</p>
                </div>

                <div className="mb-8 mt-8 grid flex-1 content-start gap-4">
                  {PLAN_CONFIGS.linkedin_scale.services.map((service) => (
                    <div key={service} className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-teal/20 p-0.5">
                        <Check className="h-3.5 w-3.5 text-teal" />
                      </div>
                      <span className="text-sm font-medium leading-relaxed text-white">{service}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => void handleCheckout("linkedin_scale", linkedinAgents)}
                    disabled={Boolean(isLoadingPlan)}
                    className="w-full rounded-2xl bg-teal py-4 text-base font-black text-ink shadow-glow transition hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                  >
                    {isLoadingPlan === "linkedin_scale" ? "Redirecting..." : "Choose LinkedIn Scale"}
                  </button>
                  {checkoutError && checkoutErrorPlan === "linkedin_scale" && (
                    <p className="mt-4 text-center text-sm text-rose-300">{checkoutError}</p>
                  )}
                </div>
              </div>

              <div className="glass-panel relative flex h-full flex-col overflow-hidden rounded-[40px] border-teal/30 p-8 text-left shadow-glow">
                <div className="mt-5 flex items-center gap-3 text-teal">
                  <ShieldCheck className="h-6 w-6" />
                  <span className="text-xl font-bold uppercase tracking-tight">
                    {PLAN_CONFIGS.multichannel_scale.label}
                  </span>
                </div>
                <div className="mt-6 flex items-end gap-3">
                  <span className="text-5xl font-bold tracking-tighter text-white">
                    ${multichannelTotal.toLocaleString()}
                  </span>
                  <span className="pb-1 text-sm font-medium text-white/40">/ month</span>
                </div>
                <p className="mt-2 text-sm text-white/60">
                  $1,350 for 2 agents, then $550 per additional agent.
                </p>

                <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="mb-3 flex items-center justify-between text-sm text-white/70">
                    <span>AI Sales Agents</span>
                    <span className="font-semibold text-white">{multichannelAgents}</span>
                  </div>
                  <input
                    type="range"
                    min={MIN_AGENTS}
                    max={MAX_AGENTS}
                    step={1}
                    value={multichannelAgents}
                    onChange={(event) => setMultichannelAgents(Number(event.target.value))}
                    aria-label="Select number of Multi-Channel plan agents"
                    className="h-3 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-teal"
                    style={{
                      background: `linear-gradient(to right, rgb(45 212 191) 0%, rgb(45 212 191) ${multichannelProgress}%, rgba(255,255,255,0.12) ${multichannelProgress}%, rgba(255,255,255,0.12) 100%)`
                    }}
                  />
                  <p className="mt-3 text-xs text-white/50">Minimum 2 agents, maximum 30 agents.</p>
                </div>

                <div className="mb-8 mt-8 grid flex-1 content-start gap-4">
                  {PLAN_CONFIGS.multichannel_scale.services.map((service) => (
                    <div key={service} className="flex items-start gap-3">
                      <div className="mt-1 rounded-full bg-teal/20 p-0.5">
                        <Check className="h-3.5 w-3.5 text-teal" />
                      </div>
                      <span className="text-sm font-medium leading-relaxed text-white">{service}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto">
                  <button
                    onClick={() => void handleCheckout("multichannel_scale", multichannelAgents)}
                    disabled={Boolean(isLoadingPlan)}
                    className="w-full rounded-2xl bg-teal py-4 text-base font-black text-ink shadow-glow transition hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
                  >
                    {isLoadingPlan === "multichannel_scale" ? "Redirecting..." : "Choose Multi-Channel Scale"}
                  </button>
                  {checkoutError && checkoutErrorPlan === "multichannel_scale" && (
                    <p className="mt-4 text-center text-sm text-rose-300">{checkoutError}</p>
                  )}
                </div>
              </div>
            </div>

            <p className="mt-8 text-center text-xs font-medium uppercase tracking-widest text-white">
              Paid upfront. Get <span className="font-bold text-teal">25% off</span> your first month. Cancel anytime.
            </p>
          </motion.section>
        </main>

        <footer className="border-t border-white/5 bg-ink/50 pt-20 pb-10">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col md:flex-row justify-between gap-12 mb-20">
              <div className="max-w-xs">
                <a href="/" className="inline-flex mb-6">
                  <Image
                    src="/logo.png"
                    alt="LeadNexa logo"
                    width={170}
                    height={40}
                    className="h-9 w-auto"
                  />
                </a>
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
                  <h5 className="text-white font-bold mb-6">Contact</h5>
                  <div className="space-y-5 text-sm text-white/40">
                    <a
                      href="mailto:info@leadnexa.ai"
                      className="group flex items-center gap-4 transition-colors"
                    >
                      <Mail className="h-5 w-5 text-teal group-hover:text-electric" />
                      <span className="group-hover:text-white">info@leadnexa.ai</span>
                    </a>
                    <a
                      href="https://www.linkedin.com/company/leadnexa-ai/"
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-4 transition-colors"
                    >
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-[4px] bg-teal text-[11px] font-black leading-none text-ink group-hover:bg-electric">
                        in
                      </span>
                      <span className="group-hover:text-white">LeadNexa AI</span>
                    </a>
                  </div>
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
