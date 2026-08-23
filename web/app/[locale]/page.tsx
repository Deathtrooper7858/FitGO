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
  Scan,
  Mic,
  Camera,
  Users,
  Swords,
  Medal,
  Target,
  TrendingUp,
  Moon,
  Bell,
  Globe,
  Check,
  Sparkles,
  ChevronRight,
  Heart,
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
  { icon: Apple, key: "nutrition", color: "#F43F5E", bg: "rgba(244,63,94,0.12)" },
  { icon: Bot, key: "coach", color: "#10B981", bg: "rgba(16,185,129,0.12)" },
  { icon: BarChart3, key: "progress", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)" },
  { icon: Calendar, key: "planner", color: "#06B6D4", bg: "rgba(6,182,212,0.12)" },
  { icon: Zap, key: "wars", color: "#F59E0B", bg: "rgba(245,158,11,0.12)" },
  { icon: ShieldCheck, key: "leagues", color: "#A855F7", bg: "rgba(168,85,247,0.12)" },
];

const features = [
  {
    icon: Scale,
    key: "progress",
    gradient: "from-[#8B5CF6]/15 to-[#6D28D9]/5",
    glow: "rgba(139,92,246,0.35)",
    color: "#8B5CF6",
    hasBadge: true,
  },
  {
    icon: Apple,
    key: "nutrition",
    gradient: "from-[#F43F5E]/15 to-[#BE123C]/5",
    glow: "rgba(244,63,94,0.35)",
    color: "#F43F5E",
    hasBadge: false,
  },
  {
    icon: Dumbbell,
    key: "workout",
    gradient: "from-[#06B6D4]/15 to-[#0284C7]/5",
    glow: "rgba(6,182,212,0.35)",
    color: "#06B6D4",
    hasBadge: false,
  },
  {
    icon: Bot,
    key: "coach",
    gradient: "from-[#10B981]/15 to-[#059669]/5",
    glow: "rgba(16,185,129,0.35)",
    color: "#10B981",
    hasBadge: true,
  },
  {
    icon: Trophy,
    key: "gamification",
    gradient: "from-[#F59E0B]/15 to-[#D97706]/5",
    glow: "rgba(245,158,11,0.35)",
    color: "#F59E0B",
    hasBadge: false,
  },
  {
    icon: Flame,
    key: "burn",
    gradient: "from-[#F43F5E]/15 to-[#8B5CF6]/5",
    glow: "rgba(244,63,94,0.25)",
    color: "#F43F5E",
    hasBadge: false,
  },
];

const extraFeatures = [
  { icon: Scan, key: "barcode", color: "#F59E0B" },
  { icon: Camera, key: "photoScan", color: "#F43F5E" },
  { icon: Mic, key: "voiceInput", color: "#3B82F6" },
  { icon: Users, key: "squads", color: "#10B981" },
  { icon: Swords, key: "macroWars", color: "#8B5CF6" },
  { icon: Medal, key: "leagues", color: "#FFD700" },
  { icon: Moon, key: "sleep", color: "#6366F1" },
  { icon: Bell, key: "notifications", color: "#EC4899" },
  { icon: Globe, key: "languages", color: "#06B6D4" },
];

const howItWorks = [
  { step: "1", key: "download", color: "#8B5CF6", icon: Download },
  { step: "2", key: "profile", color: "#06B6D4", icon: Target },
  { step: "3", key: "track", color: "#10B981", icon: TrendingUp },
];

const testimonials = [
  { name: "María G.", role: "Pro User", key: "maria", rating: 5, avatar: "M", gradient: "from-[#8B5CF6] to-[#6D28D9]" },
  { name: "Carlos R.", role: "Active User", key: "carlos", rating: 5, avatar: "C", gradient: "from-[#F43F5E] to-[#BE123C]" },
  { name: "Laura M.", role: "Pro User", key: "laura", rating: 5, avatar: "L", gradient: "from-[#10B981] to-[#059669]" },
];

const stats = [
  { value: "10K+", key: "users", icon: Users, color: "#8B5CF6" },
  { value: "500K+", key: "foods", icon: Apple, color: "#F43F5E" },
  { value: "4.9★", key: "rating", icon: Star, color: "#F59E0B" },
  { value: "99%", key: "satisfaction", icon: Heart, color: "#10B981" },
];

const mockupMacros = [
  { key: "protein", val: 78, color: "#8B5CF6" },
  { key: "carbs", val: 55, color: "#06B6D4" },
  { key: "fats", val: 40, color: "#F59E0B" },
];

export default function HomePage() {
  const t = useTranslations();

  return (
    <div className="min-h-screen" style={{ background: "#080c18" }} suppressHydrationWarning>
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Deep layered background */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 120% 80% at 50% -10%, #2a0a5e 0%, #0f0530 30%, #080c18 60%, #080c18 100%)",
          }}
        />

        {/* Hero grid */}
        <div className="absolute inset-0 hero-grid opacity-100" />

        {/* Animated orbs */}
        <div
          className="orb orb-drift w-150 h-150"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)", top: "-10%", left: "-10%", opacity: 0.2 }}
        />
        <div
          className="orb orb-drift-rev w-100 h-100"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)", bottom: "5%", right: "-5%", opacity: 0.15 }}
        />
        {/* Background elements */}
        <div
          className="orb w-100 h-100"
          style={{ background: "radial-gradient(circle, #10b981, transparent)", top: "10%", right: "-10%", opacity: 0.1, animation: "orbDrift 15s infinite" }}
        />

        {/* Vignette bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, transparent, #080c18)" }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full mb-10 animate-fade-in border cursor-default group"
            style={{
              background: "rgba(0,255,149,0.06)",
              borderColor: "rgba(0,255,149,0.25)",
              boxShadow: "0 0 24px rgba(0,255,149,0.08), inset 0 0 16px rgba(0,255,149,0.04)",
            }}
          >
            <Sparkles size={14} style={{ color: "#00FF95" }} className="animate-pulse" />
            <span
              className="text-xs font-black uppercase tracking-widest"
              style={{ color: "#00FF95", textShadow: "0 0 12px rgba(0,255,149,0.6)" }}
            >
              {t("home.badge")}
            </span>
          </div>

          {/* Main heading */}
          <h1
            className="font-display font-black leading-[0.95] mb-8 animate-fade-up text-balance"
            style={{ fontSize: "clamp(4rem, 11vw, 8rem)", letterSpacing: "-3px" }}
          >
            <span className="text-white" style={{ textShadow: "0 0 80px rgba(139,92,246,0.3)" }}>Fit</span>
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #7c3aed 40%, #06b6d4 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 30px rgba(139,92,246,0.5))",
              }}
            >
              GO
            </span>
          </h1>

          <p
            className="text-text-secondary text-xl md:text-2xl leading-relaxed mb-12 max-w-2xl mx-auto animate-fade-up font-medium"
            style={{ animationDelay: "0.1s" }}
          >
            <HighlightedText text={t.raw("home.motto")} className="text-white font-bold" />
          </p>

          {/* Feature pills */}
          <div
            className="flex flex-wrap gap-3 justify-center mb-14 animate-fade-up"
            style={{ animationDelay: "0.2s" }}
          >
            {featurePills.map((f, index) => (
              <div
                key={f.key}
                className="feature-pill animate-float"
                style={{
                  animationDelay: `${index * 0.2}s`,
                  background: f.bg,
                  borderColor: `${f.color}30`,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: `${f.color}20` }}
                >
                  <f.icon size={13} style={{ color: f.color }} />
                </div>
                <span className="font-semibold text-[13px]">{t(`home.featurePills.${f.key}`)}</span>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up"
            style={{ animationDelay: "0.3s" }}
          >
            <Link href="/register" className="btn-primary text-base px-8! py-4!">
              <Zap size={18} fill="white" />
              {t("home.cta.start")}
              <ChevronRight size={16} />
            </Link>
            <a href="#features" className="btn-secondary text-base px-8! py-4!">
              <Smartphone size={18} />
              {t("home.cta.demo")}
            </a>
          </div>

          {/* Download badges */}
          <div
            className="flex items-center justify-center gap-8 mt-12 animate-fade-up"
            style={{ animationDelay: "0.4s" }}
          >
            <a
              href="https://apps.apple.com/app/fitgo"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-text-muted hover:text-text-secondary transition-all text-sm font-bold group"
            >
              <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                <Download size={14} />
              </div>
              App Store
            </a>
            <div className="w-px h-5 bg-border" />
            <a
              href="https://play.google.com/store/apps/details?id=com.fitgo.app"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-text-muted hover:text-text-secondary transition-all text-sm font-bold group"
            >
              <div className="w-8 h-8 rounded-xl bg-surface flex items-center justify-center border border-white/5 group-hover:border-primary/30 transition-all">
                <Download size={14} />
              </div>
              Google Play
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-pulse-slow opacity-50">
          <div className="w-px h-10" style={{ background: "linear-gradient(to bottom, transparent, #8b5cf6, transparent)" }} />
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
        </div>
      </section>

      {/* ── STATS ─────────────────────────────────────────────────── */}
      <section className="relative py-20 overflow-hidden">
        <div
          className="absolute inset-0 border-y"
          style={{ borderColor: "rgba(255,255,255,0.04)", background: "linear-gradient(135deg, rgba(139,92,246,0.04), rgba(6,182,212,0.02))" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.key} className="stat-card glass-card rounded-2xl text-center py-8 px-4">
                <div
                  className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                  style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
                >
                  <s.icon size={22} style={{ color: s.color }} />
                </div>
                <div
                  className="font-display font-black text-3xl md:text-4xl mb-2"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}, ${s.color}aa)`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {s.value}
                </div>
                <div className="text-text-muted text-sm font-medium">{t(`home.stats.${s.key}`)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────── */}
      <section id="features" className="py-32 px-6 relative overflow-hidden">
        {/* Background orb */}
        <div
          className="orb w-125 h-125"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent)", top: "20%", right: "-10%", opacity: 0.08 }}
        />
        <div className="relative z-10 max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <span className="section-label">{t("home.features.subtitle")}</span>
            <h2
              className="font-display font-black text-4xl md:text-5xl lg:text-6xl text-text-primary mt-4 mb-5 text-balance"
              style={{ letterSpacing: "-1.5px" }}
            >
              {t("home.features.title")}
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto text-lg leading-relaxed">
              {t("home.features.desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.key}
                className={`relative rounded-3xl p-7 card-hover overflow-hidden group bg-linear-to-br ${f.gradient}`}
                style={{
                  background: `linear-gradient(135deg, ${f.color}10, rgba(8,12,24,0.9))`,
                  border: `1px solid ${f.color}20`,
                  boxShadow: `0 4px 24px rgba(0,0,0,0.4)`,
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at top left, ${f.color}12, transparent 60%)` }}
                />

                {f.hasBadge && (
                  <span
                    className="absolute top-5 right-5 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
                    style={{
                      background: `${f.color}20`,
                      color: f.color,
                      border: `1px solid ${f.color}40`,
                    }}
                  >
                    {t(`home.features.items.${f.key}.badge`)}
                  </span>
                )}

                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                  style={{
                    background: `${f.color}18`,
                    border: `1px solid ${f.color}35`,
                    boxShadow: `0 8px 24px ${f.glow}`,
                  }}
                >
                  <f.icon size={24} style={{ color: f.color }} />
                </div>

                <h3 className="font-display font-bold text-xl text-text-primary mb-3">
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

      {/* ── APP PREVIEW SECTION ────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(139,92,246,0.06), transparent)" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            {/* Text content */}
            <div className="flex-1 text-center lg:text-left">
              <span className="section-label mb-4 inline-block">{t("home.premium.title")}</span>
              <h2
                className="font-display font-black text-4xl md:text-5xl text-text-primary mt-4 mb-6 leading-tight"
                style={{ letterSpacing: "-1.5px" }}
              >
                {t("home.premium.heading")}
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed mb-8 max-w-lg">
                {t("home.premium.desc")}
              </p>

              {/* Mini feature list */}
              <div className="space-y-3 mb-10">
                {[
                  { label: t("home.premium.features.instantMacros"), color: "#8B5CF6" },
                  { label: t("home.premium.features.customCoach"), color: "#10B981" },
                  { label: t("home.premium.features.macroWars"), color: "#F59E0B" },
                  { label: t("home.premium.features.eliteLeagues"), color: "#F43F5E" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: `${item.color}25`, border: `1px solid ${item.color}50` }}
                    >
                      <Check size={11} style={{ color: item.color }} />
                    </div>
                    <span className="text-text-secondary text-sm font-medium">{item.label}</span>
                  </div>
                ))}
              </div>

              <Link href="/register" className="btn-primary text-base inline-flex">
                <Zap size={18} fill="white" />
                {t("home.premium.cta")}
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Phone mockup */}
            <div className="relative shrink-0">
              {/* Outer glow ring */}
              <div
                className="absolute -inset-8 rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(139,92,246,0.2), rgba(6,182,212,0.1), transparent)",
                  filter: "blur(40px)",
                }}
              />

              <div
                className="relative w-70 md:w-75 rounded-[3.5rem] p-0.75 animate-float"
                style={{
                  background: "linear-gradient(145deg, #8B5CF6, #7C3AED, #06B6D4)",
                  boxShadow: "0 40px 80px rgba(139,92,246,0.5), 0 0 0 1px rgba(139,92,246,0.3)",
                }}
              >
                <div
                  className="rounded-[3.3rem] overflow-hidden"
                  style={{ background: "#080c18" }}
                >
                  {/* Phone status bar */}
                  <div className="flex items-center justify-between px-6 pt-4 pb-2">
                    <span className="text-[10px] font-bold text-text-muted">9:41</span>
                    <div className="w-20 h-5 rounded-full bg-black" />
                    <div className="flex gap-1">
                      <div className="w-3 h-2 rounded-sm bg-text-muted/50" />
                      <div className="w-2 h-2 rounded-full bg-text-muted/50" />
                    </div>
                  </div>

                  {/* App content */}
                  <div className="px-6 pb-8 pt-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-text-muted font-semibold">Buenos días,</div>
                        <div className="text-sm font-black text-white">Carlos 💪</div>
                      </div>
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.3)" }}
                      >
                        <Flame size={16} style={{ color: "#F59E0B" }} />
                      </div>
                    </div>

                    {/* Calorie ring */}
                    <div
                      className="rounded-2xl p-4 text-center"
                      style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
                    >
                      <div className="text-[10px] text-text-muted mb-1">{t("home.mockup.today")}</div>
                      <div
                        className="text-3xl font-display font-black"
                        style={{
                          background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                          WebkitBackgroundClip: "text",
                          WebkitTextFillColor: "transparent",
                          backgroundClip: "text",
                        }}
                      >
                        2,140
                      </div>
                      <div className="text-[11px] text-text-muted font-semibold mt-0.5">{t("home.mockup.kcal")} · 360 restantes</div>
                    </div>

                    {/* Macros */}
                    <div className="space-y-2.5">
                      <div className="text-[10px] font-black uppercase tracking-wider text-text-muted">Macros del día</div>
                      {mockupMacros.map((m) => (
                        <div key={m.key}>
                          <div className="flex justify-between text-[11px] font-bold mb-1">
                            <span style={{ color: m.color }}>{t(`home.mockup.${m.key}`)}</span>
                            <span className="text-text-muted">{m.val}%</span>
                          </div>
                          <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
                            <div
                              className="h-1.5 rounded-full"
                              style={{
                                width: `${m.val}%`,
                                background: `linear-gradient(90deg, ${m.color}, ${m.color}99)`,
                                boxShadow: `0 0 8px ${m.color}60`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Streak badge */}
                    <div
                      className="rounded-xl p-3 flex items-center gap-3"
                      style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)" }}
                    >
                      <div className="text-lg">🔥</div>
                      <div>
                        <div className="text-[11px] font-black text-white">¡7 días de racha!</div>
                        <div className="text-[10px] text-text-muted">Sigue así, crack</div>
                      </div>
                    </div>

                    {/* Mockup badge */}
                    <div
                      className="text-center text-[9px] font-black uppercase tracking-widest rounded-lg py-1.5"
                      style={{ color: "#00FF95", background: "rgba(0,255,149,0.08)", textShadow: "0 0 8px rgba(0,255,149,0.5)" }}
                    >
                      {t("home.mockup.badge")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXTRA FEATURES ────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 border-y"
          style={{ borderColor: "rgba(255,255,255,0.04)", background: "rgba(139,92,246,0.02)" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">{t("home.extraFeatures.subtitle")}</span>
            <h2
              className="font-display font-black text-4xl md:text-5xl text-text-primary mt-4 mb-4"
              style={{ letterSpacing: "-1.5px" }}
            >
              {t("home.extraFeatures.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {extraFeatures.map((f, i) => (
              <div
                key={f.key}
                className="glass-card rounded-2xl p-5 flex items-center gap-4 group cursor-default transition-all duration-300"
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  animationDelay: `${i * 0.05}s`,
                }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110"
                  style={{
                    background: `${f.color}15`,
                    border: `1px solid ${f.color}35`,
                    boxShadow: `0 4px 16px ${f.color}20`,
                  }}
                >
                  <f.icon size={21} style={{ color: f.color }} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-text-primary group-hover:text-white transition-colors">
                    {t(`home.extraFeatures.items.${f.key}.title`)}
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {t(`home.extraFeatures.items.${f.key}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div
          className="orb w-100 h-100"
          style={{ background: "radial-gradient(circle, #06b6d4, transparent)", bottom: "-10%", left: "-5%", opacity: 0.08 }}
        />
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <span className="section-label">{t("home.howItWorks.subtitle")}</span>
            <h2
              className="font-display font-black text-4xl md:text-5xl text-text-primary mt-4 mb-5"
              style={{ letterSpacing: "-1.5px" }}
            >
              {t("home.howItWorks.title")}
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto leading-relaxed">
              {t("home.howItWorks.desc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line (desktop) */}
            <div
              className="hidden md:block absolute top-10 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px"
              style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(6,182,212,0.4), transparent)" }}
            />

            {howItWorks.map((item, i) => (
              <div key={item.step} className="text-center relative group" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="relative inline-block mb-6">
                  {/* Outer ring */}
                  <div
                    className="absolute -inset-2 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `${item.color}15`, filter: "blur(8px)" }}
                  />
                  <div
                    className="relative w-20 h-20 rounded-3xl mx-auto flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}20, ${item.color}08)`,
                      border: `2px solid ${item.color}40`,
                      boxShadow: `0 12px 32px ${item.color}25`,
                    }}
                  >
                    <item.icon size={28} style={{ color: item.color }} />
                  </div>
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                    style={{
                      background: item.color,
                      color: "#fff",
                      boxShadow: `0 4px 12px ${item.color}60`,
                    }}
                  >
                    {item.step}
                  </div>
                </div>

                <h3 className="font-display font-bold text-xl text-text-primary mb-3">
                  {t(`home.howItWorks.steps.${item.step}.title`)}
                </h3>
                <p className="text-text-secondary text-sm leading-relaxed max-w-xs mx-auto">
                  {t(`home.howItWorks.steps.${item.step}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 border-y"
          style={{ borderColor: "rgba(255,255,255,0.04)", background: "linear-gradient(135deg, rgba(6,182,212,0.03), rgba(139,92,246,0.03))" }}
        />
        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">{t("home.testimonials.subtitle")}</span>
            <h2
              className="font-display font-black text-4xl md:text-5xl text-text-primary mt-4 mb-4"
              style={{ letterSpacing: "-1.5px" }}
            >
              {t("home.testimonials.title")}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t_item, i) => (
              <div
                key={t_item.key}
                className="glass-card rounded-3xl p-7 card-hover relative overflow-hidden group"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {/* Quote mark */}
                <div
                  className="absolute top-4 right-5 text-6xl font-display font-black leading-none pointer-events-none select-none"
                  style={{ color: "rgba(139,92,246,0.08)" }}
                >
                  &quot;
                </div>

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t_item.rating)].map((_, i) => (
                    <Star key={i} size={14} className="text-pro fill-pro" />
                  ))}
                </div>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  &ldquo;{t(`home.testimonials.items.${t_item.key}.text`)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-black text-sm text-white"
                    style={{ background: `linear-gradient(135deg, ${t_item.gradient.split(" ")[1]}, ${t_item.gradient.split(" ")[3]})` }}
                  >
                    {t_item.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-text-primary">{t_item.name}</div>
                    <div className="text-xs text-text-muted">{t_item.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING TEASER ────────────────────────────────────────── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div
          className="orb w-150 h-150"
          style={{ background: "radial-gradient(circle, #8b5cf6, transparent)", top: "0%", left: "50%", transform: "translateX(-50%)", opacity: 0.15 }}
        />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div
            className="rounded-3xl p-10 md:p-16 relative overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(20,10,50,0.9) 0%, rgba(8,12,24,0.95) 100%)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.3), 0 32px 80px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Top glow line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, #8B5CF6, #06B6D4, transparent)" }}
            />
            {/* Corner orbs */}
            <div className="orb w-48 h-48 bg-primary" style={{ top: "-20%", right: "-5%", opacity: 0.15 }} />
            <div className="orb w-32 h-32 bg-secondary" style={{ bottom: "-15%", left: "0%", opacity: 0.1 }} />

            <div className="relative z-10">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8"
                style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)" }}
              >
                <Star size={13} className="text-pro fill-pro" />
                <span className="text-xs font-black text-pro uppercase tracking-wider">FitGO Pro</span>
              </div>

              <h2
                className="font-display font-black text-4xl md:text-6xl text-text-primary mb-5 text-balance leading-tight"
                style={{ letterSpacing: "-2px" }}
              >
                <HighlightedText text={t.raw("home.pricing.title")} className="gradient-text" />
              </h2>

              <p className="text-text-secondary text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                {t("home.pricing.desc")}
              </p>

              <Link href="/pricing" className="btn-primary text-base px-8! py-4! mx-auto inline-flex">
                {t("home.pricing.cta")}
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
