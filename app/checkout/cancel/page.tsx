import Link from "next/link";

type CheckoutCancelPageProps = {
  searchParams?: {
    agents?: string;
  };
};

function parseAgents(value?: string): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 30) {
    return null;
  }
  return parsed;
}

export default function CheckoutCancelPage({ searchParams }: CheckoutCancelPageProps) {
  const agents = parseAgents(searchParams?.agents);
  const retryHref = agents ? `/?agents=${agents}#pricing` : "/#pricing";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.2),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(251,113,133,0.2),transparent_40%),linear-gradient(180deg,#020617_0%,#0b1120_45%,#111827_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center px-6 text-center">
        <div className="w-full rounded-3xl border border-white/15 bg-slate-900/60 p-10 shadow-[0_20px_80px_rgba(2,6,23,0.6)] backdrop-blur-md md:p-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-rose-300">
            Checkout Canceled
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-5xl">
            Payment was canceled.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-200/90 md:text-lg">
            No charge was made. You can restart checkout anytime when you are ready.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href={retryHref}
              className="rounded-xl bg-teal px-6 py-3 text-sm font-bold text-ink transition hover:opacity-90"
            >
              Try Checkout Again
            </Link>
            <Link
              href="/talk-to-our-team"
              className="rounded-xl border border-white/30 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-teal/40 hover:bg-white/10"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
