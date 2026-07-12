"use client";

import { useState, useEffect, useCallback } from "react";
import { Link, usePathname } from "@/i18n/routing";
import { Menu, X, Zap, LogOut, ChevronRight } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { createClient } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { useTranslations } from "next-intl";

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) =>
      setUser(s?.user ?? null)
    );
    return () => listener.subscription.unsubscribe();
  }, [supabase.auth]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflow = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [open]);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    setOpen(false);
  }, [supabase.auth]);

  const t = useTranslations();
  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/about", label: t("nav.app") },
    { href: "/about-us", label: t("nav.about") },
    { href: "/ranking", label: t("nav.ranking") },
    { href: "/squads-ranking", label: t("nav.squadsRanking") },
    { href: "/pricing", label: t("nav.premium") },
  ];

  return (
    <div suppressHydrationWarning className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full px-4 md:w-[92%] max-w-5xl transition-all duration-500">
      <nav
        className="rounded-2xl transition-all duration-500"
        style={
          scrolled
            ? {
                background: "rgba(8, 12, 24, 0.85)",
                backdropFilter: "blur(24px)",
                WebkitBackdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.07)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.08)",
              }
            : {
                background: "transparent",
                border: "1px solid transparent",
              }
        }
      >
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 font-display font-black text-xl tracking-tight group"
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #7C3AED, #06B6D4)",
                boxShadow: "0 4px 16px rgba(139,92,246,0.5)",
              }}
            >
              <Zap size={16} className="text-white" fill="white" />
            </div>
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              FitGO
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map((l) => {
              const isActive = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className="relative px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                  style={{
                    color: isActive ? "#a78bfa" : "#94a3b8",
                    background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.color = "#f8fafc";
                      (e.target as HTMLElement).style.background = "rgba(255,255,255,0.05)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      (e.target as HTMLElement).style.color = "#94a3b8";
                      (e.target as HTMLElement).style.background = "transparent";
                    }
                  }}
                >
                  {l.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "#8b5cf6" }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Auth buttons & Lang */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
              >
                <LogOut size={15} />
                {t("nav.logout")}
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors px-3 py-2 rounded-xl hover:bg-white/5"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/register"
                  className="btn-primary py-2.5! px-5! text-sm!"
                >
                  {t("nav.register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              className="text-text-secondary hover:text-text-primary transition-colors p-2 rounded-xl hover:bg-white/5"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            open ? "max-h-125 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div
            className="px-4 pb-5 pt-3 flex flex-col gap-1"
            style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
          >
            {navLinks.map((l) => {
              const isActive = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between"
                  style={{
                    color: isActive ? "#a78bfa" : "#94a3b8",
                    background: isActive ? "rgba(139,92,246,0.1)" : "transparent",
                  }}
                >
                  {l.label}
                  <ChevronRight size={14} style={{ opacity: 0.4 }} />
                </Link>
              );
            })}

            <div className="mt-3 flex flex-col gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "12px" }}>
              {user ? (
                <button
                  onClick={handleSignOut}
                  className="btn-secondary py-3! text-sm! justify-center gap-2"
                >
                  <LogOut size={16} />
                  {t("nav.logout")}
                </button>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="btn-secondary py-3! text-sm! justify-center"
                  >
                    {t("nav.login")}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn-primary py-3! text-sm! justify-center"
                  >
                    {t("nav.register")}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
