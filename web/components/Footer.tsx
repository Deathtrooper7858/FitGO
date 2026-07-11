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

  return (
    <footer className="border-t border-white/5 bg-fitgo-dark/60">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-btn flex items-center justify-center glow-primary">
                <Zap size={18} className="text-white" fill="white" />
              </div>
              <span className="font-display font-black text-2xl gradient-text">
                FitGO
              </span>
            </Link>
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs mb-6">
              {t("desc")}
            </p>
            <div className="flex items-center gap-3">
              <a
                href="https://www.instagram.com/fitgoapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-[#E4405F] hover:border-[#E4405F]/40 transition-all"
              >
                <InstagramIcon size={16} />
              </a>
              <a
                href="https://www.tiktok.com/@fitgoapp"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-text-primary hover:border-white/20 transition-all"
              >
                <TiktokIcon size={16} />
              </a>
              <a
                href="mailto:support@fitgo.app"
                aria-label="Email"
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/40 transition-all"
              >
                <Mail size={16} />
              </a>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">
                {group}
              </h4>
              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-text-secondary hover:text-text-primary transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-text-muted text-xs">
            © {new Date().getFullYear()} FitGO. {t("rights")}
          </p>
          <p className="text-text-muted text-xs flex items-center gap-1">
            {t("madeWith1")} <Heart size={12} className="text-accent fill-accent" /> {t("madeWith2")}
          </p>
        </div>
      </div>
    </footer>
  );
}
