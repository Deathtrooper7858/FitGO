import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import {
  Apple,
  Bot,
  BarChart3,
  Calendar,
  Zap,
  ShieldCheck,
  Scale,
  Dumbbell,
  Trophy,
  Flame,
  Star,
  ArrowRight,
  Download,
  Smartphone,
} from "lucide-react";

function HighlightedText({ text, className = "text-white" }: { text: string; className?: string }) {
  const parts = text.split(/(<highlight>|<\/highlight>)/g);
  const result: React.ReactNode[] = [];
  let highlighting = false;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === "<highlight>") { highlighting = true; continue; }
    if (part === "</highlight>") { highlighting = false; continue; }
    result.push(highlighting ? <span key={i} className={className}>{part}</span> : <React.Fragment key={i}>{part}</React.Fragment>);
  }
  return <>{result}</>;
}

const featurePills = [
  { icon: Apple, key: "nutrition", color: "#FF6B6B" },
  { icon: Bot, key: "coach", color: "#4ECDC4" },
  { icon: BarChart3, key: "progress", color: "#FFE66D" },
  { icon: Calendar, key: "planner", color: "#C7F464" },
  { icon: Zap, key: "wars", color: "#FF9F1C" },
  { icon: ShieldCheck, key: "leagues", color: "#8B5CF6" },
];

const features = [
  {
    icon: Scale,
    key: "progress",
    gradient: "from-primary/20 to-primary-dark/10",
    glow: "rgba(139,92,246,0.3)",
    hasBadge: true,
  },
  {
    icon: Apple,
    key: "nutrition",
    gradient: "from-accent/20 to-accent/5",
    glow: "rgba(244,63,94,0.3)",
    hasBadge: false,
  },
  {
    icon: Dumbbell,
    key: "workout",
    gradient: "from-secondary/20 to-secondary/5",
    glow: "rgba(6,182,212,0.3)",
    hasBadge: false,
  },
  {
    icon: Bot,
    key: "coach",
    gradient: "from-success/20 to-success/5",
    glow: "rgba(16,185,129,0.3)",
    hasBadge: true,
  },
  {
    icon: Trophy,
    key: "gamification",
    gradient: "from-pro/20 to-pro/5",
    glow: "rgba(245,158,11,0.3)",
    hasBadge: false,
  },
  {
    icon: Flame,
    key: "burn",
    gradient: "from-accent/20 to-primary/10",
    glow: "rgba(244,63,94,0.25)",
    hasBadge: false,
  },
];

const stats = [
  { value: "10K+", key: "users" },
  { value: "500K+", key: "foods" },
  { value: "4.9★", key: "rating" },
  { value: "99%", key: "satisfaction" },
];

export default function HomePage() {
  const t = useTranslations("web");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #0A0512 0%, #24124D 50%, #0A0512 100%)",
          }}
        />

        {/* Animated orbs */}
        <div
          className="orb w-96 h-96 bg-primary"
          style={{ top: "10%", left: "5%", animationDuration: "8s" }}
        />
        <div
          className="orb w-64 h-64 bg-secondary"
          style={{ bottom: "20%", right: "8%", animationDuration: "6s" }}
        />
        <div
          className="orb w-48 h-48 bg-accent"
          style={{
            top: "50%",
            right: "20%",
            opacity: 0.15,
            animationDuration: "10s",
          }}
        />

        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(139,92,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Motto badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-light mb-8 animate-fade-in border border-[#00FF95]/30 shadow-[0_0_20px_rgba(0,255,149,0.15)] hover:shadow-[0_0_30px_rgba(0,255,149,0.3)] transition-all cursor-default">
            <Star size={14} className="text-neon-green fill-neon-green animate-pulse-slow" />
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "#00FF95", textShadow: "0 0 10px rgba(0,255,149,0.5)" }}
            >
              {t("home.badge")}
            </span>
          </div>

          {/* Main heading */}
          <h1
            className="font-display font-black leading-none mb-6 animate-fade-up text-balance"
            style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)", letterSpacing: "-2px" }}
          >
            <span className="text-white text-glow">Fit</span>
            <span className="gradient-text">GO</span>
          </h1>

          <p
            className="text-text-secondary text-lg md:text-2xl leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-up font-medium"
            style={{ animationDelay: "0.1s" }}
          >
            <HighlightedText text={t.raw("home.motto")} />
          </p>

          {/* Feature pills */}
          <div
            className="flex flex-wrap gap-4 justify-center mb-14 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            {featurePills.map((f, index) => (
              <div 
                key={f.key} 
                className="feature-pill animate-float hover:scale-105"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="p-1.5 rounded-full bg-white/5 backdrop-blur-md">
                  <f.icon size={16} style={{ color: f.color }} />
                </div>
                <span className="font-semibold text-[15px]">{t(`home.featurePills.${f.key}`)}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Link href="/register" className="btn-primary text-base">
              <Zap size={18} fill="white" />
              {t("home.cta.start")}
            </Link>
            <a href="#features" className="btn-secondary text-base">
              <Smartphone size={18} />
              {t("home.cta.demo")}
            </a>
          </div>

          {/* Download badges */}
          <div
            className="flex items-center justify-center gap-6 mt-10 animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            <a
              href="#"
              className="flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm font-semibold"
            >
              <Download size={14} />
              App Store
            </a>
            <span className="text-border">·</span>
            <a
              href="#"
              className="flex items-center gap-2 text-text-muted hover:text-text-secondary transition-colors text-sm font-semibold"
            >
              <Download size={14} />
              Google Play
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse-slow">
          <div className="w-px h-12 bg-linear-to-b from-transparent via-primary/60 to-transparent" />
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.key} className="text-center">
              <div className="font-display font-black text-4xl gradient-text mb-1">
                {s.value}
              </div>
              <div className="text-text-muted text-sm">{t(`home.stats.${s.key}`)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section id="features" className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">{t("home.features.subtitle")}</span>
            <h2 className="font-display font-black text-4xl md:text-5xl text-text-primary mt-3 mb-4 text-balance">
              {t("home.features.title")}
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-lg">
              {t("home.features.desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.key}
                className={`relative glass rounded-2xl p-6 card-hover bg-linear-to-br ${f.gradient}`}
              >
                {f.hasBadge && (
                  <span className="absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full bg-primary/20 text-primary border border-primary/30">
                    {t(`home.features.items.${f.key}.badge`)}
                  </span>
                )}
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{
                    background: `radial-gradient(circle, ${f.glow}, transparent)`,
                    boxShadow: `0 0 16px ${f.glow}`,
                    border: `1px solid ${f.glow}`,
                  }}
                >
                  <f.icon size={22} className="text-white" />
                </div>
                <h3 className="font-display font-bold text-lg text-text-primary mb-2">
                  {t(`home.features.items.${f.key}.title`)}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {t(`home.features.items.${f.key}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOCKUP SECTION ────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="orb w-80 h-80 bg-primary"
          style={{ top: "0%", left: "50%", transform: "translateX(-50%)" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <span className="section-label">{t("home.premium.title")}</span>
          <h2 className="font-display font-black text-4xl md:text-5xl text-text-primary mt-3 mb-6 text-balance">
            {t("home.premium.heading")}
          </h2>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto mb-16">
            {t("home.premium.desc")}
          </p>

          {/* Phone mockup placeholder with feature highlights */}
          <div className="relative inline-block">
            <div
              className="w-72 md:w-80 mx-auto rounded-[3rem] p-1 animate-float"
              style={{
                background: "linear-gradient(135deg, #8B5CF6, #06B6D4, #F43F5E)",
                boxShadow: "0 40px 80px rgba(139,92,246,0.4)",
              }}
            >
              <div
                className="rounded-[2.8rem] overflow-hidden"
                style={{ background: "#0F172A" }}
              >
                {/* Fake screen */}
                <div className="h-140 flex flex-col items-center justify-center p-8 gap-4">
                  <div
                    className="text-6xl font-display font-black gradient-text"
                    style={{ letterSpacing: "-2px" }}
                  >
                    FitGO
                  </div>
                  <div
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: "#00FF95" }}
                  >
                    {t("home.mockup.badge")}
                  </div>
                  <div className="w-full mt-4 space-y-3">
                    {[
                      { key: "protein", val: 78, color: "#8B5CF6" },
                      { key: "carbs", val: 55, color: "#06B6D4" },
                      { key: "fats", val: 40, color: "#F59E0B" },
                    ].map((m) => (
                      <div key={m.key}>
                        <div className="flex justify-between text-xs font-semibold mb-1">
                          <span style={{ color: m.color }}>{t(`home.mockup.${m.key}`)}</span>
                          <span className="text-text-secondary">{m.val}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-surface-alt">
                          <div
                            className="h-2 rounded-full transition-all"
                            style={{
                              width: `${m.val}%`,
                              background: m.color,
                              boxShadow: `0 0 8px ${m.color}80`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 w-full glass rounded-2xl p-4 text-left">
                    <div className="text-xs text-text-muted mb-1">{t("home.mockup.today")}</div>
                    <div className="text-2xl font-display font-black gradient-text">
                      2,140
                    </div>
                    <div className="text-xs text-text-secondary">
                      {t("home.mockup.kcal")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ────────────────────────────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="glass rounded-3xl p-10 md:p-16 relative overflow-hidden">
            <div
              className="orb w-64 h-64 bg-primary"
              style={{ top: "-30%", right: "-10%", opacity: 0.2 }}
            />
            <div
              className="orb w-48 h-48 bg-secondary"
              style={{ bottom: "-20%", left: "-5%", opacity: 0.15 }}
            />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pro/20 border border-pro/30 mb-6">
                <Star size={12} className="text-pro fill-pro" />
                <span className="text-xs font-bold text-pro uppercase tracking-wider">
                  FitGO Pro
                </span>
              </div>
              <h2 className="font-display font-black text-4xl md:text-5xl text-text-primary mb-4 text-balance">
                <HighlightedText text={t.raw("home.pricing.title")} className="gradient-text" />
              </h2>
              <p className="text-text-secondary text-lg mb-8">
                {t("home.pricing.desc")}
              </p>
              <Link href="/pricing" className="btn-primary text-base">
                {t("home.pricing.cta")} <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
