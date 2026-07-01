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
    const onScroll = () => setScrolled(window.scrollY > 20);
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
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full px-4 md:w-[90%] max-w-5xl transition-all duration-300">
      <nav
        className={`rounded-2xl transition-all duration-500 ${
          scrolled
            ? "glass border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl bg-[#1E293B]/60"
            : "bg-transparent border border-transparent"
        }`}
      >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display font-black text-xl tracking-tight"
        >
          <div className="w-8 h-8 rounded-xl bg-gradient-btn flex items-center justify-center glow-primary">
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <span className="gradient-text">FitGO</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                pathname === l.href
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Auth buttons & Lang */}
        <div className="hidden md:flex items-center gap-3">
          <LanguageSwitcher />
          {user ? (
            <button
              onClick={handleSignOut}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              {t("nav.logout")}
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link href="/register" className="btn-primary py-2.5! px-5! text-sm!">
                {t("nav.register")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden flex items-center gap-2">
          <LanguageSwitcher />
          <button
            className="text-text-secondary hover:text-text-primary transition-colors p-2"
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
        <div className="glass border-t border-white/5 px-6 pb-6 pt-4 flex flex-col gap-2">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between ${
                pathname === l.href
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {l.label}
              <ChevronRight size={14} className="opacity-40" />
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-white/5 pt-4">
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
