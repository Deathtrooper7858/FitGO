"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import {
  Mail,
  Clock,
  Send,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "", // Honeypot field for bot protection
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = "Por favor introduce tu nombre.";
    if (!formData.email.trim()) {
      errs.email = "El correo electrónico es requerido.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = "Introduce un correo electrónico válido.";
    }
    if (!formData.subject.trim()) errs.subject = "Por favor indica un asunto.";
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errs.message = "El mensaje debe tener al menos 10 caracteres.";
    }
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Bot trap: bots auto-fill hidden honeypots. Discard silently.
    if (formData.website) {
      setIsSubmitting(false);
      setSubmitted(true);
      return;
    }
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setIsSubmitting(true);

    // Simulate sending message
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col justify-between selection:bg-primary/30">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-28 flex-1 w-full">
        <Breadcrumbs items={[{ label: "Contacto" }]} />

        <div className="text-center max-w-xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs text-[#a78bfa] font-bold mb-4">
            <Sparkles size={14} />
            <span>Estamos para ayudarte</span>
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl gradient-text mb-3">
            Contacta con FitGO
          </h1>
          <p className="text-text-secondary text-sm md:text-base leading-relaxed">
            ¿Tienes dudas, sugerencias o necesitas soporte con tu cuenta? Nuestro equipo te responderá a la brevedad.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          {/* Contact Details & Response Commitment */}
          <div className="space-y-4">
            <div
              className="p-6 rounded-2xl border border-white/10 backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(10,15,30,0.8) 100%)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center text-primary">
                  <Clock size={20} />
                </div>
                <div>
                  <h2 className="text-white text-sm font-bold">Compromiso</h2>
                  <p className="text-xs text-text-secondary">Tiempo de respuesta</p>
                </div>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Respondemos a todas las solicitudes en <strong className="text-white">menos de 24 horas</strong> laborables.
              </p>
            </div>

            <div
              className="p-6 rounded-2xl border border-white/10 backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(10,15,30,0.8) 100%)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#06B6D4]/20 border border-[#06B6D4]/30 flex items-center justify-center text-[#06B6D4]">
                  <Mail size={20} />
                </div>
                <div>
                  <h2 className="text-white text-sm font-bold">Email Directo</h2>
                  <p className="text-xs text-text-secondary">support@fitgo.app</p>
                </div>
              </div>
              <p className="text-xs text-text-muted leading-relaxed">
                Puedes escribirnos directamente para temas de facturación o problemas técnicos.
              </p>
            </div>

            <div
              className="p-6 rounded-2xl border border-white/10 backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(10,15,30,0.8) 100%)",
              }}
            >
              <div className="flex items-center gap-2 text-xs text-[#10B981] font-semibold mb-1">
                <ShieldCheck size={16} />
                <span>Privacidad garantizada</span>
              </div>
              <p className="text-[11px] text-text-muted leading-relaxed">
                Tus datos no serán compartidos ni utilizados para spam publicitario.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-2">
            <div
              className="p-8 rounded-3xl border border-white/10 shadow-2xl relative backdrop-blur-xl"
              style={{
                background: "linear-gradient(135deg, rgba(15,23,42,0.8) 0%, rgba(8,12,24,0.9) 100%)",
              }}
            >
              {submitted ? (
                <div className="text-center py-10 animate-in fade-in zoom-in-95">
                  <div className="w-16 h-16 rounded-2xl bg-[#10B981]/20 border border-[#10B981]/30 text-[#10B981] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 size={36} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">¡Mensaje enviado con éxito!</h3>
                  <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
                    Hemos recibido tu consulta correctamente. Te responderemos a <strong className="text-white">{formData.email}</strong> en menos de 24 horas.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", email: "", subject: "", message: "", website: "" });
                    }}
                    className="py-2.5 px-6 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-colors border border-white/15"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Honeypot field - Invisible to humans, traps automated spam bots */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="opacity-0 absolute -z-10 pointer-events-none w-0 h-0 m-0 p-0"
                    aria-hidden="true"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                        Tu nombre
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej. Alex Martínez"
                        className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                          errors.name ? "border-error/60 focus:border-error" : "border-white/10 focus:border-primary/60"
                        } text-white placeholder:text-text-muted text-sm focus:outline-none transition-colors`}
                      />
                      {errors.name && <p className="text-xs text-error mt-1">{errors.name}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                        Correo electrónico
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="tu@correo.com"
                        className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                          errors.email ? "border-error/60 focus:border-error" : "border-white/10 focus:border-primary/60"
                        } text-white placeholder:text-text-muted text-sm focus:outline-none transition-colors`}
                      />
                      {errors.email && <p className="text-xs text-error mt-1">{errors.email}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Asunto
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      placeholder="Ej. Consulta sobre FitGO Pro o sugerencia"
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                        errors.subject ? "border-error/60 focus:border-error" : "border-white/10 focus:border-primary/60"
                      } text-white placeholder:text-text-muted text-sm focus:outline-none transition-colors`}
                    />
                    {errors.subject && <p className="text-xs text-error mt-1">{errors.subject}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1.5">
                      Mensaje
                    </label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Cuéntanos en qué podemos ayudarte..."
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border ${
                        errors.message ? "border-error/60 focus:border-error" : "border-white/10 focus:border-primary/60"
                      } text-white placeholder:text-text-muted text-sm focus:outline-none transition-colors resize-none`}
                    />
                    {errors.message && <p className="text-xs text-error mt-1">{errors.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all transform active:scale-98 shadow-lg disabled:opacity-50"
                    style={{
                      background: "linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)",
                      boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
                    }}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enviando mensaje...
                      </span>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Enviar mensaje</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
