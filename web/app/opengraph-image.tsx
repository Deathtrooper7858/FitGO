import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "FitGO — Tu mejor versión";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #080C18 0%, #170C30 50%, #05080F 100%)",
          position: "relative",
          padding: "60px",
        }}
      >
        {/* Glow ambient circle */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "30%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139,92,246,0.35) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "20%",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(6,182,212,0.25) 0%, transparent 70%)",
            filter: "blur(50px)",
          }}
        />

        {/* Badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 24px",
            borderRadius: "9999px",
            background: "rgba(139,92,246,0.15)",
            border: "1px solid rgba(139,92,246,0.35)",
            color: "#C4B5FD",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            marginBottom: "24px",
          }}
        >
          ⚡ FITNESS & NUTRICIÓN GAMIFICADA
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: "80px",
            fontWeight: 900,
            letterSpacing: "-2px",
            color: "#FFFFFF",
            lineHeight: 1.1,
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          FitGO — Tu mejor versión
        </div>

        {/* Description */}
        <div
          style={{
            display: "flex",
            fontSize: "26px",
            color: "#94A3B8",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Entrena, registra macros con Coach IA, compite en Guerras de Macros y supera tus límites.
        </div>

        {/* Features footer */}
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "48px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#F8FAFC",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>🤖 Coach IA con Voz</div>
          <div style={{ display: "flex", alignItems: "center" }}>🍎 Escáner de Comida</div>
          <div style={{ display: "flex", alignItems: "center" }}>⚔️ Guerras de Macros</div>
          <div style={{ display: "flex", alignItems: "center" }}>🏆 Ligas Élite</div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
