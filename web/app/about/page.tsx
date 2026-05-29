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
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "La App — FitGO",
  description:
    "Descubre todas las funcionalidades de FitGO: progreso, nutrición, entrenamientos y coach con IA.",
};

const pillars = [
  {
    id: "progreso",
    icon: Scale,
    title: "Registro de Progreso",
    subtitle: "Tu evolución, siempre visible",
    color: "#8B5CF6",
    glow: "rgba(139,92,246,0.3)",
    description:
      "FitGO convierte el seguimiento de tu cuerpo en una experiencia visual y motivadora. Cada dato que registras alimenta gráficas fluidas que te muestran tu transformación real.",
    features: [
      { icon: TrendingUp, text: "Gráfica de peso corporal interactiva" },
      { icon: Target, text: "Medidas corporales detalladas (cintura, pecho, etc.)" },
      { icon: Layers, text: "Historial completo con filtros por semana/mes/año" },
      { icon: Medal, text: "Logros y hitos desbloqueables" },
    ],
  },
  {
    id: "nutricion",
    icon: Apple,
    title: "Nutrición Inteligente",
    subtitle: "Come bien, sin complicaciones",
    color: "#F43F5E",
    glow: "rgba(244,63,94,0.3)",
    description:
      "Una base de datos masiva de alimentos — incluyendo carnes, frutas, comida local latinoamericana — con escáner de código de barras y registro de macros en tiempo real.",
    features: [
      { icon: Scan, text: "Escáner de código de barras" },
      { icon: Apple, text: "Base de datos de alimentos y carnes" },
      { icon: Target, text: "Metas de macros personalizadas (proteína, carbos, grasas)" },
      { icon: Flame, text: "Cálculo automático de calorías quemadas" },
    ],
  },
  {
    id: "entrenamiento",
    icon: Dumbbell,
    title: "Entrenamiento",
    subtitle: "Cada músculo, bajo control",
    color: "#06B6D4",
    glow: "rgba(6,182,212,0.3)",
    description:
      "Un mapa muscular interactivo 3D que te permite seleccionar qué músculo trabajar y obtener rutinas optimizadas al instante. Registra cada serie, peso y repetición.",
    features: [
      { icon: Dumbbell, text: "Mapa muscular interactivo" },
      { icon: Layers, text: "Rutinas prediseñadas y personalizadas" },
      { icon: TrendingUp, text: "Seguimiento de fuerza por ejercicio" },
      { icon: Target, text: "Planificador semanal de entrenamientos" },
    ],
  },
  {
    id: "coach",
    icon: Bot,
    title: "Coach con IA",
    subtitle: "Tu entrenador personal, siempre disponible",
    color: "#10B981",
    glow: "rgba(16,185,129,0.3)",
    description:
      "El Coach de FitGO analiza tu historial, tus metas y tu progreso para darte recomendaciones personalizadas. Como tener un nutricionista y entrenador en el bolsillo.",
    features: [
      { icon: Bot, text: "Respuestas personalizadas basadas en tu perfil" },
      { icon: TrendingUp, text: "Análisis inteligente de tu progreso" },
      { icon: Target, text: "Planes de nutrición adaptativos" },
      { icon: Flame, text: "Motivación y ajustes en tiempo real" },
    ],
  },
  {
    id: "social",
    icon: Trophy,
    title: "Gamificación Social",
    subtitle: "Compite, gana, supérate",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.3)",
    description:
      "FitGO va más allá de registrar datos. Con las Guerras de Macros y las Ligas Élite, conviertes tu disciplina en competencia sana con amigos y la comunidad global.",
    features: [
      { icon: Swords, text: "Guerras de Macros semanales" },
      { icon: Trophy, text: "Ligas Élite con clasificación global" },
      { icon: Medal, text: "Logros y badges coleccionables" },
      { icon: TrendingUp, text: "Leaderboards en tiempo real" },
    ],
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
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
          <span className="section-label mb-4 inline-block">La aplicación</span>
          <h1 className="font-display font-black text-5xl md:text-7xl text-text-primary mt-2 mb-8 leading-tight">
            Todo lo que tu <br className="hidden md:block" />
            <span className="gradient-text">cuerpo necesita</span>
          </h1>
          <p className="text-text-secondary text-xl md:text-2xl leading-relaxed font-medium max-w-2xl mx-auto">
            FitGO reúne en una sola app todo lo que necesitas para transformar
            tu cuerpo y mantener la motivación alta, día tras día.
          </p>
        </div>
      </section>

      {/* Pillars */}
      <section className="pb-32 px-6">
        <div className="max-w-6xl mx-auto space-y-32 md:space-y-48">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.id}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center group"
            >
              {/* Text */}
              <div className={`order-2 ${i % 2 === 0 ? "lg:order-1" : "lg:order-2"} flex flex-col items-start`}>
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-xs font-bold uppercase tracking-wider transition-all duration-300 group-hover:scale-105"
                  style={{
                    background: `${pillar.color}15`,
                    border: `1px solid ${pillar.color}40`,
                    color: pillar.color,
                  }}
                >
                  <pillar.icon size={14} />
                  {pillar.subtitle}
                </div>
                <h2 className="font-display font-black text-4xl md:text-5xl text-text-primary mb-5">
                  {pillar.title}
                </h2>
                <p className="text-text-secondary text-lg md:text-xl leading-relaxed mb-10">
                  {pillar.description}
                </p>
                <ul className="space-y-4 w-full">
                  {pillar.features.map((f) => (
                    <li key={f.text} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg"
                        style={{
                          background: `${pillar.color}20`,
                          border: `1px solid ${pillar.color}40`,
                          boxShadow: `0 4px 20px ${pillar.color}20`,
                        }}
                      >
                        <f.icon size={18} style={{ color: pillar.color }} />
                      </div>
                      <span className="text-text-primary text-[15px] font-medium">
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Visual card */}
              <div className={`relative order-1 ${i % 2 === 0 ? "lg:order-2" : "lg:order-1"} w-full`}>
                <div
                  className="absolute inset-0 rounded-[3rem] blur-[80px] opacity-20 transition-opacity duration-500 group-hover:opacity-40"
                  style={{ background: pillar.color }}
                />
                <div
                  className="relative glass rounded-5xl p-10 md:p-14 flex flex-col items-center justify-center min-h-87.5 md:min-h-112.5 transition-all duration-500 hover:-translate-y-2"
                  style={{
                    boxShadow: `0 25px 80px ${pillar.glow}`,
                    border: `1px solid ${pillar.color}30`,
                    background: `linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 100%)`,
                  }}
                >
                  <div
                    className="w-24 h-24 rounded-3xl flex items-center justify-center mb-8 animate-float"
                    style={{
                      background: `radial-gradient(circle, ${pillar.glow}, ${pillar.color}20)`,
                      boxShadow: `0 0 40px ${pillar.glow}, inset 0 0 20px rgba(255,255,255,0.1)`,
                      border: `1px solid ${pillar.color}50`,
                    }}
                  >
                    <pillar.icon size={44} style={{ color: pillar.color }} />
                  </div>
                  <h3
                    className="font-display font-black text-3xl md:text-4xl mb-3 text-center"
                    style={{ color: pillar.color, textShadow: `0 2px 20px ${pillar.glow}` }}
                  >
                    {pillar.title}
                  </h3>
                  <p className="text-text-muted text-base font-medium text-center max-w-xs">
                    {pillar.subtitle}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center glass rounded-3xl p-12">
          <h2 className="font-display font-black text-4xl text-text-primary mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-text-secondary mb-8">
            Crea tu cuenta gratis y empieza hoy mismo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary">
              Comenzar gratis <ChevronRight size={18} />
            </Link>
            <Link href="/pricing" className="btn-secondary">
              Ver planes Pro
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
