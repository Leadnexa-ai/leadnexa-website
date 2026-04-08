"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ProfileResponse = {
  email?: string | null;
  account_name?: string | null;
  subscription?: {
    is_subscribed?: boolean;
    status?: string | null;
    agents?: number | null;
    price_id?: string | null;
    current_period_end?: string | null;
    cancel_at_period_end?: boolean | null;
  };
};

type SubscriptionState = {
  isSubscribed: boolean;
  status: string | null;
  agents: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

function getSubscriptionText(subscription: SubscriptionState | null): string {
  if (!subscription || subscription.status === "pending") {
    return "Pending - complete checkout to activate";
  }
  if (subscription.isSubscribed) {
    const agents = typeof subscription.agents === "number" ? `${subscription.agents} agents` : "Active";
    if (subscription.cancelAtPeriodEnd) {
      return `${agents} (${subscription.status ?? "active"}, cancellation scheduled)`;
    }
    return `${agents} (${subscription.status ?? "active"})`;
  }
  if (subscription.status) {
    return `Inactive (${subscription.status})`;
  }
  return "No active subscription";
}

export default function ProfilePage() {
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [subscriptionText, setSubscriptionText] = useState("Pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      try {
        const response = await fetch("/api/account/profile", { method: "GET" });
        const payload = (await response.json().catch(() => ({}))) as ProfileResponse;
        if (!response.ok) {
          throw new Error("Unable to load profile.");
        }
        if (mounted) {
          setAccountName(String(payload.account_name ?? ""));
          setEmail(String(payload.email ?? ""));
          const nextSubscription: SubscriptionState = {
            isSubscribed: Boolean(payload.subscription?.is_subscribed),
            status: payload.subscription?.status ? String(payload.subscription.status) : null,
            agents:
              typeof payload.subscription?.agents === "number" ? payload.subscription.agents : null,
            currentPeriodEnd: payload.subscription?.current_period_end
              ? String(payload.subscription.current_period_end)
              : null,
            cancelAtPeriodEnd: Boolean(payload.subscription?.cancel_at_period_end)
          };
          setSubscription(nextSubscription);
          setSubscriptionText(getSubscriptionText(nextSubscription));
        }
      } catch (loadError) {
        if (mounted) {
          const message = loadError instanceof Error ? loadError.message : "Unable to load profile.";
          setError(message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };
    void loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const onSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountName })
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        account_name?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update account name.");
      }
      setAccountName(String(payload.account_name ?? accountName));
      setSuccess("Account name updated.");
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Unable to update account name.";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const onCancelSubscription = async () => {
    if (isCancelling || !subscription?.isSubscribed || subscription.cancelAtPeriodEnd) {
      return;
    }

    const confirmed = window.confirm(
      "Cancel subscription at the end of the current billing period?"
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccess(null);
    setIsCancelling(true);
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        status?: string;
        cancel_at_period_end?: boolean;
        current_period_end?: string | null;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to cancel subscription.");
      }

      const nextSubscription: SubscriptionState = {
        isSubscribed: subscription.isSubscribed,
        status: payload.status ? String(payload.status) : subscription.status,
        agents: subscription.agents,
        currentPeriodEnd: payload.current_period_end
          ? String(payload.current_period_end)
          : subscription.currentPeriodEnd,
        cancelAtPeriodEnd: Boolean(payload.cancel_at_period_end)
      };
      setSubscription(nextSubscription);
      setSubscriptionText(getSubscriptionText(nextSubscription));
      setSuccess("Subscription cancellation is scheduled for period end.");
    } catch (cancelError) {
      const message = cancelError instanceof Error ? cancelError.message : "Unable to cancel subscription.";
      setError(message);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.2),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.18),transparent_40%),linear-gradient(180deg,#020617_0%,#0b1120_45%,#111827_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-6">
        <form
          onSubmit={onSave}
          className="w-full rounded-3xl border border-white/15 bg-slate-900/60 p-8 shadow-[0_20px_80px_rgba(2,6,23,0.6)] backdrop-blur-md"
        >
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Settings</p>
              <h1 className="mt-2 text-3xl font-bold">Profile</h1>
            </div>
            <Link
              href="/"
              className="mt-1 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-teal/40 hover:bg-white/10 hover:text-white"
            >
              Back
            </Link>
          </div>

          <p className="mt-2 text-sm text-slate-300">View your account details and update your account name.</p>

          <div className="mt-6 space-y-3 rounded-xl border border-white/15 bg-slate-950/50 p-4">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Current Account Name</p>
              <p className="mt-1 text-sm font-semibold text-white">{accountName || "Not set"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Email</p>
              <p className="mt-1 text-sm font-semibold text-white">{email || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Subscription</p>
              <p className="mt-1 text-sm font-semibold text-white">{subscriptionText}</p>
              {subscription?.isSubscribed && subscription.cancelAtPeriodEnd && (
                <p className="mt-2 text-xs text-amber-300">
                  Cancellation will take effect at the end of your current period.
                </p>
              )}
            </div>
          </div>

          <label className="mt-6 block text-left text-sm font-medium text-slate-200">Account name</label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={80}
            value={accountName}
            onChange={(event) => setAccountName(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-teal/50"
            disabled={isLoading || isSaving}
          />

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-300">{success}</p>}

          {subscription?.isSubscribed && !subscription.cancelAtPeriodEnd && (
            <button
              type="button"
              onClick={onCancelSubscription}
              disabled={isLoading || isSaving || isCancelling}
              className="mt-6 w-full rounded-xl border border-rose-400/40 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20 disabled:opacity-60"
            >
              {isCancelling ? "Cancelling..." : "Cancel Subscription"}
            </button>
          )}

          <button
            type="submit"
            disabled={isLoading || isSaving || isCancelling}
            className="mt-6 w-full rounded-xl bg-teal px-5 py-3 text-sm font-bold text-ink transition hover:opacity-90 disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>

          <Link
            href="/lead-search"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Open Target Market Snapshot
          </Link>
        </form>
      </div>
    </main>
  );
}
