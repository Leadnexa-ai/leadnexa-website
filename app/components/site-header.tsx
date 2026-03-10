"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown, Menu, X } from "lucide-react";

type SiteHeaderProps = {
  anchorPrefix?: string;
  loginNext?: string;
  showIntegrations?: boolean;
};

type SessionType = "app" | "pending" | "internal_admin" | null;

export default function SiteHeader({
  anchorPrefix = "",
  loginNext = "/#pricing",
  showIntegrations = false
}: SiteHeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authResolved, setAuthResolved] = useState(false);
  const [companyName, setCompanyName] = useState<string>("");
  const [sessionType, setSessionType] = useState<SessionType>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const dashboardUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://app.leadnexa.ai").replace(/\/$/, "");
  const websiteDashboardPath = "/support/portal";

  const withPrefix = (hash: string) => `${anchorPrefix}${hash}`;
  const navLinks = [
    { label: "How it works", href: withPrefix("#how") },
    { label: "Case Studies", href: withPrefix("#case-studies") },
    { label: "Why AI Agents", href: withPrefix("#comparison") },
    ...(showIntegrations ? [{ label: "Integrations", href: withPrefix("#integrations") }] : []),
    { label: "Pricing", href: withPrefix("#pricing") }
  ];

  const dashboardDestination =
    sessionType === "internal_admin" ? websiteDashboardPath : `${dashboardUrl}/portal`;

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
          setSessionType(null);
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
        setSessionType(
          payload?.session_type === "app" ||
            payload?.session_type === "pending" ||
            payload?.session_type === "internal_admin"
            ? payload.session_type
            : null
        );
      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setCompanyName("");
          setSessionType(null);
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
      setSessionType(null);
      setIsAccountMenuOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to log out right now.";
      setAuthError(message);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-ink/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a href="/" className="flex shrink-0 items-center transition-opacity hover:opacity-90">
          <Image src="/logo.png" alt="LeadNexa logo" width={150} height={32} className="h-8 w-auto" priority />
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-white/60 lg:flex">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-teal">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 sm:flex">
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
                    <div className="absolute right-0 top-[calc(100%+8px)] z-50 min-w-[180px] rounded-xl border border-white/15 bg-slate-900/95 p-2 shadow-xl backdrop-blur">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          window.location.assign(dashboardDestination);
                        }}
                        className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        {sessionType === "internal_admin" ? "Client Access" : "Go to Dashboard"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountMenuOpen(false);
                          window.location.assign("/profile");
                        }}
                        className="mb-1 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Profile
                      </button>
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
                    href={`/login?next=${loginNext}`}
                    className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:border-teal/40 hover:bg-white/10"
                  >
                    Login
                  </a>
                  <a
                    href={`/register?next=${loginNext}`}
                    className="rounded-full border border-teal/40 bg-teal/10 px-4 py-2 text-sm font-semibold text-teal transition hover:bg-teal/20"
                  >
                    Register
                  </a>
                </>
              ))}
            <a
              href="/talk-to-our-team"
              className="rounded-full bg-teal px-5 py-2 text-sm font-bold text-ink shadow-glow transition hover:-translate-y-0.5"
            >
              Talk to Our Team
            </a>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute left-0 top-full w-full border-b border-white/10 bg-slate-900/95 backdrop-blur-xl lg:hidden"
          >
            <div className="flex flex-col gap-4 p-6">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-lg text-white/70"
                >
                  {link.label}
                </a>
              ))}

              <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
                {authResolved &&
                  (isAuthenticated ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.assign(dashboardDestination);
                        }}
                        className="rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-teal/40 hover:bg-white/10"
                      >
                        {sessionType === "internal_admin" ? "Client Access" : "Go to Dashboard"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          window.location.assign("/profile");
                        }}
                        className="rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-teal/40 hover:bg-white/10"
                      >
                        Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          void handleLogout();
                        }}
                        disabled={isLoggingOut}
                        className="rounded-full border border-white/20 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:border-teal/40 hover:bg-white/10 disabled:opacity-60"
                      >
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </>
                  ) : (
                    <>
                      <a
                        href={`/login?next=${loginNext}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="rounded-full border border-white/20 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition hover:border-teal/40 hover:bg-white/10"
                      >
                        Login
                      </a>
                      <a
                        href={`/register?next=${loginNext}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="rounded-full border border-teal/40 bg-teal/10 px-4 py-3 text-center text-sm font-semibold text-teal transition hover:bg-teal/20"
                      >
                        Register
                      </a>
                    </>
                  ))}
                <a
                  href="/talk-to-our-team"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-full bg-teal px-4 py-3 text-center text-sm font-bold text-ink shadow-glow transition hover:-translate-y-0.5"
                >
                  Talk to Our Team
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {authError && (
        <div className="mx-auto max-w-7xl px-6 pb-3">
          <p className="text-right text-xs text-rose-300">{authError}</p>
        </div>
      )}
    </header>
  );
}
