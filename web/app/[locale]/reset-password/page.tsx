"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Lock, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useTranslations } from "next-intl";

export default function ResetPasswordPage() {
  const t = useTranslations("auth.reset");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setStatus("error");
      setMessage(t("errorMismatch"));
      return;
    }
    if (password.length < 6) {
      setStatus("error");
      setMessage(t("errorLength"));
      return;
    }
    setStatus("loading");
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("error");
      setMessage(error.message);
    } else {
      setStatus("success");
      setMessage(t("successMsg"));
      setTimeout(() => router.push("/login"), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-fitgo-dark flex flex-col justify-center items-center px-6 relative overflow-hidden" suppressHydrationWarning>
      <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(135deg, #0A0512 0%, #24124D 100%)", opacity: 0.8 }} />
      <div className="orb w-96 h-96 bg-primary z-0" style={{ top: "-10%", left: "-10%", opacity: 0.15 }} />
      <div className="orb w-64 h-64 bg-secondary z-0" style={{ bottom: "-10%", right: "-10%", opacity: 0.1 }} />

      <div className="relative z-10 w-full max-w-md">
        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-text-muted hover:text-text-primary transition-colors text-sm font-semibold mb-8"
        >
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-btn glow-primary flex items-center justify-center">
              <Zap size={28} className="text-white" fill="white" />
            </div>
            <h1 className="font-display font-black text-3xl gradient-text">FitGO</h1>
          </div>
          <p className="text-text-secondary mt-2">{t("title")}</p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-card border border-white/10">
          {status === "success" ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/20 text-success mx-auto flex items-center justify-center">
                <CheckCircle size={32} />
              </div>
              <p className="text-text-primary">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              {status === "error" && message && (
                <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
                  <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
                  <p className="text-sm text-error/90 leading-tight">{message}</p>
                </div>
              )}

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Lock size={18} />
                </div>
                <input type="password" required minLength={6} placeholder={t("password")} className="input-dark pl-11" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Lock size={18} />
                </div>
                <input type="password" required minLength={6} placeholder={t("confirmPassword")} className="input-dark pl-11" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>

              <button type="submit" disabled={status === "loading"} className="btn-primary w-full justify-center mt-2 text-base" style={{ opacity: status === "loading" ? 0.7 : 1 }}>
                {status === "loading" ? t("loading") : t("btn")}
              </button>

              <div className="mt-6 text-center">
                <button onClick={() => router.push("/login")} className="text-sm text-text-secondary hover:text-text-primary transition-colors inline-flex items-center gap-2">
                  <ArrowLeft size={16} /> {t("back")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
