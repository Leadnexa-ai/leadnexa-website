import Link from "next/link";

type SuccessPageProps = {
  searchParams?: {
    session_id?: string;
  };
};

export default function SuccessPage({ searchParams }: SuccessPageProps) {
  const sessionId = searchParams?.session_id;

  return (
    <main className="min-h-screen bg-ink text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center">
        <div className="rounded-3xl border border-teal/30 bg-white/[0.03] p-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-teal">
            Payment Successful
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Thanks, your subscription is active.
          </h1>
          <p className="mt-4 text-sm text-white/70 md:text-base">
            We received your payment and are preparing your AI agent setup.
          </p>
          {sessionId && (
            <p className="mt-4 break-all text-xs text-white/40">Session: {sessionId}</p>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="rounded-xl bg-teal px-5 py-3 text-sm font-bold text-ink transition hover:opacity-90"
            >
              Back to Home
            </Link>
            <Link
              href="/talk-to-our-team"
              className="rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-teal/40"
            >
              Talk to Our Team
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
