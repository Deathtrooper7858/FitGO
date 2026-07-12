"use client";

import { Link } from "@/i18n/routing";
import { Zap, Heart, Mail } from "lucide-react";
import { useTranslations } from "next-intl";

function InstagramIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TiktokIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34A6.34 6.34 0 0 0 15.84 15.3V8.89a8.18 8.18 0 0 0 4.75 1.52V7a4.85 4.85 0 0 1-1-.31z" />
    </svg>
  );
}

export default function Footer() {
  const t = useTranslations("footer");

  const footerLinks = {
    [t("groups.app")]: [
      { href: "/about", label: t("links.features") },
      { href: "/pricing", label: t("links.premium") },
      { href: "/ranking", label: "Ranking" },
      { href: "/squads-ranking", label: "Squads" },
      { href: "/about-us", label: t("links.about") },
    ],
    [t("groups.account")]: [
      { href: "/login", label: t("links.login") },
      { href: "/register", label: t("links.register") },
      { href: "/forgot-password", label: t("links.forgotPassword") },
    ],
    [t("groups.legal")]: [
      { href: "/privacy", label: t("links.privacy") },
      { href: "/terms", label: t("links.terms") },
    ],
  };

  const socialLinks = [
    {
      href: "https://www.instagram.com/fitgoapp",
      label: "Instagram",
      icon: <InstagramIcon size={16} />,
      hoverColor: "#E4405F",
    },
    {
      href: "https://www.tiktok.com/@fitgoapp",
      label: "TikTok",
      icon: <TiktokIcon size={16} />,
      hoverColor: "#f8fafc",
    },
    {
      href: "mailto:support@fitgo.app",
      label: "Email",
      icon: <Mail size={16} />,
      hoverColor: "#8B5CF6",
    },
  ];

  return (
    <footer
      style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        background: "linear-gradient(180deg, rgba(8,12,24,0) 0%, #05080f 100%)",
      }}
    >
      {/* Top gradient line */}
      <div
        className="h-px w-full"
        style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.4), rgba(6,182,212,0.3), transparent)" }}
      />

      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: "linear-gradient(135deg, #8B5CF6, #7C3AED, #06B6D4)",
                  boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
                }}
              >
                <Zap size={19} className="text-white" fill="white" />
              </div>
              <span
                className="font-display font-black text-2xl"
                style={{
                  background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                FitGO
              </span>
            </Link>

            <p className="text-text-secondary text-sm leading-relaxed max-w-xs mb-6">
              {t("desc")}
            </p>

            {/* Social links */}
            <div className="flex items-center gap-2.5">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target={s.href.startsWith("mailto") ? undefined : "_blank"}
                  rel={s.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-text-muted transition-all duration-200 group"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget;
                    el.style.color = s.hoverColor;
                    el.style.borderColor = `${s.hoverColor}40`;
                    el.style.background = `${s.hoverColor}12`;
                    el.style.transform = "translateY(-2px)";
                    el.style.boxShadow = `0 4px 16px ${s.hoverColor}20`;
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget;
                    el.style.color = "";
                    el.style.borderColor = "";
                    el.style.background = "rgba(255,255,255,0.04)";
                    el.style.transform = "";
                    el.style.boxShadow = "";
                  }}
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* App store badges */}
            <div className="flex items-center gap-3 mt-5">
              <a
                href="https://apps.apple.com/app/fitgo"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                App Store
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.fitgo.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold text-text-muted hover:text-text-primary transition-colors px-3 py-2 rounded-xl"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                Google Play
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-[10px] font-black uppercase tracking-[4px] text-text-muted mb-5">
                {group}
              </h4>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors hover:translate-x-0.5 inline-block"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
        >
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} FitGO. {t("rights")}
          </p>
          <p className="text-text-muted text-xs flex items-center gap-1.5">
            {t("madeWith1")}{" "}
            <Heart size={11} className="text-accent fill-accent animate-pulse" />{" "}
            {t("madeWith2")}
          </p>
        </div>
      </div>
    </footer>
  );
}
