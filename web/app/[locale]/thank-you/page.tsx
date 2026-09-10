"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/routing";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  CheckCircle,
  Smartphone,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between selection:bg-primary/30">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 py-28 flex-1 w-full text-center">
        <Breadcrumbs items={[{ label: "Agradecimiento" }]} />

        {/* Success Icon with Glow */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-60"
            style={{ background: "radial-gradient(circle, #10B981 0%, transparent 70%)" }}
          />
          <div className="relative w-20 h-20 rounded-3xl bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center shadow-2xl animate-in zoom-in-75 duration-300">
            <CheckCircle size={44} />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-[#a78bfa] font-bold mb-4">
          <Sparkles size={14} />
          <span>¡Bienvenido a la comunidad FitGO!</span>
        </div>

        <h1 className="font-display font-black text-4xl md:text-5xl gradient-text mb-4">
          ¡Gracias por confiar en nosotros!
        </h1>
        <p className="text-text-secondary text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed">
          Tu cuenta ha sido confirmada y tienes acceso a todas las herramientas de fitness, nutrición y coach IA más avanzadas.
        </p>

        {/* Steps to get started */}
        <div
          className="p-8 rounded-3xl border border-white/10 shadow-2xl text-left mb-10 backdrop-blur-xl"
          style={{
            background: "linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(8,12,24,0.95) 100%)",
          }}
        >
          <h2 className="text-white text-lg font-bold mb-5 flex items-center gap-2">
            <Smartphone size={20} className="text-primary" />
            <span>Siguientes pasos para aprovechar FitGO:</span>
          </h2>

          <div className="space-y-4">
            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Descarga la app en tu teléfono</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Lleva tu registro de macros, entrenamientos y el Coach IA siempre en tu bolsillo.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-[#06B6D4]/20 text-[#06B6D4] flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Inicia sesión con tu cuenta</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Usa las mismas credenciales con las que te registraste. Tu progreso y suscripción se sincronizarán al instante.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-white/5 border border-white/5">
              <div className="w-7 h-7 rounded-lg bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Define tus metas y desafía a tu escuadrón</h3>
                <p className="text-xs text-text-muted mt-0.5">
                  Gana puntos de liga, compite en Guerras de Macros y alcanza tu mejor versión.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all transform hover:scale-105 active:scale-95 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)",
              boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
            }}
          >
            <span>Ir al Panel Principal</span>
            <ArrowRight size={16} />
          </Link>

          <Link
            href="/contact"
            className="w-full sm:w-auto py-3.5 px-8 rounded-xl font-semibold text-sm text-text-secondary hover:text-white bg-white/5 hover:bg-white/10 transition-colors border border-white/10 flex items-center justify-center"
          >
            <span>¿Necesitas ayuda? Contáctanos</span>
          </Link>
        </div>

        {/* Security reassurance */}
        <div className="mt-8 flex items-center justify-center gap-2 text-xs text-text-muted">
          <ShieldCheck size={15} className="text-[#10B981]" />
          <span>Garantía de satisfacción y soporte dedicado los 7 días de la semana</span>
        </div>
      </main>

      <Footer />
    </div>
  );
}
