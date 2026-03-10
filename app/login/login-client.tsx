"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 2.8 14.7 2 12 2 6.9 2 2.8 6.2 2.8 11.3s4.1 9.3 9.2 9.3c5.3 0 8.8-3.8 8.8-9.1 0-.6-.1-1-.1-1.4H12z"
      />
      <path
        fill="#34A853"
        d="M2.8 11.3c0 1.6.4 3 1.2 4.3l3.4-2.6c-.2-.5-.4-1.1-.4-1.7s.1-1.2.4-1.7L4 7C3.2 8.3 2.8 9.7 2.8 11.3z"
      />
      <path
        fill="#4A90E2"
        d="M12 20.6c2.5 0 4.6-.8 6.1-2.2l-3-2.4c-.8.6-1.8 1-3.1 1-2.4 0-4.5-1.6-5.2-3.9L3.4 15.7c1.6 3 4.8 4.9 8.6 4.9z"
      />
      <path
        fill="#FBBC05"
        d="M6.8 13.1c-.2-.5-.4-1.1-.4-1.8s.1-1.2.4-1.8L3.4 7C2.6 8.3 2.2 9.7 2.2 11.3s.4 3 1.2 4.3l3.4-2.5z"
      />
    </svg>
  );
}

function getNextPath(): string {
  if (typeof window === "undefined") {
    return "/";
  }
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next) {
    return "/";
  }

  if (next.startsWith("/")) {
    return next;
  }

  try {
    const parsed = new URL(next);
    const allowList = new Set<string>([
      window.location.origin,
      process.env.NEXT_PUBLIC_APP_URL ?? "",
      ...(process.env.NEXT_PUBLIC_ALLOWED_REDIRECT_ORIGINS ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    ]);

    if (allowList.has(parsed.origin)) {
      return parsed.toString();
    }
  } catch {
    return "/";
  }

  return "/";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const verificationError = params.get("error");
    const verified = params.get("verified");
    if (verificationError) {
      setError(verificationError);
    } else if (verified === "1") {
      setInfo("Email verified. Please log in.");
    }
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) {
      return;
    }

    setError(null);
    setInfo(null);
    setIsLoading(true);
    try {
      const nextPath = getNextPath();
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, next: nextPath })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error ?? "Login failed.");
      }

      const destination =
        typeof payload?.redirect_to === "string" && payload.redirect_to.trim().length > 0
          ? payload.redirect_to
          : nextPath;
      router.push(destination);
      router.refresh();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Login failed.";
      setError(message);
      setIsLoading(false);
    }
  };

  const onGoogleLogin = () => {
    const nextPath = getNextPath();
    const target = `/api/auth/google/start?next=${encodeURIComponent(nextPath)}`;
    router.push(target);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(45,212,191,0.2),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.18),transparent_40%),linear-gradient(180deg,#020617_0%,#0b1120_45%,#111827_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:32px_32px]" />
      <div className="relative mx-auto flex min-h-screen max-w-md items-center px-6">
        <form
          onSubmit={onSubmit}
          className="w-full rounded-3xl border border-white/15 bg-slate-900/60 p-8 shadow-[0_20px_80px_rgba(2,6,23,0.6)] backdrop-blur-md"
        >
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Account Access</p>
              <h1 className="mt-2 text-3xl font-bold">Log in</h1>
            </div>
            <Link
              href="/"
              className="mt-1 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/85 transition hover:border-teal/40 hover:bg-white/10 hover:text-white"
            >
              Back to Home
            </Link>
          </div>
          <p className="mt-2 text-sm text-slate-300">Use your account email and password.</p>

          <label className="mt-6 block text-left text-sm font-medium text-slate-200">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-teal/50"
          />

          <label className="mt-4 block text-left text-sm font-medium text-slate-200">Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-teal/50"
          />

          {error && <p className="mt-4 text-sm text-rose-300">{error}</p>}
          {info && <p className="mt-4 text-sm text-emerald-300">{info}</p>}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-xl bg-teal px-5 py-3 text-sm font-bold text-ink transition hover:opacity-90 disabled:opacity-60"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>

          <button
            type="button"
            onClick={onGoogleLogin}
            disabled={isLoading}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60"
          >
            <GoogleLogo />
            Continue with Google
          </button>

          <p className="mt-5 text-sm text-slate-300">
            Need an account?{" "}
            <Link href="/register" className="font-semibold text-teal hover:opacity-90">
              Register
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
