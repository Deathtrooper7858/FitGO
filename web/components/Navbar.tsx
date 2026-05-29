"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase";

import { User } from "@supabase/supabase-js";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/about", label: "La App" },
  { href: "/about-us", label: "Nosotros" },
  { href: "/pricing", label: "Premium" },
];

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

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <button
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
            >
              Cerrar sesión
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-text-secondary hover:text-text-primary transition-colors"
              >
                Iniciar sesión
              </Link>
              <Link href="/register" className="btn-primary py-2.5! px-5! text-sm!">
                Comenzar gratis
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-text-secondary hover:text-text-primary transition-colors"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden glass border-t border-white/5 px-6 pb-6 pt-4 flex flex-col gap-2">
          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                pathname === l.href
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <div className="mt-2 flex flex-col gap-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="btn-secondary py-3! text-sm! justify-center"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="btn-primary py-3! text-sm! justify-center"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      )}
      </nav>
    </div>
  );
}
