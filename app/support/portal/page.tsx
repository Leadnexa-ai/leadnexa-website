import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getInternalAdminSessionFromCookie } from "../../../lib/auth-session";
import { listAccessibleClientsForInternalAdmin } from "../../../lib/internal-admin";

export const metadata: Metadata = {
  title: "Support Portal Access",
  description: "Select a client portal to access as an internal administrator.",
  robots: {
    index: false,
    follow: false
  }
};

type SupportPortalPageProps = {
  searchParams?: {
    next?: string;
    error?: string;
  };
};

function getDefaultPortalTarget(): string {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3001").trim().replace(/\/$/, "");
  return `${appUrl}/portal`;
}

function buildLoginRedirectTarget(next: string): string {
  return `/login?next=${encodeURIComponent(`/support/portal?next=${encodeURIComponent(next)}`)}`;
}

export default async function SupportPortalPage({ searchParams }: SupportPortalPageProps) {
  const next = String(searchParams?.next ?? getDefaultPortalTarget()).trim() || getDefaultPortalTarget();
  const error = String(searchParams?.error ?? "").trim();
  const session = getInternalAdminSessionFromCookie();

  if (!session || session.session_type !== "internal_admin") {
    redirect(buildLoginRedirectTarget(next));
  }

  const clients = await listAccessibleClientsForInternalAdmin({
    internalAdminUserId: session.internal_admin_user_id
  });

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Internal Access</p>
            <h1 className="mt-2 text-4xl font-bold">Choose a client portal</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Your internal admin session is active. Choose a client below and we will open their
              portal using the client&apos;s normal portal session.
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal/40 hover:bg-white/10"
            >
              Back to Website
            </Link>
            <Link
              href="/api/auth/logout?next=/"
              className="rounded-full border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20"
            >
              Logout
            </Link>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
            {error}
          </div>
        )}

        {clients.length === 0 ? (
          <div className="rounded-3xl border border-amber-300/20 bg-amber-400/10 p-8 text-amber-100">
            No clients are assigned to this internal admin yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {clients.map((client) => (
              <section
                key={client.clientId}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_20px_80px_rgba(2,6,23,0.45)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{client.clientName}</h2>
                    <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                      {client.clientStatus}
                    </p>
                  </div>
                  <div className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-200">
                    {client.appUserCount} app user{client.appUserCount === 1 ? "" : "s"}
                  </div>
                </div>

                <div className="mt-5 space-y-2 text-sm text-slate-300">
                  <p>
                    Subscription: {client.hasActiveSubscription ? "Active" : "Inactive or missing"}
                  </p>
                  <p>Workspace: {client.hasWorkspace ? "Configured" : "Not configured"}</p>
                  <p>
                    HeyReach workspace: {client.heyreachWorkspaceId ? client.heyreachWorkspaceId : "None"}
                  </p>
                </div>

                <form action="/api/support/portal/impersonate" method="post" className="mt-6">
                  <input type="hidden" name="clientId" value={client.clientId} />
                  <input type="hidden" name="next" value={next} />
                  <button
                    type="submit"
                    className="w-full rounded-2xl bg-teal px-4 py-3 text-sm font-bold text-slate-950 transition hover:opacity-90"
                  >
                    Enter Client Portal
                  </button>
                </form>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
