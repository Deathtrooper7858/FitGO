"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Trophy,
  Crown,
  Medal,
  Flame,
  Loader2,
  AlertCircle,
  Star,
  RefreshCw,
  Server,
  Users,
  Database,
  ShieldCheck,
  Activity,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const GRADES = [
  { name: "S++", minPoints: 15000, color: "#FF0055" },
  { name: "S+", minPoints: 10000, color: "#FFD700" },
  { name: "S", minPoints: 5000, color: "#A855F7" },
  { name: "A", minPoints: 2000, color: "#3B82F6" },
  { name: "B", minPoints: 1000, color: "#10B981" },
  { name: "C", minPoints: 500, color: "#F59E0B" },
  { name: "D", minPoints: 100, color: "#8B4513" },
  { name: "F", minPoints: 0, color: "#6B7280" },
];

function getGrade(points: number): { name: string; color: string } {
  for (const g of GRADES) {
    if (points >= g.minPoints) return g;
  }
  return GRADES[GRADES.length - 1];
}

function getStreakMultiplier(streak: number): number {
  if (streak >= 15) return 2.0;
  if (streak >= 8) return 1.5;
  if (streak >= 3) return 1.2;
  return 1.0;
}

interface RankedUser {
  id: string;
  name: string;
  avatar_url: string | null;
  points: number;
  current_streak: number;
  role: string;
  name_color: string | null;
  is_pro: boolean;
}

interface ServerInfo {
  status: string;
  timestamp: string;
  stats: {
    total_users: number;
    total_squads: number;
    total_food_logs: number;
    pro_users: number;
    top_user: string | null;
    top_user_points: number;
    top_squad: string | null;
    top_squad_points: number;
  };
}

export default function RankingPage() {
  const t = useTranslations();
  const [ranking, setRanking] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);

  const fetchRanking = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ranking${force ? "?t=" + Date.now() : ""}`);
      const data = await res.json();
      if (data.error === "API not configured") {
        setRanking([]);
        setError(null);
      } else if (!res.ok) {
        throw new Error("Failed to fetch");
      } else {
        setRanking(data.ranking || []);
      }
    } catch {
      setError(t("ranking.errorMsg") || "Error al cargar el ranking");
    } finally {
      setLoading(false);
    }
  };

  const fetchServerInfo = async () => {
    try {
      const res = await fetch("/api/server-info");
      if (!res.ok) return;
      const data = await res.json();
      setServerInfo(data);
    } catch {
    }
  };

  useEffect(() => {
    // Avoid synchronous setState warning by deferring the initial fetch
    const timeout = setTimeout(() => {
      fetchRanking();
      fetchServerInfo();
    }, 0);
    const interval = setInterval(() => fetchRanking(), 30000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = serverInfo?.stats;

  return (
    <div className="min-h-screen" style={{ background: "#080c18" }} suppressHydrationWarning>
      <Navbar />

      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.14) 0%, transparent 70%)" }}
        />
        <div className="hero-grid absolute inset-0 opacity-30" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.3)" }}
          >
            <Trophy size={13} className="text-primary" />
            <span className="text-xs font-black text-primary uppercase tracking-wider">{t("ranking.badge") || "Ranking Global"}</span>
          </div>
          <h1
            className="font-display font-black text-5xl md:text-7xl text-text-primary mb-6 leading-tight"
            style={{ letterSpacing: "-2px" }}
          >
            {t("ranking.individualTitle") || "Ranking Individual"}{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("ranking.global") || "Global"}
            </span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
            {t("ranking.desc") || "Los mejores usuarios de FitGO ordenados por puntos de liga"}
          </p>
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Star size={14} className="text-pro" />
              {t("ranking.live") || "En vivo"} · {ranking.length} {t("ranking.users") || "usuarios"}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowInfo(!showInfo)} className="text-xs font-bold text-primary hover:text-primary-light transition-colors">
                {t("ranking.howPoints") || "¿Cómo sumar puntos?"}
              </button>
              <button onClick={() => fetchRanking(true)} disabled={loading} className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors">
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                {t("ranking.refresh") || "Actualizar"}
              </button>
            </div>
          </div>

          {showInfo && (
            <div className="glass rounded-2xl p-6 mb-6 border border-primary/20">
              <h3 className="font-bold text-text-primary mb-3">{t("ranking.pointsInfo") || "Sistema de Puntos"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-secondary font-semibold mb-2">{t("ranking.actions") || "Acciones"}</p>
                  <ul className="space-y-1.5 text-text-muted">
                    <li>• {t("ranking.mealLog") || "Registrar comida"}: 10 pts</li>
                    <li>• {t("ranking.macroPerfect") || "Macros perfectos"}: 100 pts</li>
                    <li>• {t("ranking.challenge") || "Completar desafío"}: 100 pts</li>
                    <li>• {t("ranking.activity") || "Registrar actividad"}: 50 pts</li>
                    <li>• {t("ranking.achievement") || "Logro desbloqueado"}: 10-100 pts</li>
                  </ul>
                </div>
                <div>
                  <p className="text-text-secondary font-semibold mb-2">{t("ranking.streakMulti") || "Multiplicador de racha"}</p>
                  <ul className="space-y-1.5 text-text-muted">
                    <li>• {t("ranking.streak0") || "0-2 días"}: x1.0</li>
                    <li>• {t("ranking.streak3") || "3-7 días"}: x1.2</li>
                    <li>• {t("ranking.streak8") || "8-14 días"}: x1.5</li>
                    <li>• {t("ranking.streak15") || "15+ días"}: x2.0</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
              <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-error/90">{error}</p>
              </div>
              <button
                onClick={() => fetchRanking(true)}
                className="text-xs font-bold text-error hover:text-error/80 transition-colors shrink-0"
              >
                {t("ranking.refresh") || "Reintentar"}
              </button>
            </div>
          )}

          {loading && ranking.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 size={32} className="text-primary animate-spin" />
              <p className="text-text-muted text-sm">{t("ranking.loading") || "Cargando ranking..."}</p>
            </div>
          ) : ranking.length === 0 && !error ? (
            <div className="text-center py-24">
              <Trophy size={48} className="text-text-muted mx-auto mb-4 opacity-50" />
              <p className="text-text-secondary mb-4">{t("ranking.empty") || "Aún no hay usuarios en el ranking"}</p>
              <button
                onClick={() => fetchRanking(true)}
                className="btn-secondary text-sm"
              >
                <RefreshCw size={14} />
                {t("ranking.refresh") || "Actualizar"}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {ranking.map((user, i) => {
                const rank = i + 1;
                const grade = getGrade(user.points);
                const streakMult = getStreakMultiplier(user.current_streak);
                const isTop3 = rank <= 3;
                const rankColor = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : undefined;

                return (
                  <div
                    key={user.id}
                    className={`glass rounded-xl p-4 flex items-center gap-4 transition-all hover:bg-white/5 ${isTop3 ? "border-l-2" : ""}`}
                    style={isTop3 ? { borderLeftColor: rankColor, borderLeftWidth: 3 } : {}}
                  >
                    <div className="w-10 text-center shrink-0">
                      {isTop3 ? (
                        <div className="flex items-center justify-center">
                          {rank === 1 && <Crown size={20} className="text-[#FFD700]" fill="#FFD700" />}
                          {rank === 2 && <Medal size={18} className="text-[#C0C0C0]" />}
                          {rank === 3 && <Medal size={18} className="text-[#CD7F32]" />}
                        </div>
                      ) : (
                        <span className="text-sm font-bold" style={{ color: rankColor || "#64748B" }}>#{rank}</span>
                      )}
                    </div>

                    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(135deg, #334155, #1E293B)" }}>
                      {user.avatar_url ? (
                        <Image src={user.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-text-primary">
                          {(user.name || "?")[0].toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="font-bold text-sm truncate"
                          style={{ color: user.name_color || "#F8FAFC" }}
                        >
                          {user.name || t("ranking.anonymous") || "Anónimo"}
                        </span>
                        {user.is_pro && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-pro/20 text-pro border border-pro/30 shrink-0">
                            PRO
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Flame size={11} className="text-orange-400" />
                        <span className="text-xs text-text-muted">
                          {t("ranking.streak") || "Racha"}: {user.current_streak} {t("ranking.days") || "días"}
                        </span>
                        {user.current_streak >= 3 && (
                          <span className="text-[10px] text-success font-bold">x{streakMult}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div
                        className="px-2.5 py-1 rounded-lg text-xs font-black"
                        style={{
                          background: `${grade.color}20`,
                          color: grade.color,
                          border: `1px solid ${grade.color}40`,
                        }}
                      >
                        {grade.name}
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-black text-primary">
                          {user.points.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-text-muted font-semibold -mt-0.5">
                          pts
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Server Info */}
      {stats && (
        <section className="px-6 pb-6">
          <div className="max-w-5xl mx-auto">
            <div className="glass rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Server size={14} className="text-success" />
                <h3 className="text-sm font-bold text-text-primary">{t("ranking.serverInfo") || "Estado del Servidor"}</h3>
                <span className="ml-auto flex items-center gap-1.5 text-xs text-success">
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
                  {t("ranking.serverOnline") || "En línea"}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-text-secondary">
                  <Users size={14} className="text-primary" />
                  <span><strong className="text-text-primary">{stats.total_users.toLocaleString()}</strong> {t("ranking.totalUsers") || "usuarios"}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <ShieldCheck size={14} className="text-pro" />
                  <span><strong className="text-text-primary">{stats.total_squads.toLocaleString()}</strong> {t("ranking.totalSquads") || "squads"}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Database size={14} className="text-secondary" />
                  <span><strong className="text-text-primary">{stats.total_food_logs.toLocaleString()}</strong> {t("ranking.totalLogs") || "comidas"}</span>
                </div>
                <div className="flex items-center gap-2 text-text-secondary">
                  <Activity size={14} className="text-accent" />
                  <span><strong className="text-text-primary">{stats.pro_users.toLocaleString()}</strong> {t("ranking.proUsers") || "Pro"}</span>
                </div>
              </div>
              {stats.top_user && (
                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-text-muted">
                  🏆 {t("ranking.topUser") || "Mejor usuario"}: <span className="text-text-secondary font-semibold">{stats.top_user}</span> · {stats.top_user_points.toLocaleString()} pts
                  {stats.top_squad && <span className="ml-4">👥 {t("ranking.topSquad") || "Mejor squad"}: <span className="text-text-secondary font-semibold">{stats.top_squad}</span> · {stats.top_squad_points.toLocaleString()} pts</span>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Grades Reference */}
      <section className="px-6 pb-12">
        <div className="max-w-5xl mx-auto">
          <div className="glass rounded-2xl p-6">
            <h3 className="text-sm font-bold text-text-primary mb-4">{t("ranking.grades") || "Tabla de Grados"}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {GRADES.map((g) => (
                <div key={g.name} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: `${g.color}10`, border: `1px solid ${g.color}30` }}>
                  <span className="text-xs font-black" style={{ color: g.color }}>{g.name}</span>
                  <span className="text-xs text-text-muted">{g.minPoints.toLocaleString()}+ pts</span>
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
