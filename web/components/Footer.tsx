import Link from "next/link";
import { Zap, Globe, Heart } from "lucide-react";

const footerLinks = {
  App: [
    { href: "/about", label: "Características" },
    { href: "/pricing", label: "Premium" },
    { href: "/about-us", label: "Nosotros" },
  ],
  Cuenta: [
    { href: "/login", label: "Iniciar sesión" },
    { href: "/register", label: "Crear cuenta" },
    { href: "/forgot-password", label: "Recuperar contraseña" },
  ],
  Legal: [
    { href: "/privacy", label: "Privacidad" },
    { href: "/terms", label: "Términos" },
  ],
};

export default function Footer() {
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
            <p className="text-text-secondary text-sm leading-relaxed max-w-xs">
              Tu plataforma de fitness más fluida y gamificada. Progreso,
              nutrición y entrenamiento en un solo lugar.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <a
                href="#"
                aria-label="Instagram"
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/40 transition-all"
              >
                <Globe size={16} />
              </a>
              <a
                href="#"
                aria-label="Twitter"
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/40 transition-all"
              >
                <Globe size={16} />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="w-9 h-9 rounded-xl glass flex items-center justify-center text-text-secondary hover:text-primary hover:border-primary/40 transition-all"
              >
                <Globe size={16} />
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
            © {new Date().getFullYear()} FitGO. Todos los derechos reservados.
          </p>
          <p className="text-text-muted text-xs flex items-center gap-1">
            Hecho con <Heart size={12} className="text-accent fill-accent" /> para
            tu mejor versión
          </p>
        </div>
      </div>
    </footer>
  );
}
