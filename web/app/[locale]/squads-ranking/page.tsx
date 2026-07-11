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
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const TIER_CONFIG: Record<string, { emoji: string; color: string; glow: string }> = {
  bronce:    { emoji: "🥉", color: "#CD7F32", glow: "#CD7F32" },
  plata:     { emoji: "🥈", color: "#C0C0C0", glow: "#C0C0C0" },
  oro:       { emoji: "🥇", color: "#FFD700", glow: "#FFD700" },
  platino:   { emoji: "💎", color: "#A8D8EA", glow: "#A8D8EA" },
  esmeralda: { emoji: "🟢", color: "#50C878", glow: "#50C878" },
  diamante:  { emoji: "💠", color: "#88CCFF", glow: "#88CCFF" },
  maestro:   { emoji: "🔮", color: "#A855F7", glow: "#A855F7" },
  leyenda:   { emoji: "🔥", color: "#FF6B35", glow: "#FF6B35" },
  titan:     { emoji: "⚡", color: "#FF0055", glow: "#FF0055" },
  celestial: { emoji: "👑", color: "#FFD700", glow: "#FFD700" },
};

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
    (async () => {
      await fetchSquads();
    })();
    const interval = setInterval(() => fetchSquads(), 30000);
    return () => clearInterval(interval);
  }, [fetchSquads]);

  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />

      <section className="relative pt-40 pb-24 px-6 text-center overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(245,158,11,0.12) 0%, transparent 70%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-pro/20 border border-pro/30 mb-6">
            <Trophy size={12} className="text-pro" />
            <span className="text-xs font-bold text-pro uppercase tracking-wider">{t("squadsRanking.badge") || "Ranking de Squads"}</span>
          </div>
          <h1 className="font-display font-black text-5xl md:text-6xl text-text-primary mb-6">
            {t("squadsRanking.title") || "Ranking de Squads"}{" "}
            <span className="gradient-text">{t("squadsRanking.global") || "Global"}</span>
          </h1>
          <p className="text-text-secondary text-xl leading-relaxed">{t("squadsRanking.desc") || "Los mejores squads de FitGO compitiendo en las Ligas Élite"}</p>
        </div>
      </section>

      <section className="px-6 pb-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-text-muted text-sm">
              <Shield size={14} className="text-pro" />
              {t("squadsRanking.live") || "En vivo"} · {squads.length} {t("squadsRanking.squads") || "squads"}
            </div>
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              {t("ranking.refresh") || "Actualizar"}
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
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

          {loading && squads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 size={32} className="text-primary animate-spin" />
              <p className="text-text-muted text-sm">{t("squadsRanking.loading") || "Cargando squads..."}</p>
            </div>
          ) : squads.length === 0 && !error ? (
            <div className="text-center py-24">
              <Users size={48} className="text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary">{t("squadsRanking.noSquads") || "No hay squads aún"}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {squads.map((squad, i) => {
                const rank = i + 1;
                const tier = TIER_CONFIG[squad.league_tier] || TIER_CONFIG.bronce;
                const isTop3 = rank <= 3;
                const rankColor = rank === 1 ? "#FFD700" : rank === 2 ? "#C0C0C0" : rank === 3 ? "#CD7F32" : undefined;

                const isExpanded = expandedSquad === squad.id;
                const members = squadMembers[squad.id];
                const isLoadingMembers = loadingMembers[squad.id];

                return (
                  <div key={squad.id} className={`glass rounded-xl transition-all ${isTop3 ? "border-l-2" : ""} ${isExpanded ? "ring-1 ring-white/10" : "hover:bg-white/5"}`} style={isTop3 ? { borderLeftColor: rankColor, borderLeftWidth: 3 } : {}}>
                    <div
                      className="p-4 flex items-center gap-4 cursor-pointer"
                      onClick={() => toggleSquad(squad.id)}
                    >
                      <div className="w-10 text-center shrink-0">
                        {isTop3 ? (
                          <div className="flex items-center justify-center">
                            {rank === 1 && <Crown size={20} className="text-[#FFD700]" fill="#FFD700" />}
                            {rank === 2 && <Medal size={18} className="text-[#C0C0C0]" />}
                            {rank === 3 && <Medal size={18} className="text-[#CD7F32]" />}
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-text-muted">#{rank}</span>
                        )}
                      </div>

                      <div
                        className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg"
                        style={{
                          background: `${tier.color}20`,
                          border: `1px solid ${tier.color}40`,
                        }}
                      >
                        {tier.emoji}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-text-primary truncate">
                            {squad.name}
                          </span>
                          <span
                            className="text-[10px] font-black px-1.5 py-0.5 rounded shrink-0"
                            style={{
                              background: `${tier.color}20`,
                              color: tier.color,
                              border: `1px solid ${tier.color}40`,
                            }}
                          >
                            {squad.league_tier.charAt(0).toUpperCase() + squad.league_tier.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-text-muted">
                            <Users size={10} className="inline mr-1" />
                            {squad.member_count || "?"} {t("squadsRanking.members") || "miembros"}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex items-center gap-4">
                        <div>
                          <div className="text-sm font-black text-primary">
                            {squad.points?.toLocaleString() || 0}
                          </div>
                          <div className="text-[10px] text-text-muted font-semibold -mt-0.5">pts</div>
                        </div>
                        <div className="text-text-muted">
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </div>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-white/5 animate-in slide-in-from-top-2">
                        {isLoadingMembers ? (
                          <div className="flex justify-center py-4">
                            <Loader2 size={16} className="text-primary animate-spin" />
                          </div>
                        ) : members && members.length > 0 ? (
                          <div className="space-y-2 mt-2">
                            {members.map((member, idx) => (
                              <div key={member.user_id} className="flex items-center justify-between p-2 rounded-lg bg-white/5">
                                <div className="flex items-center gap-3">
                                  <span className="text-xs font-bold text-text-muted w-4">{idx + 1}</span>
                                  {member.avatar_url ? (
                                    <Image src={member.avatar_url} alt={member.name} width={24} height={24} unoptimized className="w-6 h-6 rounded-full object-cover" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-surface flex items-center justify-center text-[10px] font-bold text-text-muted">
                                      {member.name.charAt(0).toUpperCase()}
                                    </div>
                                  )}
                                  <span className="text-sm font-semibold text-text-primary truncate max-w-30 sm:max-w-50" style={member.name_color ? { color: member.name_color } : {}}>
                                    {member.name}
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs font-bold text-pro">{member.league_points?.toLocaleString() || 0} pts</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-xs text-text-muted">
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
