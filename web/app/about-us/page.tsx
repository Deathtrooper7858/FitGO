import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Code2, Dumbbell, Heart, Rocket, Star, Zap } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nosotros — FitGO",
  description: "Conoce al equipo detrás de FitGO y la visión que nos mueve.",
};

const team = [
  {
    name: "El Equipo FitGO",
    role: "Fundadores & Desarrolladores",
    bio: "Somos apasionados del fitness y la tecnología. Creamos FitGO porque ninguna app existente nos convencía — demasiado lentas, demasiado genéricas, sin alma. Quisimos cambiar eso.",
    icon: Code2,
    color: "#8B5CF6",
    tags: ["React Native", "Supabase", "TypeScript", "IA"],
  },
];

const values = [
  {
    icon: Zap,
    title: "Velocidad ante todo",
    desc: "Cada pantalla de FitGO está diseñada para que registres tu progreso en segundos, no en minutos.",
    color: "#F59E0B",
  },
  {
    icon: Dumbbell,
    title: "Para quienes se esfuerzan",
    desc: "FitGO está hecho para personas que se toman en serio su progreso físico, sin importar su nivel.",
    color: "#06B6D4",
  },
  {
    icon: Heart,
    title: "Hecho con pasión",
    desc: "Cada feature, cada animación, cada detalle refleja el amor que tenemos por el fitness y el diseño.",
    color: "#F43F5E",
  },
  {
    icon: Rocket,
    title: "Siempre mejorando",
    desc: "Lanzamos actualizaciones constantes basadas en el feedback de nuestra comunidad.",
    color: "#10B981",
  },
];

const timeline = [
  {
    year: "2024",
    title: "La idea nace",
    desc: "Frustrados con las apps de fitness existentes, empezamos a bocetar FitGO en papel.",
  },
  {
    year: "2025 Q1",
    title: "Primer prototipo",
    desc: "El primer build de FitGO corre en nuestros teléfonos. El tracker de peso funciona por primera vez.",
  },
  {
    year: "2025 Q2",
    title: "Beta privada",
    desc: "Invitamos a los primeros 100 usuarios. El feedback nos cambia la perspectiva del producto.",
  },
  {
    year: "2025 Q3",
    title: "Lanzamiento público",
    desc: "FitGO llega a App Store y Google Play. La comunidad crece orgánicamente.",
  },
  {
    year: "2026",
    title: "FitGO Web",
    desc: "Lanzamos la plataforma web para que puedas gestionar tu cuenta y suscripción desde el navegador.",
  },
];

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-background">
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
          <span className="section-label">El equipo</span>
          <h1 className="font-display font-black text-5xl md:text-6xl text-text-primary mt-4 mb-6">
            Detrás de{" "}
            <span className="gradient-text">FitGO</span>
          </h1>
          <p className="text-text-secondary text-xl leading-relaxed">
            Somos un equipo pequeño con una misión grande: crear la mejor
            experiencia de fitness que haya existido.
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
                Nuestra misión
              </h2>
              <p className="text-text-secondary text-lg leading-relaxed max-w-2xl mx-auto">
                Hacer que el fitness sea{" "}
                <strong className="text-text-primary">
                  accesible, motivador y divertido
                </strong>{" "}
                para todos. Crear una herramienta tan buena que no quieras usar
                ninguna otra. Superar a Fitia y MyFitnessPal en velocidad,
                diseño y experiencia de usuario.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-label">Quiénes somos</span>
            <h2 className="font-display font-black text-4xl text-text-primary mt-3">
              El equipo
            </h2>
          </div>
          <div className="flex justify-center">
            {team.map((member) => (
              <div
                key={member.name}
                className="glass rounded-3xl p-8 max-w-lg w-full card-hover text-center"
                style={{
                  border: `1px solid ${member.color}25`,
                  boxShadow: `0 12px 40px ${member.color}15`,
                }}
              >
                <div
                  className="w-20 h-20 rounded-3xl mx-auto mb-5 flex items-center justify-center"
                  style={{
                    background: `radial-gradient(circle, ${member.color}40, ${member.color}10)`,
                    boxShadow: `0 0 24px ${member.color}40`,
                  }}
                >
                  <member.icon size={36} style={{ color: member.color }} />
                </div>
                <h3 className="font-display font-black text-2xl text-text-primary mb-1">
                  {member.name}
                </h3>
                <p className="text-text-muted text-sm mb-4">{member.role}</p>
                <p className="text-text-secondary leading-relaxed mb-6">
                  {member.bio}
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {member.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        background: `${member.color}15`,
                        border: `1px solid ${member.color}30`,
                        color: member.color,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="section-label">Lo que nos define</span>
            <h2 className="font-display font-black text-4xl text-text-primary mt-3">
              Nuestros valores
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {values.map((v) => (
              <div
                key={v.title}
                className="glass rounded-2xl p-7 card-hover flex gap-5"
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: `${v.color}20`,
                    border: `1px solid ${v.color}30`,
                  }}
                >
                  <v.icon size={22} style={{ color: v.color }} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-text-primary mb-1">
                    {v.title}
                  </h3>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <span className="section-label">Nuestra historia</span>
            <h2 className="font-display font-black text-4xl text-text-primary mt-3">
              El camino hasta aquí
            </h2>
          </div>
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-6 top-0 bottom-0 w-px bg-linear-to-b from-primary via-secondary to-accent" />

            <div className="space-y-10">
              {timeline.map((item, i) => (
                <div key={i} className="flex gap-8 pl-4">
                  <div className="relative shrink-0">
                    <div className="w-5 h-5 rounded-full bg-primary glow-primary relative z-10 mt-1" />
                  </div>
                  <div className="glass rounded-2xl p-6 flex-1 card-hover">
                    <span className="text-xs font-black text-primary uppercase tracking-widest">
                      {item.year}
                    </span>
                    <h3 className="font-display font-bold text-lg text-text-primary mt-1 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-text-secondary text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
