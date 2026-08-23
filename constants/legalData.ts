export interface LegalItem {
  id: string;
  type: 'clause' | 'callout';
  number?: string;
  title: string;
  summary?: string;
  fullContent?: string;
  calloutType?: 'important' | 'ai' | 'billing' | 'gdpr' | 'security';
  calloutIcon?: 'shield' | 'bot' | 'card' | 'lock';
}

export interface LegalDocument {
  company: string;
  lastUpdatedLabel: string;
  lastUpdatedDate: string;
  title: string;
  items: LegalItem[];
}

export const STRUCTURED_TERMS: Record<string, LegalDocument> = {
  en: {
    company: "FitGO Technologies S.A.S.",
    lastUpdatedLabel: "Last updated",
    lastUpdatedDate: "May 28, 2025",
    title: "Terms & Conditions",
    items: [
      {
        id: "terms-01",
        type: "clause",
        number: "01",
        title: "Acceptance & Scope",
        summary: "These Terms and Conditions regulate your access to and use of the FitGO mobile application and services.",
        fullContent: "These Terms and Conditions of Use (\"Terms\" or \"Agreement\") govern your access to and use of the FitGO mobile application and all related services operated by FitGO Technologies S.A.S. By downloading, accessing, or using the app, you agree to be bound by these Terms and our Privacy Policy."
      },
      {
        id: "terms-02",
        type: "clause",
        number: "02",
        title: "Service Description",
        summary: "FitGO is a health, nutrition, and fitness mobile application providing daily tracking, AI Coach, and social gamification.",
        fullContent: "FitGO provides intelligent tools for daily nutrition tracking (calories and macronutrients), hydration, workout logging, AI Coach consultations, meal planning algorithms, and social gamification (Squads and FitGO Leagues). FitGO reserves the right to modify or enhance features with continuous updates."
      },
      {
        id: "terms-callout-1",
        type: "callout",
        calloutType: "important",
        calloutIcon: "shield",
        title: "IMPORTANT",
        fullContent: "You must be at least 16 years old to use FitGO.\nBy installing or using the app, you agree to these Terms."
      },
      {
        id: "terms-03",
        type: "clause",
        number: "03",
        title: "Informative Nature",
        summary: "FitGO provides informational content. It is not a medical device and does not provide medical advice.",
        fullContent: "FitGO is an educational and fitness lifestyle application. FITGO IS NOT A MEDICAL DEVICE, DOES NOT PROVIDE MEDICAL SERVICES, AND SHOULD NOT REPLACE PROFESSIONAL MEDICAL ADVICE OR DIAGNOSIS. Always consult a qualified physician or nutritionist before starting any intense diet, exercise, or supplementation program."
      },
      {
        id: "terms-callout-2",
        type: "callout",
        calloutType: "ai",
        calloutIcon: "bot",
        title: "AI COACH DISCLAIMER",
        fullContent: "The AI Coach uses large language models. Responses may be inaccurate and are not reviewed by professionals. Always consult a qualified expert for personal advice."
      },
      {
        id: "terms-04",
        type: "clause",
        number: "04",
        title: "Free & Pro Plans",
        summary: "FitGO offers a free plan and premium subscription (Pro Plan) with advanced features.",
        fullContent: "FitGO provides free standard features alongside premium Pro Plan subscriptions (monthly or annual billing). Prices and currency conversions are clearly displayed in your Apple App Store or Google Play Store account."
      },
      {
        id: "terms-callout-3",
        type: "callout",
        calloutType: "billing",
        calloutIcon: "card",
        title: "BILLING & AUTO-RENEWAL",
        fullContent: "Subscriptions automatically renew unless canceled at least 24 hours before the end of the current billing period."
      },
      {
        id: "terms-05",
        type: "clause",
        number: "05",
        title: "User Accounts",
        summary: "Users must provide accurate information and maintain account security. Fraudulent or malicious behavior is prohibited.",
        fullContent: "You are responsible for maintaining the confidentiality of your account credentials and for all activities under your account. Fraudulent activities, cheating in leagues, reverse engineering, or harmful behavior will result in immediate suspension."
      },
      {
        id: "terms-06",
        type: "clause",
        number: "06",
        title: "Intellectual Property",
        summary: "All FitGO elements, including source code and AI algorithms, are the exclusive property of FitGO Technologies S.A.S.",
        fullContent: "All graphics, software, source code, visual UI designs, algorithms, trademarks, and branding are the exclusive intellectual property of FitGO Technologies S.A.S. Users receive a revocable, non-exclusive license for personal non-commercial use."
      },
      {
        id: "terms-07",
        type: "clause",
        number: "07",
        title: "Contact",
        summary: "For inquiries regarding these Terms and Conditions, contact us at fitgoenterprise@gmail.com",
        fullContent: "If you have any questions or legal inquiries regarding these Terms and Conditions, reach out to our legal department at fitgoenterprise@gmail.com."
      }
    ]
  },
  es: {
    company: "FitGO Technologies S.A.S.",
    lastUpdatedLabel: "Última actualización",
    lastUpdatedDate: "28 de mayo de 2025",
    title: "Términos y Condiciones",
    items: [
      {
        id: "terms-01",
        type: "clause",
        number: "01",
        title: "Aceptación y Ámbito de Aplicación",
        summary: "Estos Términos y Condiciones regulan tu acceso y uso de la aplicación móvil FitGO y todos sus servicios.",
        fullContent: "Los presentes Términos y Condiciones de Uso (\"T&C\", \"Términos\" o \"Acuerdo\") regulan el acceso y uso de la aplicación móvil FitGO y de todos sus servicios asociados, operados por FitGO Technologies S.A.S. Al descargar, instalar o usar la app, aceptas cumplir plenamente estos Términos y nuestra Política de Privacidad."
      },
      {
        id: "terms-02",
        type: "clause",
        number: "02",
        title: "Descripción del Servicio",
        summary: "FitGO es una aplicación de salud, nutrición y fitness que ofrece registro diario, Coach IA y gamificación social.",
        fullContent: "FitGO es una plataforma integral de bienestar que incluye seguimiento de calorías y macronutrientes, hidratación, rutinas de ejercicio, Coach con Inteligencia Artificial, generación de dietas y gamificación social (Squads y Ligas FitGO). FitGO se reserva el derecho de actualizar y mejorar las funciones continuamente."
      },
      {
        id: "terms-callout-1",
        type: "callout",
        calloutType: "important",
        calloutIcon: "shield",
        title: "IMPORTANTE",
        fullContent: "Debes tener al menos 16 años para usar FitGO.\nAl instalar o usar la app, aceptas estos Términos."
      },
      {
        id: "terms-03",
        type: "clause",
        number: "03",
        title: "Naturaleza Informativa",
        summary: "FitGO proporciona contenido informativo. No es un dispositivo médico ni presta servicios de salud.",
        fullContent: "FitGO es estrictamente de carácter informativo y educativo. FITGO NO ES UN DISPOSITIVO MÉDICO NI SUSTITUYE LA ATENCIÓN MÉDICA PROFESIONAL. Toda recomendación nutricional o rutina es una estimación general. Consulta siempre con un médico o nutricionista colegiado antes de iniciar cualquier cambio significativo en tu dieta o ejercicio."
      },
      {
        id: "terms-callout-2",
        type: "callout",
        calloutType: "ai",
        calloutIcon: "bot",
        title: "DESCARGO DEL COACH DE IA",
        fullContent: "El Coach de IA utiliza modelos de lenguaje extensos. Las respuestas pueden ser imprecisas y no están supervisadas en tiempo real por médicos. Consulta siempre a un profesional cualificado."
      },
      {
        id: "terms-04",
        type: "clause",
        number: "04",
        title: "Planes Gratuito y Pro",
        summary: "FitGO ofrece una versión gratuita y una suscripción premium (Plan Pro) con funciones avanzadas.",
        fullContent: "FitGO ofrece acceso gratuito con funciones estándar y suscripciones premium (Plan Pro) mensuales o anuales con beneficios avanzados. Los precios aplicables se muestran de manera clara y transparente en tu tienda de aplicaciones (Apple App Store o Google Play Store)."
      },
      {
        id: "terms-callout-3",
        type: "callout",
        calloutType: "billing",
        calloutIcon: "card",
        title: "FACTURACIÓN Y RENOVACIÓN AUTOMÁTICA",
        fullContent: "Las suscripciones se renuevan automáticamente salvo que se cancelen al menos 24 horas antes del fin del período de facturación actual."
      },
      {
        id: "terms-05",
        type: "clause",
        number: "05",
        title: "Cuentas de Usuario",
        summary: "Debes ingresar datos verídicos y proteger tu cuenta. Se prohíbe el uso fraudulento o indebido.",
        fullContent: "Eres responsable de salvaguardar tus credenciales de acceso y de cualquier actividad en tu cuenta. El uso de bots, manipulación indebida de clasificaciones, ingeniería inversa o lenguaje ofensivo en el chat grupal causará la suspensión inmediata del servicio."
      },
      {
        id: "terms-06",
        type: "clause",
        number: "06",
        title: "Propiedad Intelectual",
        summary: "Todos los elementos de FitGO, incluidos diseño, código y algoritmos, pertenecen a FitGO Technologies S.A.S.",
        fullContent: "El código fuente, diseño visual, logotipos, marcas, algoritmos de cálculo y contenidos son propiedad exclusiva de FitGO Technologies S.A.S., protegidos por leyes de propiedad intelectual internacionales."
      },
      {
        id: "terms-07",
        type: "clause",
        number: "07",
        title: "Contacto",
        summary: "Para dudas sobre estos Términos y Condiciones, contáctanos en fitgoenterprise@gmail.com",
        fullContent: "Para cualquier duda, solicitud o aclaración referente a los presentes Términos, comunícate directamente con nuestro equipo legal en fitgoenterprise@gmail.com."
      }
    ]
  }
};

export const STRUCTURED_PRIVACY: Record<string, LegalDocument> = {
  en: {
    company: "FitGO Technologies S.A.S.",
    lastUpdatedLabel: "Last updated",
    lastUpdatedDate: "May 28, 2025",
    title: "Privacy Policy",
    items: [
      {
        id: "priv-01",
        type: "clause",
        number: "01",
        title: "Introduction & Controller",
        summary: "FitGO Technologies S.A.S. complies with GDPR, CCPA, and Law 1581 to protect your personal data.",
        fullContent: "This Privacy Policy transparently explains how FitGO Technologies S.A.S. collects, stores, processes, and protects your personal and health data in full compliance with GDPR (EU), CCPA (California), and Law 1581 (Colombia)."
      },
      {
        id: "priv-02",
        type: "clause",
        number: "02",
        title: "Data We Collect",
        summary: "Account information, health metrics, nutritional logs, exercise tracking, and AI Coach inputs.",
        fullContent: "We collect registration information (name, email), health parameters (height, weight, body fat %, goals), daily logged meals, water intake, workout history, and queries submitted to the AI Coach module."
      },
      {
        id: "priv-callout-1",
        type: "callout",
        calloutType: "gdpr",
        calloutIcon: "shield",
        title: "GDPR & HEALTH DATA CONSENT",
        fullContent: "Your health and fitness data is processed under explicit consent and protected with end-to-end industry security standards."
      },
      {
        id: "priv-03",
        type: "clause",
        number: "03",
        title: "Purposes of Processing",
        summary: "Personalized calculations, workout planning, leaderboard ranking, and app optimization.",
        fullContent: "Your information is used strictly to calculate TDEE, macro goals, generate tailored workout routines, manage your Squad and League rankings, and provide responsive AI wellness coaching."
      },
      {
        id: "priv-callout-2",
        type: "callout",
        calloutType: "ai",
        calloutIcon: "bot",
        title: "AI & GROQ INFRASTRUCTURE",
        fullContent: "AI consultations are processed via GROQ with strict enterprise privacy agreements. Your conversation history is never sold or used for public training."
      },
      {
        id: "priv-04",
        type: "clause",
        number: "04",
        title: "Third-Party Service Providers",
        summary: "Supabase (database), GROQ (AI inference), RevenueCat (payments), and Edamam (nutrition).",
        fullContent: "We collaborate with trusted service providers under Data Processing Agreements (DPA): Supabase (encrypted database & auth), GROQ (AI inference), RevenueCat (in-app subscription management), and Edamam (nutrition API)."
      },
      {
        id: "priv-callout-3",
        type: "callout",
        calloutType: "security",
        calloutIcon: "lock",
        title: "SECURITY & ENCRYPTION",
        fullContent: "All communications use TLS 1.3 encryption and databases are protected with AES-256 and Supabase Row Level Security (RLS)."
      },
      {
        id: "priv-05",
        type: "clause",
        number: "05",
        title: "Data Retention & Deletion",
        summary: "Personal data is permanently deleted within 30 days upon user account deletion request.",
        fullContent: "Active account data is preserved during your active relationship. When you delete your account from profile settings, all associated health and personal data is permanently expunged within 30 calendar days."
      },
      {
        id: "priv-06",
        type: "clause",
        number: "06",
        title: "Your Legal Rights",
        summary: "Access, rectification, erasure, data portability, and restriction under GDPR, CCPA, and ARCO.",
        fullContent: "You have the right to access your personal data, request correction of inaccuracies, download an export file (JSON/CSV), or demand complete account erasure at any time."
      },
      {
        id: "priv-07",
        type: "clause",
        number: "07",
        title: "Contact & DPO",
        summary: "Contact our Data Protection Officer at fitgoenterprise@gmail.com or visit https://www.fitgo.app",
        fullContent: "For privacy inquiries or to exercise your rights, contact our Data Protection Officer at fitgoenterprise@gmail.com. We respond to all verified inquiries within 30 business days."
      }
    ]
  },
  es: {
    company: "FitGO Technologies S.A.S.",
    lastUpdatedLabel: "Última actualización",
    lastUpdatedDate: "28 de mayo de 2025",
    title: "Política de Privacidad",
    items: [
      {
        id: "priv-01",
        type: "clause",
        number: "01",
        title: "Identificación del Responsable",
        summary: "FitGO Technologies S.A.S. cumple con GDPR, CCPA y Ley 1581 para salvaguardar tu información.",
        fullContent: "Esta Política de Privacidad describe de manera detallada y transparente cómo FitGO Technologies S.A.S. recopila, trata y protege tus datos personales y de salud conforme al Reglamento General de Protección de Datos (GDPR), CCPA y la Ley 1581 de Colombia."
      },
      {
        id: "priv-02",
        type: "clause",
        number: "02",
        title: "Datos que Recopilamos",
        summary: "Datos de registro, composición corporal, ingesta nutricional, entrenamientos y consultas de IA.",
        fullContent: "Recopilamos tus datos de cuenta (correo, nombre), métricas corporales (peso, talla, porcentaje graso), registro diario de alimentos y macros, hidratación, series y repeticiones de entrenamiento, e instrucciones enviadas al Coach de IA."
      },
      {
        id: "priv-callout-1",
        type: "callout",
        calloutType: "gdpr",
        calloutIcon: "shield",
        title: "CONSENTIMIENTO Y DATOS DE SALUD (GDPR)",
        fullContent: "Tus datos de salud y fitness se tratan con consentimiento explícito y bajo estrictos protocolos de seguridad y confidencialidad."
      },
      {
        id: "priv-03",
        type: "clause",
        number: "03",
        title: "Finalidades del Tratamiento",
        summary: "Cálculos personalizados de macros, rutinas, tablas de clasificación y mejora de la app.",
        fullContent: "Tus datos se utilizan para calcular tu gasto energético (TDEE), proyectar tu progreso físico, gestionar tu Squad en ligas y ofrecerte respuestas inteligentes y personalizadas en el asistente de bienestar."
      },
      {
        id: "priv-callout-2",
        type: "callout",
        calloutType: "ai",
        calloutIcon: "bot",
        title: "INFRAESTRUCTURA Y PRIVACIDAD DE IA",
        fullContent: "Las consultas de IA se procesan a través de GROQ bajo acuerdos empresariales seguros. Tus conversaciones no se comercializan ni se usan para entrenamiento público."
      },
      {
        id: "priv-04",
        type: "clause",
        number: "04",
        title: "Proveedores de Servicios Terceros",
        summary: "Supabase (base de datos), GROQ (IA), RevenueCat (suscripciones) y Edamam (nutrición).",
        fullContent: "Trabajamos con proveedores de primer nivel bajo acuerdos DPA: Supabase (base de datos cifrada y autenticación), GROQ (procesamiento de IA), RevenueCat (gestión de suscripciones) y Edamam (base de datos de alimentos)."
      },
      {
        id: "priv-callout-3",
        type: "callout",
        calloutType: "security",
        calloutIcon: "lock",
        title: "SEGURIDAD Y CIFRADO DE DATOS",
        fullContent: "Todas las comunicaciones usan TLS 1.3 y las bases de datos están protegidas con cifrado AES-256 y políticas de Row Level Security (RLS)."
      },
      {
        id: "priv-05",
        type: "clause",
        number: "05",
        title: "Conservación y Eliminación",
        summary: "Tus datos se eliminan definitivamente dentro de los 30 días posteriores a solicitar el borrado de cuenta.",
        fullContent: "Tus datos se conservan mientras tu cuenta esté activa. Si solicitas la eliminación desde el perfil, todos tus datos personales y métricas de salud se eliminan de forma irreversible en un máximo de 30 días."
      },
      {
        id: "priv-06",
        type: "clause",
        number: "06",
        title: "Tus Derechos Legales",
        summary: "Acceso, rectificación, supresión, oposición y portabilidad bajo GDPR, CCPA y derechos ARCO.",
        fullContent: "Puedes ejercer tus derechos de acceso, rectificación, cancelación, oposición o solicitar una copia descargable de tus datos escribiéndonos directamente en cualquier momento."
      },
      {
        id: "priv-07",
        type: "clause",
        number: "07",
        title: "Contacto y Delegado de Privacidad",
        summary: "Escríbenos a fitgoenterprise@gmail.com o visita nuestro sitio https://www.fitgo.app",
        fullContent: "Para consultas de privacidad o ejercer tus derechos, comunícate con nuestro Oficial de Protección de Datos a fitgoenterprise@gmail.com. Atendemos todas las solicitudes en un plazo máximo de 30 días."
      }
    ]
  }
};

// Backward-compatible exports for existing references
export const TERMS_DATA: Record<string, {title?: string, content: string}[]> = {
  en: STRUCTURED_TERMS.en.items.map(item => ({
    title: item.title,
    content: item.fullContent || item.summary || ''
  })),
  es: STRUCTURED_TERMS.es.items.map(item => ({
    title: item.title,
    content: item.fullContent || item.summary || ''
  }))
};

export const PRIVACY_DATA: Record<string, {title?: string, content: string}[]> = {
  en: STRUCTURED_PRIVACY.en.items.map(item => ({
    title: item.title,
    content: item.fullContent || item.summary || ''
  })),
  es: STRUCTURED_PRIVACY.es.items.map(item => ({
    title: item.title,
    content: item.fullContent || item.summary || ''
  }))
};
