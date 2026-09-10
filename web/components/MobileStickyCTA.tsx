"use client";

import { Link } from "@/i18n/routing";
import { Zap, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

export function MobileStickyCTA() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky CTA after scrolling past the hero (250px)
      setScrolled(window.scrollY > 250);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!scrolled) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 p-3 backdrop-blur-xl border-t border-white/10 animate-in slide-in-from-bottom-3 duration-300"
      style={{
        background: "linear-gradient(180deg, rgba(8,12,24,0.88) 0%, rgba(5,8,15,0.98) 100%)",
        boxShadow: "0 -8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <div className="flex items-center justify-between gap-3 max-w-md mx-auto">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
            }}
          >
            <Zap size={16} className="text-white" fill="white" />
          </div>
          <div>
            <div className="text-white text-xs font-black tracking-wide">FitGO</div>
            <div className="text-[10px] text-text-muted">Tu mejor versión</div>
          </div>
        </div>

        <Link
          href="/register"
          className="flex items-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold text-white transition-transform active:scale-95 shadow-md"
          style={{
            background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
            boxShadow: "0 2px 10px rgba(139,92,246,0.4)",
          }}
        >
          <span>Empezar Gratis</span>
          <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
