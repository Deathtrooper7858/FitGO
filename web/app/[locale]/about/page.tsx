import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Scale,
  Apple,
  Dumbbell,
  Bot,
  Trophy,
  Flame,
  Scan,
  TrendingUp,
  Target,
  Layers,
  Swords,
  Medal,
  ChevronRight,
} from "lucide-react";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "La App",
  description:
    "Descubre todas las funcionalidades de FitGO: progreso, nutrición, entrenamientos y coach con IA. Tu gimnasio en tu bolsillo.",
};

const pillarsIcons = {
  progreso: Scale,
  nutricion: Apple,
  entrenamiento: Dumbbell,
  coach: Bot,
  social: Trophy,
};

const pillarsFeaturesIcons = {
  progreso: [TrendingUp, Target, Layers, Medal],
  nutricion: [Scan, Apple, Target, Flame],
  entrenamiento: [Dumbbell, Layers, TrendingUp, Target],
  coach: [Bot, TrendingUp, Target, Flame],
  social: [Swords, Trophy, Medal, TrendingUp]
};

const getPillarColor = (id: string) => {
  const colors: Record<string, string> = {
    progreso: "#8B5CF6",
    nutricion: "#F43F5E",
    entrenamiento: "#06B6D4",
    coach: "#10B981",
    social: "#F59E0B"
  };
  return colors[id] || "#8B5CF6";
};

const getPillarGlow = (id: string) => {
  const glows: Record<string, string> = {
    progreso: "rgba(139,92,246,0.3)",
    nutricion: "rgba(244,63,94,0.3)",
    entrenamiento: "rgba(6,182,212,0.3)",
    coach: "rgba(16,185,129,0.3)",
    social: "rgba(245,158,11,0.3)"
  };
  return glows[id] || "rgba(139,92,246,0.3)";
};

export default function AboutPage() {
  const t = useTranslations("aboutApp");
  const tp = useTranslations("aboutApp.pillars");
  
  const pillarsKeys = ["progreso", "nutricion", "entrenamiento", "coach", "social"];

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-48 pb-24 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          <span className="section-label mb-4 inline-block">{t("hero.label")}</span>
          <h1 className="font-display font-black text-5xl md:text-7xl text-text-primary mt-2 mb-8 leading-tight">
            {t("hero.title1")} <br className="hidden md:block" />
            <span className="gradient-text">{t("hero.title2")}</span>
          </h1>
          <p className="text-text-secondary text-xl md:text-2xl leading-relaxed font-medium max-w-2xl mx-auto">
            {t("hero.desc")}
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="pb-32 px-6">
        <div className="max-w-6xl mx-auto space-y-32 md:space-y-48">
          {pillarsKeys.map((pKey, i) => {
            const Icon = pillarsIcons[pKey as keyof typeof pillarsIcons];
            const color = getPillarColor(pKey);
            const glow = getPillarGlow(pKey);
            
            return (
            <div
              key={pKey}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center group"
            >
              {/* Text */}
              <div className={`order-2 ${i % 2 === 0 ? "lg:order-1" : "lg:order-2"} flex flex-col items-start`}>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold uppercase tracking-wider transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: `${color}15`,
                    border: `1px solid ${color}40`,
                    color: color,
                  }}
                >
                  <Icon size={14} />
                  {tp(`${pKey}.subtitle`)}
                </div>
                <h2 className="font-display font-black text-4xl md:text-5xl text-text-primary mb-5">
                  {tp(`${pKey}.title`)}
                </h2>
                <p className="text-text-secondary text-lg md:text-xl leading-relaxed mb-10">
                  {tp(`${pKey}.desc`)}
                </p>
                <ul className="space-y-4 w-full">
                  {pillarsFeaturesIcons[pKey as keyof typeof pillarsFeaturesIcons].map((FeatIcon, idx) => (
                    <li key={idx} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                        style={{
                          background: `${color}20`,
                          border: `1px solid ${color}40`,
                          boxShadow: `0 4px 20px ${color}20`,
                        }}
                      >
                        <FeatIcon size={18} style={{ color: color }} />
                      </div>
                      <span className="text-text-primary text-[15px] font-medium">
                        {tp(`${pKey}.features.${idx}`)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual card */}
              <div className={`relative order-1 ${i % 2 === 0 ? "lg:order-2" : "lg:order-1"} w-full`}>
                <div
                  className="absolute inset-0 rounded-[3rem] blur-[80px] opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                  style={{ background: color }}
                />
                <div
                  className="relative glass rounded-5xl p-10 md:p-14 flex flex-col items-center justify-center min-h-87.5 md:min-h-112.5 transition-all duration-500 hover:-translate-y-2"
                  style={{
                    boxShadow: `0 25px 80px ${glow}`,
                    border: `1px solid ${color}30`,
                    background: `linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 100%)`,
                  }}
                >
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 animate-float"
                    style={{
                      background: `radial-gradient(circle, ${glow}, ${color}20)`,
                      boxShadow: `0 0 40px ${glow}, inset 0 0 20px rgba(255,255,255,0.1)`,
                      border: `1px solid ${color}50`,
                    }}
                  >
                    <Icon size={44} style={{ color: color }} />
                  </div>
                  <h3
                    className="font-display font-black text-3xl md:text-4xl mb-3 text-center"
                    style={{ color: color, textShadow: `0 2px 20px ${glow}` }}
                  >
                    {tp(`${pKey}.title`)}
                  </h3>
                  <p className="text-text-muted text-base font-medium text-center max-w-xs">
                    {tp(`${pKey}.subtitle`)}
                  </p>
                </div>
              </div>
            </div>
            )})}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center glass rounded-3xl p-12">
          <h2 className="font-display font-black text-4xl text-text-primary mb-4">
            {t("cta.title")}
          </h2>
          <p className="text-text-secondary mb-8">
            {t("cta.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary">
              {t("cta.start")} <ChevronRight size={18} />
            </Link>
            <Link href="/pricing" className="btn-secondary">
              {t("cta.pro")}
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
