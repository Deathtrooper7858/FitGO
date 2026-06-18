import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidad — FitGO",
  description: "Política de privacidad de FitGO. Cómo gestionamos tus datos personales.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary mb-8">Política de Privacidad</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
            <p>En FitGO, nos tomamos muy en serio tu privacidad. Esta política describe cómo recopilamos, usamos y protegemos tus datos personales.</p>
            <h2 className="text-text-primary font-bold text-xl">1. Datos que recopilamos</h2>
            <p>Recopilamos la información que nos proporcionas al registrarte: nombre, correo electrónico, edad, peso, altura, objetivos de fitness y preferencias de entrenamiento. También recopilamos datos de uso de la aplicación para mejorar nuestros servicios.</p>
            <h2 className="text-text-primary font-bold text-xl">2. Cómo usamos tus datos</h2>
            <p>Usamos tus datos para personalizar tu experiencia de entrenamiento, generar estadísticas de progreso, procesar pagos de suscripción (a través de Stripe) y enviar comunicaciones relacionadas con el servicio.</p>
            <h2 className="text-text-primary font-bold text-xl">3. Compartición de datos</h2>
            <p>No vendemos tus datos personales. Compartimos datos solo con proveedores de servicios esenciales como Supabase (base de datos) y Stripe (procesamiento de pagos), bajo estrictos acuerdos de confidencialidad.</p>
            <h2 className="text-text-primary font-bold text-xl">4. Seguridad</h2>
            <p>Implementamos medidas de seguridad técnicas y organizativas para proteger tus datos, incluyendo cifrado en tránsito y en reposo.</p>
            <h2 className="text-text-primary font-bold text-xl">5. Tus derechos</h2>
            <p>Tienes derecho a acceder, rectificar o eliminar tus datos personales en cualquier momento desde la configuración de tu cuenta o contactándonos.</p>
            <h2 className="text-text-primary font-bold text-xl">6. Contacto</h2>
            <p>Si tienes preguntas sobre esta política, puedes contactarnos a través de nuestros canales oficiales.</p>
            <p className="text-text-muted text-sm mt-8">Última actualización: Enero 2026</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
