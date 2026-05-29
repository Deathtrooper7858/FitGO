"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, Mail, Lock, AlertCircle, ArrowRight, User } from "lucide-react";
import { createClient } from "@/lib/supabase";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
            Únete a la revolución del fitness gamificado.
          </p>
        </div>

        <div className="glass rounded-3xl p-8 shadow-card border border-white/10">
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
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
                  placeholder="Nombre completo"
                  className="input-dark pl-11"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  required
                  placeholder="Correo electrónico"
                  className="input-dark pl-11"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-muted">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Contraseña"
                  className="input-dark pl-11"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-4 text-base"
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Creando cuenta..." : "Comenzar gratis"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-text-secondary">
            ¿Ya tienes cuenta?{" "}
            <Link
              href="/login"
              className="text-primary font-bold hover:text-primary-light transition-colors"
            >
              Inicia sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
