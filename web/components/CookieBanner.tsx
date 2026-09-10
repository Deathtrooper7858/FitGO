"use client";

import { useState, useEffect } from "react";
import { Link } from "@/i18n/routing";
import { ShieldCheck, Cookie, X } from "lucide-react";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("fitgo_cookie_consent");
      if (!consent) {
        const timer = setTimeout(() => setShow(true), 50);
        return () => clearTimeout(timer);
      }
    } catch {
      // Fallback if localStorage is disabled
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem("fitgo_cookie_consent", "all");
    } catch {}
    setShow(false);
  };

  const handleEssential = () => {
    try {
      localStorage.setItem("fitgo_cookie_consent", "essential");
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <aside
      aria-label="Consentimiento de cookies"
      className="fixed bottom-4 left-4 right-4 md:left-8 md:right-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div
        className="p-5 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl relative"
        style={{
          background: "linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(10,15,30,0.96) 100%)",
          boxShadow: "0 10px 35px -5px rgba(0,0,0,0.6), 0 0 20px rgba(139,92,246,0.15)",
        }}
      >
        <button
          onClick={handleEssential}
          className="absolute top-3 right-3 text-text-muted hover:text-white transition-colors p-1"
          aria-label="Cerrar aviso de cookies"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3.5 mb-3.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.3), rgba(6,182,212,0.2))" }}
          >
            <Cookie size={19} className="text-[#a78bfa]" />
          </div>
          <div>
            <h2 className="text-white text-sm font-bold flex items-center gap-1.5">
              Valoramos tu privacidad
              <ShieldCheck size={14} className="text-[#10B981]" />
            </h2>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Utilizamos cookies técnicas y analíticas para optimizar tu experiencia, asegurar tu sesión y mejorar FitGO. Consulta nuestra{" "}
              <Link href="/privacy" className="text-primary hover:underline font-semibold">
                Política de Privacidad
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 px-3.5 rounded-xl text-xs font-bold text-white transition-all transform active:scale-95 shadow-md"
            style={{
              background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
            }}
          >
            Aceptar todas
          </button>
          <button
            onClick={handleEssential}
            className="py-2 px-3.5 rounded-xl text-xs font-semibold text-text-muted hover:text-white border border-white/10 hover:border-white/20 transition-colors"
          >
            Solo esenciales
          </button>
        </div>
      </div>
    </aside>
  );
}
