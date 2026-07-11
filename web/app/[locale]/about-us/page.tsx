import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Code2, Dumbbell, Heart, Rocket, Star, Zap } from "lucide-react";
import type { Metadata } from "next";
import { useTranslations } from "next-intl";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conoce al equipo detrás de FitGO y la visión que nos mueve. Creamos la mejor experiencia de fitness que haya existido.",
};


const valuesIcons = {
  speed: Zap,
  effort: Dumbbell,
  passion: Heart,
  improving: Rocket
};

export default function AboutUsPage() {
  const t = useTranslations("aboutUs");

  const valuesKeys = ["speed", "effort", "passion", "improving"];
  const valuesColors = ["#F59E0B", "#06B6D4", "#F43F5E", "#10B981"];
  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(6,182,212,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative z-10 max-w-3xl mx-auto">
          <span className="section-label">{t("hero.label")}</span>
          <h1 className="font-display font-black text-5xl md:text-6xl text-text-primary mt-4 mb-6">
            {t("hero.title1")}{" "}
            <span className="gradient-text">FitGO</span>
          </h1>
          <p className="text-text-secondary text-xl leading-relaxed">
            {t("hero.desc")}
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="pb-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div
            className="glass rounded-3xl p-10 md:p-14 text-center relative overflow-hidden"
            style={{
              boxShadow: "0 20px 60px rgba(139,92,246,0.2)",
              border: "1px solid rgba(139,92,246,0.2)",
            }}
          >
            <div
              className="orb w-60 h-60 bg-primary"
              style={{ top: "-30%", right: "-10%", opacity: 0.15 }}
            />
            <div
              className="orb w-48 h-48 bg-secondary"
              style={{ bottom: "-20%", left: "-5%", opacity: 0.1 }}
            />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-3xl bg-gradient-btn glow-primary mx-auto mb-6 flex items-center justify-center">
                <Star size={28} className="text-white fill-white" />
              </div>
              <h2 className="font-display font-black text-3xl md:text-4xl text-text-primary mb-4">
                {t("mission.title")}
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto">
                {t("mission.desc")}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-label">{t("teamLabel")}</span>
            <h2 className="font-display font-black text-4xl text-text-primary mt-3">
              {t("teamTitle")}
            </h2>
          </div>
          <div className="flex justify-center">
            <div
              className="glass rounded-3xl p-8 max-w-lg w-full card-hover text-center"
              style={{
                border: `1px solid #8B5CF625`,
                boxShadow: `0 12px 40px #8B5CF615`,
              }}
            >
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, #8B5CF640, #8B5CF610)`,
                  boxShadow: `0 0 24px #8B5CF640`,
                }}
              >
                <Code2 size={36} style={{ color: "#8B5CF6" }} />
              </div>
              <h3 className="font-display font-black text-2xl text-text-primary mb-1">
                {t("team.title")}
              </h3>
              <p className="text-text-muted text-sm mb-4">{t("team.subtitle")}</p>
              <p className="text-text-secondary leading-relaxed mb-6">
                {t("team.desc")}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {(t.raw("team.tags") as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs font-bold"
                    style={{
                      background: `#8B5CF615`,
                      border: `1px solid #8B5CF630`,
                      color: "#8B5CF6",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-label">{t("valuesLabel")}</span>
            <h2 className="font-display font-black text-4xl text-text-primary mt-3">
              {t("valuesTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {valuesKeys.map((vKey, i) => {
              const Icon = valuesIcons[vKey as keyof typeof valuesIcons];
              const color = valuesColors[i];
              return (
              <div
                key={vKey}
                className="glass rounded-2xl p-7 card-hover flex gap-5"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${color}20`,
                    border: `1px solid ${color}30`,
                  }}
                >
                  <Icon size={22} style={{ color: color }} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary mb-1">
                    {t(`values.${vKey}.title`)}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {t(`values.${vKey}.desc`)}
                  </p>
                </div>
              </div>
            )})}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
