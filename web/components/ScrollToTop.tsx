"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Volver arriba"
      className="fixed bottom-20 md:bottom-8 right-6 z-40 w-11 h-11 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 transform hover:scale-110 active:scale-95 border border-white/15 backdrop-blur-md animate-in fade-in zoom-in-75"
      style={{
        background: "linear-gradient(135deg, rgba(139,92,246,0.85), rgba(6,182,212,0.85))",
        boxShadow: "0 8px 24px rgba(139,92,246,0.45)",
      }}
    >
      <ArrowUp size={20} className="stroke-[2.5]" />
    </button>
  );
}
