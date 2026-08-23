import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Servicio",
  description: "Términos y condiciones de uso de FitGO.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background" suppressHydrationWarning>
      <Navbar />
      <section className="relative pt-40 pb-24 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary mb-8">Términos de Servicio</h1>
          <div className="prose prose-invert max-w-none space-y-6 text-text-secondary">
            <p>Al usar FitGO, aceptas los siguientes términos y condiciones.</p>
            <h2 className="text-text-primary font-bold text-xl">1. Uso del servicio</h2>
            <p>FitGO es una aplicación de fitness y nutrición. Debes tener al menos 13 años para usar el servicio. Eres responsable de mantener la confidencialidad de tu cuenta.</p>
            <h2 className="text-text-primary font-bold text-xl">2. Suscripciones</h2>
            <p>FitGO Pro es un servicio de suscripción. Los pagos se procesan a través de Stripe y se renuevan automáticamente a menos que se cancelen. Puedes cancelar en cualquier momento desde la configuración de tu cuenta.</p>
            <h2 className="text-text-primary font-bold text-xl">3. Conducta del usuario</h2>
            <p>No debes usar FitGO para actividades ilegales, acosar a otros usuarios, o manipular los sistemas de gamificación de forma fraudulenta.</p>
            <h2 className="text-text-primary font-bold text-xl">4. Propiedad intelectual</h2>
            <p>Todo el contenido de FitGO (marcas, diseño, código) es propiedad de FitGO. No está permitida su reproducción sin autorización.</p>
            <h2 className="text-text-primary font-bold text-xl">5. Limitación de responsabilidad</h2>
            <p>FitGO no se hace responsable de daños indirectos derivados del uso de la aplicación. Los resultados de fitness varían según cada persona.</p>
            <h2 className="text-text-primary font-bold text-xl">6. Modificaciones</h2>
            <p>Nos reservamos el derecho de modificar estos términos. Notificaremos cambios significativos a través de la aplicación o correo electrónico.</p>
            <p className="text-text-muted text-sm mt-8">Última actualización: Enero 2026</p>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
