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
  Zap,
  Globe,
  BarChart3,
  MessageSquare,
  Lock
} from "lucide-react";

// --- Data Definitions ---

const valueProps = [
  {
    title: "Zero Hiring Needed",
    description: "Replace high-cost SDR teams without the overhead of salaries, benefits, or turnover.",
    icon: Users,
    size: "col-span-1 md:col-span-1"
  },
  {
    title: "Predictable Lead Flow",
    description: "Our AI agents work 24/7 to ensure your sales pipeline is always filled with high-quality leads.",
    icon: TrendingUp,
    size: "col-span-1 md:col-span-1"
  },
  {
    title: "Infinite Scalability",
    description: "Scale from 5 to 100+ AI sales reps instantly based on your business demand.",
    icon: Zap,
    size: "col-span-1 md:col-span-1"
  },
  {
    title: "B2B Native Intelligence",
    description: "Built for Email + LinkedIn decision-makers, understanding the nuances of professional outreach.",
    icon: ShieldCheck,
    size: "col-span-1 md:col-span-1"
  }
];

const steps = [
  {
    title: "30-Min Kickoff Meeting",
    description: "We align on your business goals, Ideal Customer Profile (ICP), and unique value proposition."
  },
  {
    title: "Deploy AI Sales Reps",
    description: "Our AI automatically starts daily Cold Emailing and LinkedIn personalized outreach."
  },
  {
    title: "Autopilot Meeting Booking",
    description: "Qualified prospects are guided by AI to book directly into your Google or Outlook calendar."
  },
  {
    title: "Scale on Demand",
    description: "We monitor performance, optimize scripts, and add more execution seats as you grow."
  }
];

const results = [
  { value: "24/7", label: "Outbound Execution" },
  { value: "18%", label: "Average Reply Rate" },
  { value: "12k+", label: "Meetings Booked" },
  { value: "95%", label: "Inbox Deliverability" }
];

const pricingServices = [
  "5 AI Sales Representative Seats",
  "2,000 Cold Emails Sent Daily",
  "Automated LinkedIn Outreach",
  "Custom ICP & Messaging Strategy",
  "Automated Calendar Booking",
  "Weekly Performance Insights",
  "Dedicated Success Manager"
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
      Trusted by World-Class Revenue Teams
    </p>
    <div className="flex w-max">
      <div className="flex animate-marquee space-x-16 items-center px-8">
        {["ACME CORP", "NIMBUS AI", "IRONFORGE", "VERTEX", "STARK IND", "GLOBAL TECH", "QUANTUM"].map((logo) => (
          <span key={logo} className="text-2xl font-bold text-white/20 hover:text-white/40 transition-colors cursor-default">
            {logo}
          </span>
        ))}
      </div>
      <div className="flex animate-marquee space-x-16 items-center px-8">
        {["ACME CORP", "NIMBUS AI", "IRONFORGE", "VERTEX", "STARK IND", "GLOBAL TECH", "QUANTUM"].map((logo) => (
          <span key={logo + "_clone"} className="text-2xl font-bold text-white/20 hover:text-white/40 transition-colors cursor-default">
            {logo}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const UIMockup = () => (
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
            <div className="ml-4 h-6 w-32 bg-white/5 rounded-full"></div>
          </div>
          <div className="px-3 py-1 rounded-full bg-teal/10 border border-teal/20 text-[10px] text-teal animate-pulse">
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
                <div className="h-3 w-24 bg-white/10 rounded mb-2"></div>
                <div className="h-2 w-16 bg-white/5 rounded"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-white">1,240</div>
              <div className="text-[10px] text-white/40">SENT TODAY</div>
            </div>
          </div>
          
          <div className="glass-panel p-4 rounded-xl border-teal/20 bg-teal/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal/20 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-teal" />
              </div>
              <div>
                <div className="h-3 w-32 bg-white/20 rounded mb-2"></div>
                <div className="h-2 w-20 bg-white/10 rounded"></div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-teal">24%</div>
              <div className="text-[10px] text-teal/50">REPLY RATE</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="glass-panel p-4 rounded-xl border-white/5 text-center">
              <div className="text-xs text-white/40 mb-1">BOOKED</div>
              <div className="text-xl font-bold text-white">42</div>
            </div>
            <div className="glass-panel p-4 rounded-xl border-white/5 text-center">
              <div className="text-xs text-white/40 mb-1">REVENUE</div>
              <div className="text-xl font-bold text-electric">$12.5k</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false);
  const baseTotal = 3500;

  const handleCheckout = async () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <div className="min-h-screen page-shell">
      <div className="relative z-10">
        {/* Background Glows */}
        <div className="pointer-events-none absolute -top-48 right-10 h-[40rem] w-[40rem] rounded-full bg-electric/10 blur-[180px]" />
        <div className="pointer-events-none absolute top-32 -left-32 h-96 w-96 rounded-full bg-teal/10 blur-[160px]" />

        <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-2.5 text-xl font-bold tracking-tight text-white">
              <div className="bg-teal p-1.5 rounded-lg">
                <Sparkles className="h-5 w-5 text-ink" />
              </div>
              Leadnexa.Ai
            </div>
            <nav className="hidden items-center gap-10 text-sm font-medium text-white/60 md:flex">
              <a href="#how" className="hover:text-teal transition-colors">How it works</a>
              <a href="#solutions" className="hover:text-teal transition-colors">Solutions</a>
              <a href="#pricing" className="hover:text-teal transition-colors">Pricing</a>
            </nav>
            <div className="flex items-center gap-4">
              <a href="#pricing" className="rounded-full bg-white/5 border border-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10">
                Log in
              </a>
              <a href="#pricing" className="rounded-full bg-teal px-6 py-2.5 text-sm font-bold text-ink shadow-glow transition hover:-translate-y-0.5">
                Book a Demo
              </a>
            </div>
          </div>
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
                The 2026 Sales Infrastructure
              </div>
              <h1 className="text-6xl font-bold leading-[1.05] tracking-tighter text-white lg:text-8xl">
                Make AI Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal to-electric">#1 Sales Rep</span>
              </h1>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-white/60 md:text-xl">
                Beyond simple automation. We deploy 24/7 AI agents that master Cold Email and LinkedIn to book high-ticket B2B meetings on your behalf.
              </p>
              <div className="mt-12 flex flex-wrap gap-5">
                <a href="#pricing" className="group inline-flex items-center gap-2 rounded-full bg-teal px-8 py-4 text-base font-bold text-ink shadow-glow transition hover:-translate-y-1">
                  Start Your Free Trial
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <div className="flex -space-x-3 items-center ml-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-ink bg-navy flex items-center justify-center overflow-hidden">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
                    </div>
                  ))}
                  <div className="pl-6 text-sm text-white/50 font-medium">
                    Joined by <span className="text-white font-bold">500+</span> teams
                  </div>
                </div>
              </div>
            </div>
            <UIMockup />
          </motion.section>

          <TrustedLogos />

          {/* Bento Grid: Why Us */}
          <motion.section {...motionProps} className="mx-auto max-w-7xl px-6 py-32" id="why">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Reinvent Your Outbound</h2>
              <p className="mt-4 text-white/50 text-lg">Ditch expensive hiring and unpredictable performance.</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {valueProps.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className={`${item.size} glass-panel rounded-[32px] p-10 hover:border-teal/30 transition-all duration-500 group`}>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-teal/10 transition-colors">
                      <Icon className="h-6 w-6 text-teal" />
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-white">{item.title}</h3>
                    <p className="mt-4 text-white/50 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Solutions Section */}
          <motion.section {...motionProps} className="mx-auto max-w-7xl px-6 pb-32" id="solutions">
            <div className="mb-16 text-center">
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Solutions That Fit Your GTM</h2>
              <p className="mt-4 text-white/50 text-lg">
                Choose a deployment model that matches your sales motion and scale with confidence.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  title: "Pipeline Accelerator",
                  description: "Rapidly fill the top of funnel with ICP-matched prospects and daily outreach velocity.",
                  icon: BarChart3
                },
                {
                  title: "Account Expansion",
                  description: "Multi-thread key accounts with tailored sequences across email and LinkedIn.",
                  icon: Users
                },
                {
                  title: "Founder-Led to Team-Led",
                  description: "Codify winning founder messaging and let AI scale it into a repeatable motion.",
                  icon: Sparkles
                }
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="glass-panel rounded-[32px] p-10 hover:border-teal/30 transition-all duration-500 group">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-teal/10 transition-colors">
                      <Icon className="h-6 w-6 text-teal" />
                    </div>
                    <h3 className="mt-8 text-2xl font-bold text-white">{item.title}</h3>
                    <p className="mt-4 text-white/50 leading-relaxed">{item.description}</p>
                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-teal">
                      Learn more <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.section>

          {/* Process Section */}
          <motion.section {...motionProps} className="mx-auto max-w-7xl px-6 py-32 bg-white/[0.02] rounded-[48px] border border-white/5" id="how">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div>
                <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Zero to Meeting in 4 Steps</h2>
                <p className="mt-6 text-white/60 text-lg leading-relaxed">
                  Our AI agents don't just send messages. They learn your product, identify intent, and handle the back-and-forth scheduling.
                </p>
                <div className="mt-10 space-y-8">
                  {steps.map((step, i) => (
                    <div key={step.title} className="flex gap-6">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full border border-teal/30 bg-teal/5 flex items-center justify-center text-teal font-bold text-sm">
                        0{i+1}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white">{step.title}</h4>
                        <p className="mt-2 text-white/40 text-sm leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-teal/20 blur-[100px] rounded-full"></div>
                <div className="relative glass-panel rounded-[40px] p-12 aspect-square flex items-center justify-center border-white/10">
                  <div className="grid grid-cols-2 gap-6 w-full">
                    {[Globe, Lock, BarChart3, Mail].map((Icon, i) => (
                      <div key={i} className="aspect-square rounded-3xl bg-white/5 flex flex-col items-center justify-center p-6 border border-white/5 hover:bg-white/10 transition-colors">
                        <Icon className="h-8 w-8 text-teal mb-4" />
                        <div className="h-2 w-12 bg-white/10 rounded"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Results Stats */}
          <motion.section {...motionProps} className="mx-auto max-w-7xl px-6 py-32">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {results.map((result) => (
                <div key={result.label} className="glass-panel rounded-3xl p-10 text-center hover:bg-white/5 transition-colors border-white/5">
                  <div className="text-5xl font-bold text-teal mb-4">{result.value}</div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">{result.label}</p>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Pricing Section */}
          <motion.section {...motionProps} className="mx-auto max-w-7xl px-6 py-32 text-center" id="pricing">
            <div className="max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl font-bold tracking-tight text-white md:text-5xl">Simple, Transparent Pricing</h2>
              <p className="mt-6 text-white/50 text-lg">No long-term contracts. Scale your sales force as you grow.</p>
            </div>
            
            <div className="glass-panel relative inline-block text-left max-w-2xl w-full rounded-[48px] border-teal/30 p-12 shadow-glow overflow-hidden">
               <div className="absolute top-0 right-0 bg-teal px-8 py-2 rounded-bl-3xl text-ink text-xs font-black uppercase tracking-widest">
                MOST POPULAR
              </div>
              <div className="flex items-center gap-4 text-teal mb-8">
                <ShieldCheck className="h-8 w-8" />
                <span className="text-2xl font-bold uppercase tracking-tight">Standard Enterprise</span>
              </div>
              <div className="flex items-end gap-3 mb-10">
                <span className="text-7xl font-bold text-white tracking-tighter">${baseTotal}</span>
                <span className="pb-2 text-white/40 font-medium">/ month</span>
              </div>
              <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 mb-12">
                {pricingServices.map((service) => (
                  <div key={service} className="flex items-start gap-3">
                    <div className="mt-1 bg-teal/20 p-0.5 rounded-full">
                      <Check className="h-3.5 w-3.5 text-teal" />
                    </div>
                    <span className="text-sm text-white/70 font-medium leading-relaxed">{service}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full rounded-2xl bg-teal py-5 text-lg font-black text-ink shadow-glow transition hover:-translate-y-1 active:translate-y-0 disabled:opacity-50"
              >
                {isLoading ? "Redirecting..." : "Start 14-Day Free Trial"}
              </button>
              <p className="text-center mt-6 text-white/30 text-xs font-medium uppercase tracking-widest">
                No Credit Card Required · Cancel Anytime · Deploy Instantly
              </p>
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
                  Leadnexa.Ai
                </div>
                <p className="text-white/40 text-sm leading-relaxed">
                  Driving B2B scale through AI-powered multi-channel outbound infrastructure.
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-16">
                <div>
                  <h5 className="text-white font-bold mb-6">Product</h5>
                  <ul className="space-y-4 text-sm text-white/40">
                    <li><a href="#how" className="hover:text-teal transition-colors">How it works</a></li>
                    <li><a href="#pricing" className="hover:text-teal transition-colors">Pricing</a></li>
                    <li><a href="#" className="hover:text-teal transition-colors">API Docs</a></li>
                  </ul>
                </div>
                <div>
                  <h5 className="text-white font-bold mb-6">Company</h5>
                  <ul className="space-y-4 text-sm text-white/40">
                    <li><a href="#" className="hover:text-teal transition-colors">About</a></li>
                    <li><a href="#" className="hover:text-teal transition-colors">Careers</a></li>
                    <li><a href="#" className="hover:text-teal transition-colors">Contact</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-white/30 uppercase tracking-[0.2em] font-bold">
              <p>© 2026 Leadnexa.Ai Inc. All rights reserved.</p>
              <div className="flex gap-8">
                <a href="/privacy" className="hover:text-white">Privacy Policy</a>
                <a href="/terms" className="hover:text-white">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
