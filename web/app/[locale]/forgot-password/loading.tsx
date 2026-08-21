import { Zap } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-btn glow-primary flex items-center justify-center animate-pulse-slow">
          <Zap size={24} className="text-white" fill="white" />
        </div>
        <div className="text-text-muted text-sm font-semibold tracking-wider uppercase">Cargando...</div>
      </div>
    </div>
  );
}
