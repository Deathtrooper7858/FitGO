"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import {
  Users,
  Crown,
  Medal,
  Trophy,
  Loader2,
  AlertCircle,
  RefreshCw,
  Shield,
  ChevronDown,
  ChevronUp,
  Flame,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TIER_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  bronce:    { emoji: "🥉", color: "#CD7F32", label: "Bronce" },
  plata:     { emoji: "🥈", color: "#C0C0C0", label: "Plata" },
  oro:       { emoji: "🥇", color: "#FFD700", label: "Oro" },
  platino:   { emoji: "💎", color: "#A8D8EA", label: "Platino" },
  esmeralda: { emoji: "🟢", color: "#50C878", label: "Esmeralda" },
  diamante:  { emoji: "💠", color: "#88CCFF", label: "Diamante" },
  maestro:   { emoji: "🔮", color: "#A855F7", label: "Maestro" },
  leyenda:   { emoji: "🔥", color: "#FF6B35", label: "Leyenda" },
  titan:     { emoji: "⚡", color: "#FF0055", label: "Titán" },
  celestial: { emoji: "👑", color: "#FFD700", label: "Celestial" },
};

const RANK_STYLES = [
  { color: "#FFD700", bg: "rgba(255,215,0,0.1)", border: "rgba(255,215,0,0.3)", glow: "rgba(255,215,0,0.2)" },
  { color: "#C0C0C0", bg: "rgba(192,192,192,0.08)", border: "rgba(192,192,192,0.25)", glow: "rgba(192,192,192,0.12)" },
  { color: "#CD7F32", bg: "rgba(205,127,50,0.1)", border: "rgba(205,127,50,0.25)", glow: "rgba(205,127,50,0.12)" },
];

interface Squad {
  id: string;
  name: string;
  league_tier: string;
  points: number;
  invite_code: string;
  created_by: string;
  created_at?: string;
  member_count?: number;
}

interface SquadMember {
  user_id: string;
  name: string;
  avatar_url?: string;
  league_points: number;
  current_streak: number;
  name_color?: string;
  total_league_points?: number;
}

export default function SquadsRankingPage() {
  const t = useTranslations();
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedSquad, setExpandedSquad] = useState<string | null>(null);
  const [squadMembers, setSquadMembers] = useState<Record<string, SquadMember[]>>({});
  const [loadingMembers, setLoadingMembers] = useState<Record<string, boolean>>({});

  const fetchSquads = useCallback(async (force = false) => {
    setError(null);
    try {
      const res = await fetch(`/api/squads-ranking${force ? "?t=" + Date.now() : ""}`);
      const data = await res.json();

      if (data.error === "API not configured") {
        setSquads([]);
        setError(null);
      } else if (!res.ok) {
        throw new Error("Failed to fetch");
      } else {
        setSquads(data.squads || []);
      }
    } catch {
      setError(t("ranking.errorMsg") || "Error al cargar el ranking de squads");
    } finally {
      setLoading(false);
    }
  }, [t]);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchSquads(true);
  };

  const toggleSquad = async (squadId: string) => {
    if (expandedSquad === squadId) {
      setExpandedSquad(null);
      return;
    }

    setExpandedSquad(squadId);

    if (!squadMembers[squadId] && !loadingMembers[squadId]) {
      setLoadingMembers(prev => ({ ...prev, [squadId]: true }));
      try {
        const res = await fetch(`/api/squads/${squadId}/members`);
        if (res.ok) {
          const data = await res.json();
          setSquadMembers(prev => ({ ...prev, [squadId]: data.members || [] }));
        }
      } catch (err) {
        console.error("Failed to fetch members", err);
      } finally {
        setLoadingMembers(prev => ({ ...prev, [squadId]: false }));
      }
    }
  };

  useEffect(() => {
    (async () => { await fetchSquads(); })();
    const interval = setInterval(() => fetchSquads(), 30000);
    return () => clearInterval(interval);
  }, [fetchSquads]);

  return (
    <div className="min-h-screen" style={{ background: "#080c18" }} suppressHydrationWarning>
      <Navbar />

      {/* Hero */}
      <section className="relative pt-40 pb-20 px-6 text-center overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(139,92,246,0.14) 0%, transparent 70%)" }}
        />
        <div className="hero-grid absolute inset-0 opacity-40" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-7"
            style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}
          >
            <Trophy size={13} style={{ color: "#F59E0B" }} />
            <span className="text-xs font-black uppercase tracking-wider" style={{ color: "#F59E0B" }}>
              {t("squadsRanking.badge") || "Ranking de Squads"}
            </span>
          </div>
          <h1
            className="font-display font-black text-5xl md:text-7xl text-text-primary mb-6 leading-tight"
            style={{ letterSpacing: "-2px" }}
          >
            {t("squadsRanking.title") || "Ranking de Squads"}{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              {t("squadsRanking.global") || "Global"}
            </span>
          </h1>
          <p className="text-text-secondary text-lg md:text-xl leading-relaxed max-w-lg mx-auto">
            {t("squadsRanking.desc") || "Los mejores squads de FitGO compitiendo en las Ligas Élite"}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Controls bar */}
          <div
            className="flex items-center justify-between mb-6 px-5 py-3 rounded-2xl"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex items-center gap-2.5 text-text-muted text-sm">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <Shield size={13} style={{ color: "#10B981" }} />
              <span className="font-semibold">
                {t("squadsRanking.live") || "En vivo"} · {squads.length} {t("squadsRanking.squads") || "squads"}
              </span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors px-3 py-1.5 rounded-xl hover:bg-white/5"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              {t("ranking.refresh") || "Actualizar"}
            </button>
          </div>

          {/* Error state */}
          {error && (
            <div
              className="mb-6 p-4 rounded-2xl flex items-start gap-3"
              style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-error/90">{error}</p>
              </div>
              <button
                onClick={handleRefresh}
                className="text-xs font-bold text-error hover:text-error/80 transition-colors shrink-0"
              >
                {t("ranking.refresh") || "Reintentar"}
              </button>
            </div>
          )}

          {/* Loading state */}
          {loading && squads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
              >
                <Loader2 size={28} className="text-primary animate-spin" />
              </div>
              <p className="text-text-muted text-sm font-medium">{t("squadsRanking.loading") || "Cargando squads..."}</p>
            </div>
          ) : squads.length === 0 && !error ? (
            <div
              className="text-center py-32 rounded-3xl"
              style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <Users size={28} className="text-text-muted" />
              </div>
              <p className="text-text-secondary font-medium">{t("squadsRanking.noSquads") || "No hay squads aún"}</p>
              <p className="text-text-muted text-sm mt-1">{t("squadsRanking.noSquadsSubtitle")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {squads.map((squad, i) => {
                const rank = i + 1;
                const tier = TIER_CONFIG[squad.league_tier] || TIER_CONFIG.bronce;
                const isTop3 = rank <= 3;
                const rankStyle = isTop3 ? RANK_STYLES[rank - 1] : null;
                const isExpanded = expandedSquad === squad.id;
                const members = squadMembers[squad.id];
                const isLoadingMembers = loadingMembers[squad.id];

                return (
                  <div
                    key={squad.id}
                    className="rounded-2xl overflow-hidden transition-all duration-300"
                    style={{
                      background: isTop3
                        ? `linear-gradient(135deg, ${rankStyle!.bg}, rgba(8,12,24,0.9))`
                        : "rgba(15,23,42,0.5)",
                      border: isTop3
                        ? `1px solid ${rankStyle!.border}`
                        : isExpanded
                        ? "1px solid rgba(139,92,246,0.25)"
                        : "1px solid rgba(255,255,255,0.06)",
                      boxShadow: isTop3 ? `0 8px 32px ${rankStyle!.glow}` : "none",
                    }}
                  >
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer select-none hover:bg-white/3 transition-colors"
                      onClick={() => toggleSquad(squad.id)}
                    >
                      {/* Rank badge */}
                      <div className="w-10 text-center shrink-0">
                        {rank === 1 && <Crown size={22} style={{ color: "#FFD700", filter: "drop-shadow(0 0 6px rgba(255,215,0,0.6))" }} className="mx-auto" fill="#FFD700" />}
                        {rank === 2 && <Medal size={20} style={{ color: "#C0C0C0" }} className="mx-auto" />}
                        {rank === 3 && <Medal size={20} style={{ color: "#CD7F32" }} className="mx-auto" />}
                        {rank > 3 && (
                          <span
                            className="text-sm font-black"
                            style={{ color: "rgba(148,163,184,0.6)" }}
                          >
                            #{rank}
                          </span>
                        )}
                      </div>

                      {/* Tier icon */}
                      <div
                        className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center text-xl transition-transform duration-200 hover:scale-110"
                        style={{
                          background: `${tier.color}15`,
                          border: `1px solid ${tier.color}35`,
                          boxShadow: `0 4px 12px ${tier.color}20`,
                        }}
                      >
                        {tier.emoji}
                      </div>

                      {/* Squad info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm text-text-primary truncate">
                            {squad.name}
                          </span>
                          <span
                            className="text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 uppercase"
                            style={{
                              background: `${tier.color}18`,
                              color: tier.color,
                              border: `1px solid ${tier.color}35`,
                            }}
                          >
                            {tier.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-text-muted flex items-center gap-1">
                            <Users size={10} className="inline" />
                            {squad.member_count || "?"} {t("squadsRanking.members") || "miembros"}
                          </span>
                        </div>
                      </div>

                      {/* Points + chevron */}
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <div>
                          <div
                            className="text-base font-black"
                            style={{
                              background: isTop3
                                ? `linear-gradient(135deg, ${rankStyle!.color}, ${rankStyle!.color}99)`
                                : "linear-gradient(135deg, #a78bfa, #06b6d4)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                            }}
                          >
                            {squad.points?.toLocaleString() || 0}
                          </div>
                          <div className="text-[10px] text-text-muted font-semibold">pts</div>
                        </div>
                        <div className="text-text-muted">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded members */}
                    {isExpanded && (
                      <div
                        className="px-4 pb-4 pt-2"
                        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        {isLoadingMembers ? (
                          <div className="flex justify-center py-6">
                            <Loader2 size={18} className="text-primary animate-spin" />
                          </div>
                        ) : members && members.length > 0 ? (
                          <div className="space-y-1.5 mt-2">
                            {members.map((member, idx) => (
                              <div
                                key={member.user_id}
                                className="flex items-center justify-between p-2.5 rounded-xl transition-colors hover:bg-white/5"
                                style={{ background: "rgba(255,255,255,0.03)" }}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-black text-text-muted w-5 text-center">
                                    {idx + 1}
                                  </span>
                                  {member.avatar_url ? (
                                    <Image
                                      src={member.avatar_url}
                                      alt={member.name}
                                      width={28}
                                      height={28}
                                      unoptimized
                                      className="w-7 h-7 rounded-full object-cover"
                                    />
                                  ) : (
                                    <div
                                      className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black text-white"
                                      style={{
                                        background: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                                      }}
                                    >
                                      {member.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span
                                    className="text-sm font-semibold text-text-primary truncate max-w-35 sm:max-w-55"
                                    style={member.name_color ? { color: member.name_color } : {}}
                                  >
                                    {member.name}
                                  </span>
                                  {member.current_streak > 0 && (
                                    <span className="flex items-center gap-0.5 text-[11px] font-bold" style={{ color: "#F59E0B" }}>
                                      <Flame size={10} />
                                      {member.current_streak}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Zap size={11} style={{ color: "#8B5CF6" }} />
                                  <span className="text-xs font-black" style={{ color: "#a78bfa" }}>
                                    {member.league_points?.toLocaleString() || 0}
                                  </span>
                                  <span className="text-[10px] text-text-muted">pts</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-5 text-xs text-text-muted">
                            {t("squadsRanking.noMembers") || "No se pudieron cargar los miembros"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
