import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "../globals.css";
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import { RegisterSW } from '@/components/RegisterSW';
import { CookieBanner } from '@/components/CookieBanner';
import { ScrollToTop } from '@/components/ScrollToTop';
import { MobileStickyCTA } from '@/components/MobileStickyCTA';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans" });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://fitgo.app";

const jsonLdSchema = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "FitGO",
      "url": siteUrl,
      "operatingSystem": "iOS, Android, Web",
      "applicationCategory": "HealthAndFitnessApplication",
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "1250",
      },
      "description": "La app de fitness más fluida y gamificada. Registra tu progreso, planifica tus entrenamientos y controla tu nutrición con Coach IA.",
    },
    {
      "@type": "Organization",
      "name": "FitGO",
      "url": siteUrl,
      "logo": `${siteUrl}/icon-192.svg`,
      "sameAs": [
        "https://www.instagram.com/fitgoapp",
        "https://www.tiktok.com/@fitgoapp"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "support@fitgo.app",
        "contactType": "Customer Support"
      }
    }
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "FitGO — Tu mejor versión",
    template: "%s | FitGO",
  },
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
    "coach IA",
    "guerras de macros",
    "ligas élite",
  ],
  authors: [{ name: "FitGO Team" }],
  creator: "FitGO",
  openGraph: {
    title: "FitGO — Tu mejor versión",
    description:
      "La app de fitness más fluida y gamificada. Progreso, nutrición y entrenamiento en un solo lugar.",
    type: "website",
    locale: "es_ES",
    siteName: "FitGO",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FitGO — Tu mejor versión",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "FitGO — Tu mejor versión",
    description:
      "La app de fitness más fluida y gamificada. Progreso, nutrición y entrenamiento en un solo lugar.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }
  const messages = await getMessages();

  return (
    <html lang={locale} className={`scroll-smooth ${inter.variable} ${dmSans.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSchema) }}
        />
      </head>
      <body className="bg-background text-text-primary antialiased" suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <CookieBanner />
        <ScrollToTop />
        <MobileStickyCTA />
        <RegisterSW />
      </body>
    </html>
  );
}
