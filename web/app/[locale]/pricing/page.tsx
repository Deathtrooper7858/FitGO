"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/routing";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Check,
  X,
  Star,
  Zap,
  Lock,
  ChevronRight,
  BrainCircuit,
  ChefHat,
  Camera,
  Mic,
  Activity,
  History,
  ShieldOff,
  Trophy,
  Sparkles,
  ArrowRight,
} from "lucide-react";


const formatPrice = (amount: number, locale: string) => {
  const baseLang = locale.toLowerCase().split("-")[0];

  if (baseLang === "es") {
    return `COP ${amount.toLocaleString("en-US")}`;
  }

  if (locale.toLowerCase() === "es-es" || ["de", "fr", "it"].includes(baseLang)) {
    return `${(amount / 2400).toFixed(2).replace(".", ",")} €`;
  }

  switch (baseLang) {
    case "pt":
      return `R$ ${(amount / 500).toFixed(2).replace(".", ",")}`;
    case "ru":
      return `${Math.round(amount / 13)} ₽`;
    default:
      return `$${(amount / 2400).toFixed(2)}`;
  }
};

const getMonthSuffix = (locale: string) => {
  const baseLang = locale.toLowerCase().split("-")[0];
  switch (baseLang) {
    case "es": return " / mes";
    case "pt": return " / mês";
    case "ru": return " / мес";
    case "de": return " / Monat";
    case "fr": return " / mois";
    case "it": return " / mese";
    default: return " / month";
  }
};

export default function PricingPage() {
  const t = useTranslations("pricingPage");
  const locale = useLocale();

  const freeFeaturesData = t.raw("freeFeatures") as string[];
  const freeIncludedData = t.raw("freeIncluded") as boolean[];
  const freeFeatures = freeFeaturesData.map((text, i) => ({
    text,
    included: freeIncludedData[i],
  }));

  const proFeaturesData = t.raw("proFeatures") as string[];
  const proFeatures = proFeaturesData.map((text) => ({
    text,
    included: true,
  }));

  const proHighlights = [
    { icon: BrainCircuit, label: t("highlights.coach"), color: "#7C5CFC" },
    { icon: ChefHat, label: t("highlights.planner"), color: "#10B981" },
    { icon: Camera, label: t("highlights.scanner"), color: "#F59E0B" },
    { icon: Mic, label: t("highlights.voice"), color: "#3B82F6" },
    { icon: Activity, label: t("highlights.directory"), color: "#EF4444" },
    { icon: Star, label: t("highlights.colors"), color: "#F59E0B" },
    { icon: Trophy, label: t("highlights.leagues"), color: "#8B5CF6" },
    { icon: History, label: t("highlights.history"), color: "#10B981" },
    { icon: ShieldOff, label: t("highlights.ads"), color: "#7C5CFC" },
  ];

  const comparisonRows = [
    { feature: t("compare.coach"), free: t("compare.coachFree"), pro: t("compare.coachPro") },
    { feature: t("compare.scanner"), free: t("compare.scannerFree"), pro: t("compare.scannerPro") },
    { feature: t("compare.planner"), free: t("compare.plannerFree"), pro: t("compare.plannerPro") },
    { feature: t("compare.voice"), free: t("compare.voiceFree"), pro: t("compare.voicePro") },
    { feature: t("compare.directory"), free: t("compare.directoryFree"), pro: t("compare.directoryPro") },
    { feature: t("compare.wars"), free: t("compare.warsFree"), pro: t("compare.warsPro") },
    { feature: t("compare.squads"), free: t("compare.squadsFree"), pro: t("compare.squadsPro") },
    { feature: t("compare.challenges"), free: t("compare.challengesFree"), pro: t("compare.challengesPro") },
    { feature: t("compare.history"), free: t("compare.historyFree"), pro: t("compare.historyPro") },
    { feature: t("compare.colors"), free: t("compare.colorsFree"), pro: t("compare.colorsPro") },
    { feature: t("compare.ads"), free: t("compare.adsFree"), pro: t("compare.adsPro") },
  ];

  const currentPrice = 11800;
  const oldPrice = 30000;
  const discount = Math.round((1 - currentPrice / oldPrice) * 100);

  const displayPrice = formatPrice(currentPrice, locale);
  const displayOldPrice = formatPrice(oldPrice, locale);
  const monthSuffix = getMonthSuffix(locale);

  return (
    <div className="min-h-screen" style={{ background: "#080c18" }} suppressHydrationWarning>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.1) 0%, rgba(139,92,246,0.06) 50%, transparent 80%)",
          }}
        />
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            <Star size={12} className="text-pro fill-pro" />
            <span className="text-xs font-black text-pro uppercase tracking-wider">
              {t("hero.badge")}
            </span>
          </div>
          <h1
            className="font-display font-black text-5xl md:text-7xl text-text-primary mb-6 leading-tight"
            style={{ letterSpacing: "-2px" }}
          >
            {t("hero.title1")}{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("hero.title2")}
            </span>
          </h1>
          <p className="text-text-secondary text-xl leading-relaxed max-w-lg mx-auto">
            {t("hero.desc")}
          </p>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-8 px-6 pb-16">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          {/* Free card */}
          <div
            className="rounded-3xl p-8"
            style={{
              background: "rgba(15,23,42,0.5)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div className="mb-7">
              <h2 className="font-display font-black text-2xl text-text-primary mb-1.5">
                {t("free.title")}
              </h2>
              <p className="text-text-muted text-sm">{t("free.desc")}</p>
            </div>
            <div className="mb-8">
              <span className="font-display font-black text-5xl text-text-primary">$0</span>
              <span className="text-text-muted text-sm ml-2">/ {t("free.forever")}</span>
            </div>
            <Link
              href="/register"
              className="btn-secondary w-full justify-center mb-8 block text-center py-3.5!"
            >
              {t("free.btn")}
            </Link>
            <ul className="space-y-3">
              {freeFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      f.included
                        ? "bg-success/20 text-success"
                        : "bg-surface-alt text-text-muted"
                    }`}
                  >
                    {f.included ? <Check size={11} /> : <X size={11} />}
                  </div>
                  <span
                    className={`text-sm ${
                      f.included ? "text-text-secondary" : "text-text-muted line-through"
                    }`}
                  >
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Pro card */}
          <div
            className="relative rounded-3xl p-8 overflow-hidden"
            style={{
              background: "linear-gradient(145deg, rgba(20,10,50,0.95) 0%, rgba(8,12,24,0.98) 100%)",
              boxShadow: "0 0 0 1px rgba(139,92,246,0.35), 0 32px 80px rgba(139,92,246,0.25), inset 0 1px 0 rgba(255,255,255,0.07)",
            }}
          >
            {/* Top glow line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, #8B5CF6, #06B6D4, transparent)" }}
            />
            {/* Orb */}
            <div
              className="orb w-56 h-56 bg-primary"
              style={{ top: "-15%", right: "-8%", opacity: 0.18 }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-7">
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h2 className="font-display font-black text-2xl text-text-primary">
                      {t("pro.title")}
                    </h2>
                    <span
                      className="text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1"
                      style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.35)" }}
                    >
                      <Star size={9} className="fill-pro" />
                      {t("pro.popular")}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm">{t("pro.desc")}</p>
                </div>
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: "rgba(139,92,246,0.2)", border: "1px solid rgba(139,92,246,0.35)" }}
                >
                  <Zap size={24} className="text-primary" fill="#8B5CF6" />
                </div>
              </div>

              {/* Price */}
              <div className="mb-2 flex items-baseline gap-3 flex-wrap">
                <span
                  className="font-display font-black text-5xl"
                  style={{
                    background: "linear-gradient(135deg, #f8fafc, #a78bfa)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {displayPrice}
                </span>
                <span className="text-text-muted text-sm">{monthSuffix}</span>
              </div>
              <div className="flex items-center gap-3 mb-7 flex-wrap">
                <span className="text-text-muted text-sm line-through">{displayOldPrice}{monthSuffix}</span>
                <span
                  className="text-xs font-black px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#10B981" }}
                >
                  −{discount}%
                </span>
                <span className="text-xs font-semibold text-text-muted">
                  {t("pro.was")} {displayOldPrice}
                </span>
              </div>

              {/* Pro highlights */}
              <div className="flex flex-wrap gap-2 mb-7">
                {proHighlights.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      background: `${h.color}12`,
                      border: `1px solid ${h.color}28`,
                      color: h.color,
                    }}
                  >
                    <h.icon size={11} />
                    {h.label}
                  </div>
                ))}
              </div>

              <a
                href="https://play.google.com/store/apps/details?id=com.fitgo.app"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary w-full justify-center mb-8 text-base py-4!"
              >
                <Sparkles size={17} />
                {t("pro.btn")}
                <ChevronRight size={18} />
              </a>

              <ul className="space-y-3">
                {proFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.3)" }}
                    >
                      <Check size={11} className="text-success" />
                    </div>
                    <span className="text-sm text-text-secondary">{f.text}</span>
                  </li>
                ))}
              </ul>

              <div
                className="mt-8 pt-5 flex items-center gap-2 text-text-muted text-xs"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <Lock size={12} />
                {t("secure")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-label">{t("compare.label")}</span>
            <h2
              className="font-display font-black text-4xl md:text-5xl text-text-primary mt-4"
              style={{ letterSpacing: "-1.5px" }}
            >
              {t("compare.title")}
            </h2>
          </div>

          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: "rgba(15,23,42,0.5)",
              border: "1px solid rgba(255,255,255,0.07)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-3 gap-4 px-6 py-5"
              style={{ background: "rgba(139,92,246,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div />
              <div className="text-center">
                <span className="text-sm font-bold text-text-muted">{t("free.title")}</span>
              </div>
              <div className="text-center">
                <span
                  className="text-sm font-black"
                  style={{
                    background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {t("pro.title")} ⚡
                </span>
              </div>
            </div>

            {/* Rows */}
            {comparisonRows.map((row, i) => (
              <div
                key={row.feature}
                className="grid grid-cols-3 gap-4 px-6 py-4 transition-colors hover:bg-white/2"
                style={{
                  background: i % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent",
                  borderBottom: i < comparisonRows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}
              >
                <div className="text-sm font-semibold text-text-primary">{row.feature}</div>
                <div className="text-center">
                  <span className="text-sm text-text-muted">{row.free}</span>
                </div>
                <div className="text-center">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#a78bfa" }}
                  >
                    {row.pro}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 pb-28">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <span className="section-label">{t("faq.label")}</span>
            <h2
              className="font-display font-black text-4xl md:text-5xl text-text-primary mt-4"
              style={{ letterSpacing: "-1.5px" }}
            >
              {t("faq.title")}
            </h2>
          </div>
          <div className="space-y-3">
            {(t.raw("faq.items") as { q: string, a: string }[]).map((item, i) => (
              <div
                key={item.q}
                className="rounded-2xl p-6 transition-all duration-200 hover:bg-white/3"
                style={{
                  background: "rgba(15,23,42,0.5)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-black"
                    style={{ background: "rgba(139,92,246,0.15)", color: "#8B5CF6", border: "1px solid rgba(139,92,246,0.25)" }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary mb-2">{item.q}</h3>
                    <p className="text-text-secondary text-sm leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTA below FAQ */}
          <div className="text-center mt-14">
            <p className="text-text-muted text-sm mb-5">{t("faq.readyToStart")}</p>
            <a
              href="https://play.google.com/store/apps/details?id=com.fitgo.app"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-base inline-flex px-8! py-4!"
            >
              <Zap size={18} fill="white" />
              {t("faq.tryFitGoPro")}
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
