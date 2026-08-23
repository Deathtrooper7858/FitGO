"use client";

import { useState } from "react";
import { Link, useRouter } from "@/i18n/routing";
import { Zap, Mail, Lock, AlertCircle, ArrowRight, ArrowLeft, User } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useTranslations } from "next-intl";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      setLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fitgo-dark flex flex-col justify-center items-center px-6 relative overflow-hidden">
      {/* Background elements */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(135deg, #0A0512 0%, #24124D 100%)",
          opacity: 0.8,
        }}
      />
      <div
        className="orb w-96 h-96 bg-primary z-0"
        style={{ top: "-10%", left: "-10%", opacity: 0.15 }}
      />
      <div
        className="orb w-64 h-64 bg-accent z-0"
        style={{ bottom: "-10%", right: "-10%", opacity: 0.1 }}
      />

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
          <Link href="/" className="inline-flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-btn glow-primary flex items-center justify-center">
              <Zap size={28} className="text-white" fill="white" />
            </div>
            <h1 className="font-display font-black text-3xl gradient-text">
              FitGO
            </h1>
          </Link>
          <p className="text-text-secondary mt-2">
            {t("title")}
          </p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-card border border-white/10">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3 animate-fade-in">
                <AlertCircle size={18} className="text-error shrink-0 mt-0.5" />
                <p className="text-sm text-error/90 leading-tight">{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  required
                  placeholder={t("name")}
                  className="input-dark pl-11"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder={t("email")}
                  className="input-dark pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={t("password")}
                  className="input-dark pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder={t("confirmPassword")}
                  className="input-dark pl-11"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-4 text-base"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t("loading") : t("btn")}
              {!loading && <ArrowRight size={18} />}
            </button>

            <div className="relative flex items-center py-2">
              <div className="grow border-t border-white/10"></div>
              <span className="shrink-0 mx-4 text-text-muted text-sm uppercase">O</span>
              <div className="grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="btn-secondary w-full justify-center flex items-center gap-2"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.79 15.74 17.56V20.31H19.31C21.4 18.38 22.56 15.57 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.31 20.31L15.74 17.56C14.74 18.23 13.48 18.63 12 18.63C9.14 18.63 6.72 16.7 5.86 14.11H2.18V16.96C3.99 20.56 7.7 23 12 23Z" fill="#34A853"/>
                <path d="M5.86 14.11C5.64 13.45 5.51 12.74 5.51 12C5.51 11.26 5.64 10.55 5.86 9.89V7.04H2.18C1.44 8.52 1 10.21 1 12C1 13.79 1.44 15.48 2.18 16.96L5.86 14.11Z" fill="#FBBC05"/>
                <path d="M12 5.38C13.62 5.38 15.07 5.94 16.22 7.03L19.39 3.86C17.46 2.06 14.97 1 12 1C7.7 1 3.99 3.44 2.18 7.04L5.86 9.89C6.72 7.3 9.14 5.38 12 5.38Z" fill="#EA4335"/>
              </svg>
              Continuar con Google
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-text-secondary">
            {t("hasAccount")}{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:text-primary-light transition-colors"
            >
              {t("login")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
