import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export const metadata: Metadata = {
  title: "FitGO — Tu mejor versión",
  description:
    "FitGO es la app de fitness más fluida y gamificada. Registra tu progreso, planifica tus entrenamientos y controla tu nutrición, todo en un solo lugar.",
  keywords: [
    "fitness",
    "entrenamiento",
    "nutrición",
    "macros",
    "gym",
    "workout",
    "fitgo",
  ],
  authors: [{ name: "FitGO Team" }],
  openGraph: {
    title: "FitGO — Tu mejor versión",
    description:
      "La app de fitness más fluida y gamificada. Progreso, nutrición y entrenamiento en un solo lugar.",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitGO — Tu mejor versión",
    description:
      "La app de fitness más fluida y gamificada. Progreso, nutrición y entrenamiento en un solo lugar.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`scroll-smooth ${inter.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="bg-background text-text-primary antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
