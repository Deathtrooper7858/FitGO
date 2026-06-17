"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Check,
  X,
  Star,
  Zap,
  Bot,
  Trophy,
  Swords,
  Scale,
  Apple,
  Flame,
  Lock,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";

export default function PricingPage() {
  const t = useTranslations("pricingPage");

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
    { icon: Bot, label: t("highlights.coach"), color: "#10B981" },
    { icon: Swords, label: t("highlights.macroWars"), color: "#F43F5E" },
    { icon: Trophy, label: t("highlights.leagues"), color: "#F59E0B" },
    { icon: Scale, label: t("highlights.analysis"), color: "#8B5CF6" },
    { icon: Apple, label: t("highlights.nutrition"), color: "#06B6D4" },
    { icon: Flame, label: t("highlights.unlimited"), color: "#FF9F1C" },
  ];

  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthlyPrice = Number(process.env.NEXT_PUBLIC_PRICE_MONTHLY) || 4.99;
  const annualPrice = Number(process.env.NEXT_PUBLIC_PRICE_ANNUAL) || 3.33;
  const annualTotal = (annualPrice * 12).toFixed(2);

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billing }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || t("errorMsg"));
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errorMsg"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pro/20 border border-pro/30 mb-6">
            <Star size={12} className="text-pro fill-pro" />
            <span className="text-xs font-bold text-pro uppercase tracking-wider">
              {t("hero.badge")}
            </span>
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl text-text-primary mb-6">
            {t("hero.title1")}{" "}
            <span className="gradient-text">{t("hero.title2")}</span>
          </h1>
          <p className="text-text-secondary text-xl leading-relaxed">
            {t("hero.desc")}
          </p>
        </div>
      </section>

      {/* Billing toggle */}
      <section className="pb-4 px-6">
        <div className="flex justify-center">
          <div className="glass rounded-2xl p-1.5 flex items-center gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                billing === "monthly"
                  ? "bg-surface text-text-primary shadow-card"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {t("billing.monthly")}
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${
                billing === "annual"
                  ? "bg-surface text-text-primary shadow-card"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {t("billing.annual")}
              <span className="text-xs font-black text-success bg-success/15 px-2 py-0.5 rounded-full">
                −33%
              </span>
            </button>
          </div>
        </div>
      </section>

        {/* Error banner */}
        {error && (
          <section className="px-6">
            <div className="max-w-5xl mx-auto mb-4 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
              <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
              <p className="text-sm text-error/90 leading-tight">{error}</p>
            </div>
          </section>
        )}

        {/* Pricing cards */}
        <section className="py-16 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Free card */}
          <div className="glass rounded-3xl p-8">
            <div className="mb-6">
              <h2 className="font-display font-black text-2xl text-text-primary mb-1">
                {t("free.title")}
              </h2>
              <p className="text-text-muted text-sm">
                {t("free.desc")}
              </p>
            </div>
            <div className="mb-8">
              <span className="font-display font-black text-5xl text-text-primary">
                $0
              </span>
              <span className="text-text-muted text-sm ml-2">/ {t("free.forever")}</span>
            </div>
            <Link href="/register" className="btn-secondary w-full justify-center mb-8 block text-center">
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
                    {f.included ? (
                      <Check size={12} />
                    ) : (
                      <X size={12} />
                    )}
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
              background:
                "linear-gradient(145deg, #1E293B 0%, #0F172A 100%)",
              boxShadow:
                "0 0 0 1px rgba(139,92,246,0.4), 0 24px 64px rgba(139,92,246,0.3)",
            }}
          >
            {/* Glow top */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, #8B5CF6, #06B6D4, transparent)",
              }}
            />
            <div
              className="orb w-48 h-48 bg-primary"
              style={{ top: "-20%", right: "-10%", opacity: 0.18 }}
            />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-display font-black text-2xl text-text-primary">
                      {t("pro.title")}
                    </h2>
                    <span className="text-xs font-black px-2.5 py-1 rounded-full bg-pro/20 text-pro border border-pro/30 flex items-center gap-1">
                      <Star size={10} className="fill-pro" /> {t("pro.popular")}
                    </span>
                  </div>
                  <p className="text-text-muted text-sm">
                    {t("pro.desc")}
                  </p>
                </div>
                <Zap size={28} className="text-primary" fill="#8B5CF6" />
              </div>

              <div className="mb-2">
                <span className="font-display font-black text-5xl text-text-primary">
                  ${billing === "monthly" ? monthlyPrice : annualPrice}
                </span>
                <span className="text-text-muted text-sm ml-2">/ {t("pro.month")}</span>
              </div>
              {billing === "annual" && (
                <p className="text-text-muted text-xs mb-6">
                  {t("pro.billedAnnually")} · ${annualTotal}/{t("billing.annual").toLowerCase()}
                </p>
              )}
              {billing === "monthly" && <div className="mb-6" />}

              {/* Pro highlights */}
              <div className="flex flex-wrap gap-2 mb-7">
                {proHighlights.map((h) => (
                  <div
                    key={h.label}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
                    style={{
                      background: `${h.color}15`,
                      border: `1px solid ${h.color}30`,
                      color: h.color,
                    }}
                  >
                    <h.icon size={11} />
                    {h.label}
                  </div>
                ))}
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="btn-primary w-full justify-center mb-8 text-base"
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  "..."
                ) : (
                  <>
                    <Zap size={18} fill="white" />
                    {t("pro.btn")}{" "}
                    {billing === "annual" ? `· ${t("billing.annual")}` : `· ${t("billing.monthly")}`}
                    <ChevronRight size={18} />
                  </>
                )}
              </button>

              <ul className="space-y-3">
                {proFeatures.map((f) => (
                  <li key={f.text} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success/20 text-success flex items-center justify-center shrink-0">
                      <Check size={12} />
                    </div>
                    <span className="text-sm text-text-secondary">
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-2 text-text-muted text-xs">
                <Lock size={12} />
                {t("secure")}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-label">{t("faq.label")}</span>
            <h2 className="font-display font-black text-4xl text-text-primary mt-3">
              {t("faq.title")}
            </h2>
          </div>
          <div className="space-y-4">
            {(t.raw("faq.items") as { q: string, a: string }[]).map((item) => (
              <div key={item.q} className="glass rounded-2xl p-6">
                <h3 className="font-bold text-text-primary mb-2">{item.q}</h3>
                <p className="text-text-secondary text-sm leading-relaxed">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
