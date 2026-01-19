"use client";

import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const motionProps = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" },
  viewport: { once: true, amount: 0.2 }
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen page-shell">
      <div className="relative z-10">
        <div className="pointer-events-none absolute -top-40 right-12 h-72 w-72 rounded-full bg-electric/15 blur-[140px]" />
        <div className="pointer-events-none absolute top-28 -left-24 h-72 w-72 rounded-full bg-teal/20 blur-[140px]" />

        <header className="sticky top-0 z-40 border-b border-white/5 bg-ink/70 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
            <div className="flex items-center gap-3 text-lg font-semibold tracking-tight">
              <ShieldCheck className="h-5 w-5 text-teal" />
              AI Sales Executive
            </div>
            <a
              href="/"
              className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-white/80 transition hover:border-white/30 hover:text-white"
            >
              Back to Home
            </a>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-24">
          <motion.section {...motionProps} className="grid gap-12 lg:grid-cols-[1fr_0.35fr]">
            <article className="max-w-3xl space-y-10 text-white/70">
              <header className="space-y-4">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                  Privacy Policy
                </p>
                <h1 className="text-4xl font-semibold tracking-tight text-white">
                  How We Handle Your Data
                </h1>
                <p className="text-base">
                  We build AI Sales Executive to power outbound outreach while respecting your data.
                  This policy explains what we collect, how we use it, and the choices you have.
                </p>
              </header>

              <section className="space-y-4 border-t border-white/10 pt-8">
                <h2 className="text-2xl font-semibold text-white">Information we collect</h2>
                <p>
                  We collect account details, billing information, and configuration inputs you
                  provide (such as ICP, offers, and messaging guidelines). We also collect product
                  usage data to improve performance and reliability.
                </p>
              </section>

              <section className="space-y-4 border-t border-white/10 pt-8">
                <h2 className="text-2xl font-semibold text-white">How we use data</h2>
                <p>
                  We use data to deliver services, personalize outreach workflows, provide support,
                  and improve the platform. We do not sell your data to third parties.
                </p>
              </section>

              <section className="space-y-4 border-t border-white/10 pt-8">
                <h2 className="text-2xl font-semibold text-white">Data retention</h2>
                <p>
                  We retain data for as long as your account is active or as needed to comply with
                  legal and operational requirements. You can request deletion at any time.
                </p>
              </section>

              <section className="space-y-4 border-t border-white/10 pt-8">
                <h2 className="text-2xl font-semibold text-white">Your choices</h2>
                <p>
                  You can access, update, or delete your data by contacting us. If you have a data
                  processing request, we will respond within a reasonable timeframe.
                </p>
              </section>
            </article>

            <aside className="space-y-6 text-sm text-white/70 lg:pt-16">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Summary</p>
                <ul className="mt-4 space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-teal" />
                    We collect data you provide and usage data to run the service.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-teal" />
                    We use data for delivery, support, and product improvement.
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1 h-2 w-2 rounded-full bg-teal" />
                    You can request access, updates, or deletion.
                  </li>
                </ul>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <p className="text-xs uppercase tracking-[0.3em] text-white/50">Contact</p>
                <p className="mt-4">
                  Email us at{" "}
                  <a className="text-teal hover:text-teal/80" href="mailto:privacy@aisalesexec.com">
                    privacy@aisalesexec.com
                  </a>
                  .
                </p>
              </div>
            </aside>
          </motion.section>
        </main>
      </div>
    </div>
  );
}
