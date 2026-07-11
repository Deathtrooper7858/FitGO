import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden" suppressHydrationWarning>
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0A0512 0%, #24124D 100%)", opacity: 0.8 }} />
      <div className="orb w-96 h-96 bg-primary" style={{ top: "10%", left: "5%", opacity: 0.15 }} />
      <div className="orb w-64 h-64 bg-secondary" style={{ bottom: "20%", right: "8%", opacity: 0.1 }} />
      
      <div className="relative z-10 text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-gradient-btn glow-primary mx-auto mb-8 flex items-center justify-center">
          <Zap size={40} className="text-white" fill="white" />
        </div>
        <h1 className="font-display font-black text-8xl gradient-text mb-4">404</h1>
        <p className="text-text-secondary text-xl mb-8">Esta página no existe o fue movida.</p>
        <Link href="/" className="btn-primary">
          <ArrowLeft size={18} /> Volver al inicio
        </Link>
      </div>
    </div>
  );
}
