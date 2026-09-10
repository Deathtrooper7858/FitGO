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
  },
  fr: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Dernière mise à jour",
    "lastUpdatedDate": "28 mai 2025",
    "title": "Conditions Générales d'Utilisation",
    "items": [
        {
            "id": "terms-01",
            "type": "clause",
            "number": "01",
            "title": "Acceptation et Champ d'Application",
            "summary": "Ces Conditions régissent votre accès et votre utilisation de l'application mobile FitGO.",
            "fullContent": "Les présentes Conditions Générales d'Utilisation régissent votre accès et votre utilisation de l'application mobile FitGO et de tous les services associés exploités par FitGO Technologies S.A.S. En téléchargeant ou en utilisant l'application, vous acceptez d'être lié par ces Conditions et notre Politique de Confidentialité."
        },
        {
            "id": "terms-02",
            "type": "clause",
            "number": "02",
            "title": "Description du Service",
            "summary": "FitGO est une application de santé, nutrition et fitness offrant suivi quotidien, Coach IA et communauté.",
            "fullContent": "FitGO fournit des outils intelligents pour le suivi nutritionnel quotidien (calories et macronutriments), l'hydratation, l'enregistrement des séances d'entraînement, le coaching par IA et les classements de ligue. FitGO se réserve le droit de faire évoluer ses fonctionnalités en continu."
        },
        {
            "id": "terms-callout-1",
            "type": "callout",
            "calloutType": "important",
            "calloutIcon": "shield",
            "title": "IMPORTANT",
            "fullContent": "Vous devez avoir au moins 16 ans pour utiliser FitGO.\nEn installant ou en utilisant l'application, vous acceptez ces Conditions."
        },
        {
            "id": "terms-03",
            "type": "clause",
            "number": "03",
            "title": "Nature Informative",
            "summary": "FitGO fournit du contenu informatif. Ce n'est pas un dispositif médical et ne fournit aucun avis médical.",
            "fullContent": "FitGO est une application éducative et de bien-être. FITGO N'EST PAS UN DISPOSITIF MÉDICAL ET NE FOURNIT AUCUN SERVICE MÉDICAL. Consultez toujours un médecin qualifié avant d'entreprendre tout programme intensif d'exercice ou de nutrition."
        },
        {
            "id": "terms-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "AVIS DU COACH IA",
            "fullContent": "Le Coach IA propose des suggestions de bien-être algorithmiques. Ses réponses ne remplacent pas une consultation avec un nutritionniste ou un médecin agréé."
        },
        {
            "id": "terms-04",
            "type": "clause",
            "number": "04",
            "title": "Abonnements et Facturation",
            "summary": "Les fonctionnalités FitGO Pro nécessitent un abonnement payant géré via l'App Store ou Google Play.",
            "fullContent": "Les abonnements FitGO Pro se renouvellent automatiquement à moins d'être annulés au moins 24 heures avant la fin de la période en cours dans les paramètres de votre compte Apple ou Google Play."
        },
        {
            "id": "terms-05",
            "type": "clause",
            "number": "05",
            "title": "Comptes Utilisateurs",
            "summary": "Vous devez fournir des informations exactes et sécuriser vos identifiants d'accès.",
            "fullContent": "Vous êtes responsable de la confidentialité de vos identifiants. L'utilisation de robots ou de pratiques abusives entraînera la suspension immédiate du compte."
        },
        {
            "id": "terms-06",
            "type": "clause",
            "number": "06",
            "title": "Propriété Intellectuelle",
            "summary": "Tous les composants de FitGO appartiennent exclusivement à FitGO Technologies S.A.S.",
            "fullContent": "Tous les graphismes, logiciels, codes sources, conceptions d'interface, algorithmes et marques sont la propriété intellectuelle exclusive de FitGO Technologies S.A.S."
        },
        {
            "id": "terms-07",
            "type": "clause",
            "number": "07",
            "title": "Contact",
            "summary": "Pour toute question concernant ces Conditions, contactez fitgoenterprise@gmail.com",
            "fullContent": "Si vous avez des questions relatives à ces Conditions Générales, contactez notre équipe à fitgoenterprise@gmail.com."
        }
    ]
},
  pt: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Última atualização",
    "lastUpdatedDate": "28 de maio de 2025",
    "title": "Termos e Condições",
    "items": [
        {
            "id": "terms-01",
            "type": "clause",
            "number": "01",
            "title": "Aceitação e Âmbito",
            "summary": "Estes Termos regulam seu acesso e uso do aplicativo móvel FitGO.",
            "fullContent": "Estes Termos e Condições de Uso regem seu acesso e uso do aplicativo móvel FitGO operado pela FitGO Technologies S.A.S. Ao baixar ou usar o aplicativo, você concorda com estes Termos e nossa Política de Privacidade."
        },
        {
            "id": "terms-02",
            "type": "clause",
            "number": "02",
            "title": "Descrição do Serviço",
            "summary": "FitGO é um app de saúde, nutrição e fitness com rastreamento diário, Coach IA e comunidade.",
            "fullContent": "O FitGO fornece ferramentas inteligentes para monitoramento de calorias, macronutrientes, hidratação, treinos e acompanhamento por Inteligência Artificial."
        },
        {
            "id": "terms-callout-1",
            "type": "callout",
            "calloutType": "important",
            "calloutIcon": "shield",
            "title": "IMPORTANTE",
            "fullContent": "Você deve ter pelo menos 16 anos para usar o FitGO.\nAo instalar ou usar o app, você aceita estes Termos."
        },
        {
            "id": "terms-03",
            "type": "clause",
            "number": "03",
            "title": "Natureza Informativa",
            "summary": "O FitGO fornece conteúdo informativo. Não é dispositivo médico e não substitui orientação médica.",
            "fullContent": "O FitGO é um aplicativo de bem-estar. NÃO É DISPOSITIVO MÉDICO E NÃO PRESTA SERVIÇOS MÉDICOS. Consulte sempre um médico ou nutricionista qualificado."
        },
        {
            "id": "terms-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "AVISO DO COACH IA",
            "fullContent": "As respostas do Coach IA são informativas e não substituem o diagnóstico de profissionais de saúde qualificados."
        },
        {
            "id": "terms-04",
            "type": "clause",
            "number": "04",
            "title": "Assinaturas e Faturamento",
            "summary": "As funções FitGO Pro requerem assinatura através do Google Play ou App Store.",
            "fullContent": "As assinaturas renovam-se automaticamente a menos que sejam canceladas até 24 horas antes do fim do período atual."
        },
        {
            "id": "terms-05",
            "type": "clause",
            "number": "05",
            "title": "Contas de Usuário",
            "summary": "Você é responsável por manter a segurança e a veracidade dos seus dados de acesso.",
            "fullContent": "O uso indevido, bots ou fraudes resultarão na suspensão imediata da sua conta."
        },
        {
            "id": "terms-06",
            "type": "clause",
            "number": "06",
            "title": "Propriedade Intelectual",
            "summary": "Todos os códigos, designs e algoritmos pertencem à FitGO Technologies S.A.S.",
            "fullContent": "Todos os gráficos, interfaces, códigos-fonte e algoritmos são propriedade exclusiva da FitGO Technologies S.A.S."
        },
        {
            "id": "terms-07",
            "type": "clause",
            "number": "07",
            "title": "Contato",
            "summary": "Para dúvidas sobre estes Termos, contate fitgoenterprise@gmail.com",
            "fullContent": "Em caso de dúvidas sobre nossos Termos e Condições, escreva para fitgoenterprise@gmail.com."
        }
    ]
},
  de: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Zuletzt aktualisiert",
    "lastUpdatedDate": "28. Mai 2025",
    "title": "Allgemeine Geschäftsbedingungen",
    "items": [
        {
            "id": "terms-01",
            "type": "clause",
            "number": "01",
            "title": "Geltungsbereich & Annahme",
            "summary": "Diese Bedingungen regeln den Zugriff auf die FitGO-App und deren Nutzung.",
            "fullContent": "Diese Allgemeinen Geschäftsbedingungen regeln Ihre Nutzung der mobilen App FitGO von FitGO Technologies S.A.S. Mit dem Download oder der Nutzung stimmen Sie diesen Bedingungen und der Datenschutzerklärung zu."
        },
        {
            "id": "terms-02",
            "type": "clause",
            "number": "02",
            "title": "Leistungsbeschreibung",
            "summary": "FitGO ist eine Fitness- und Ernährungs-App mit Tracking, KI-Coach und Community.",
            "fullContent": "FitGO bietet Werkzeuge zur Erfassung von Kalorien, Makronährstoffen, Flüssigkeit, Trainingseinheiten und KI-Unterstützung."
        },
        {
            "id": "terms-callout-1",
            "type": "callout",
            "calloutType": "important",
            "calloutIcon": "shield",
            "title": "WICHTIG",
            "fullContent": "Sie müssen mindestens 16 Jahre alt sein, um FitGO zu nutzen.\nMit der Nutzung der App stimmen Sie diesen Bedingungen zu."
        },
        {
            "id": "terms-03",
            "type": "clause",
            "number": "03",
            "title": "Informativer Charakter",
            "summary": "FitGO ist kein Medizinprodukt und bietet keine ärztliche Beratung.",
            "fullContent": "FitGO ist kein Medizinprodukt und ersetzt keine professionelle medizinische Beratung oder Diagnose. Konsultieren Sie stets einen Arzt."
        },
        {
            "id": "terms-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "KI-COACH HINWEIS",
            "fullContent": "Die Antworten des KI-Coaches sind algorithmische Ratschläge und ersetzen keine professionelle Ernährungsberatung."
        },
        {
            "id": "terms-04",
            "type": "clause",
            "number": "04",
            "title": "Abonnements & Abrechnung",
            "summary": "FitGO Pro erfordert ein Abonnement über den Apple App Store oder Google Play.",
            "fullContent": "Abonnements verlängern sich automatisch, sofern sie nicht mindestens 24 Stunden vor Ablauf gekündigt werden."
        },
        {
            "id": "terms-05",
            "type": "clause",
            "number": "05",
            "title": "Benutzerkonten",
            "summary": "Sie sind für die Sicherheit Ihrer Zugangsdaten verantwortlich.",
            "fullContent": "Missbrauch, Bots oder Betrugsversuche führen zur sofortigen Sperrung des Kontos."
        },
        {
            "id": "terms-06",
            "type": "clause",
            "number": "06",
            "title": "Geistiges Eigentum",
            "summary": "Alle Inhalte und Codes gehören FitGO Technologies S.A.S.",
            "fullContent": "Alle Designs, Grafiken, Quelltexte und Algorithmen sind Eigentum von FitGO Technologies S.A.S."
        },
        {
            "id": "terms-07",
            "type": "clause",
            "number": "07",
            "title": "Kontakt",
            "summary": "Bei Fragen wenden Sie sich an fitgoenterprise@gmail.com",
            "fullContent": "Für rechtliche Anfragen zu diesen Bedingungen kontaktieren Sie fitgoenterprise@gmail.com."
        }
    ]
},
  it: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Ultimo aggiornamento",
    "lastUpdatedDate": "28 maggio 2025",
    "title": "Termini e Condizioni",
    "items": [
        {
            "id": "terms-01",
            "type": "clause",
            "number": "01",
            "title": "Accettazione e Ambito",
            "summary": "Questi Termini regolano l'accesso e l'uso dell'applicazione mobile FitGO.",
            "fullContent": "I presenti Termini e Condizioni d'Uso regolano l'accesso e l'uso dell'applicazione FitGO. Scaricando o utilizzando l'app, accetti questi Termini e la nostra Informativa sulla Privacy."
        },
        {
            "id": "terms-02",
            "type": "clause",
            "number": "02",
            "title": "Descrizione del Servizio",
            "summary": "FitGO è un'app di salute, nutrizione e fitness con monitoraggio giornaliero e Coach IA.",
            "fullContent": "FitGO fornisce strumenti intelligenti per il calcolo delle calorie, macronutrienti, idratazione, allenamenti e supporto con intelligenza artificiale."
        },
        {
            "id": "terms-callout-1",
            "type": "callout",
            "calloutType": "important",
            "calloutIcon": "shield",
            "title": "IMPORTANTE",
            "fullContent": "Devi avere almeno 16 anni per utilizzare FitGO.\nInstallando o utilizzando l'app, accetti questi Termini."
        },
        {
            "id": "terms-03",
            "type": "clause",
            "number": "03",
            "title": "Natura Informativa",
            "summary": "FitGO non è un dispositivo medico e non fornisce consulenza medica.",
            "fullContent": "FitGO non fornisce diagnosi mediche né sostituisce il parere di un medico professionista."
        },
        {
            "id": "terms-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "AVVISO COACH IA",
            "fullContent": "Le risposte del Coach IA sono orientative e non sostituiscono un nutrizionista qualificato."
        },
        {
            "id": "terms-04",
            "type": "clause",
            "number": "04",
            "title": "Abbonamenti e Fatturazione",
            "summary": "Le funzionalità Pro richiedono un abbonamento gestito tramite App Store o Google Play.",
            "fullContent": "Gli abbonamenti si rinnovano automaticamente salvo disdetta almeno 24 ore prima del termine del periodo."
        },
        {
            "id": "terms-05",
            "type": "clause",
            "number": "05",
            "title": "Account Utente",
            "summary": "L'utente è responsabile della sicurezza delle proprie credenziali di accesso.",
            "fullContent": "Uso improprio o frodi comporteranno la sospensione immediata dell'account."
        },
        {
            "id": "terms-06",
            "type": "clause",
            "number": "06",
            "title": "Proprietà Intellettuale",
            "summary": "Tutti i contenuti appartengono a FitGO Technologies S.A.S.",
            "fullContent": "Grafica, codici, algoritmi e loghi sono di proprietà esclusiva di FitGO Technologies S.A.S."
        },
        {
            "id": "terms-07",
            "type": "clause",
            "number": "07",
            "title": "Contatti",
            "summary": "Per domande sui Termini, contatta fitgoenterprise@gmail.com",
            "fullContent": "Per chiarimenti legali, scrivi al nostro team all'indirizzo fitgoenterprise@gmail.com."
        }
    ]
},
  ru: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Последнее обновление",
    "lastUpdatedDate": "28 мая 2025 г.",
    "title": "Условия Использования",
    "items": [
        {
            "id": "terms-01",
            "type": "clause",
            "number": "01",
            "title": "Принятие и Область Действия",
            "summary": "Настоящие Условия регулируют ваш доступ и использование мобильного приложения FitGO.",
            "fullContent": "Настоящие Условия регулируют использование приложения FitGO. Загружая или используя приложение, вы соглашаетесь с этими Условиями и Политикой конфиденциальности."
        },
        {
            "id": "terms-02",
            "type": "clause",
            "number": "02",
            "title": "Описание Сервиса",
            "summary": "FitGO — приложение для здоровья, питания и фитнеса с ИИ-тренером и сообществом.",
            "fullContent": "FitGO предоставляет умные инструменты для подсчета калорий, макронутриентов, водного баланса и консультаций с ИИ-тренером."
        },
        {
            "id": "terms-callout-1",
            "type": "callout",
            "calloutType": "important",
            "calloutIcon": "shield",
            "title": "ВАЖНО",
            "fullContent": "Вам должно быть не менее 16 лет для использования FitGO.\nУстанавливая приложение, вы принимаете эти Условия."
        },
        {
            "id": "terms-03",
            "type": "clause",
            "number": "03",
            "title": "Информационный Характер",
            "summary": "FitGO не является медицинским устройством и не предоставляет медицинских консультаций.",
            "fullContent": "FitGO предназначен для фитнеса и здорового образа жизни. Всегда консультируйтесь с врачом перед началом интенсивных программ."
        },
        {
            "id": "terms-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "УВЕДОМЛЕНИЕ ОБ ИИ",
            "fullContent": "Советы ИИ-тренера носят алгоритмический характер и не заменяют консультацию дипломированного диетолога."
        },
        {
            "id": "terms-04",
            "type": "clause",
            "number": "04",
            "title": "Подписки и Оплата",
            "summary": "Функции FitGO Pro требуют платной подписки через Google Play или App Store.",
            "fullContent": "Подписки продлеваются автоматически, если не отменены минимум за 24 часа до окончания текущего периода."
        },
        {
            "id": "terms-05",
            "type": "clause",
            "number": "05",
            "title": "Учетные Записи",
            "summary": "Пользователь несет ответственность за сохранность своих учетных данных.",
            "fullContent": "Использование ботов или мошенничество приведет к немедленной блокировке аккаунта."
        },
        {
            "id": "terms-06",
            "type": "clause",
            "number": "06",
            "title": "Интеллектуальная Собственность",
            "summary": "Все элементы FitGO принадлежат FitGO Technologies S.A.S.",
            "fullContent": "Дизайн, код, логотипы и алгоритмы являются исключительной собственностью FitGO Technologies S.A.S."
        },
        {
            "id": "terms-07",
            "type": "clause",
            "number": "07",
            "title": "Контакты",
            "summary": "По юридическим вопросам пишите на fitgoenterprise@gmail.com",
            "fullContent": "По любым вопросам относительно Условий обращайтесь на fitgoenterprise@gmail.com."
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
  },
  fr: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Dernière mise à jour",
    "lastUpdatedDate": "28 mai 2025",
    "title": "Politique de Confidentialité",
    "items": [
        {
            "id": "priv-01",
            "type": "clause",
            "number": "01",
            "title": "Introduction et Responsable",
            "summary": "FitGO Technologies S.A.S. respecte le RGPD pour protéger vos données personnelles.",
            "fullContent": "Cette Politique de Confidentialité explique comment FitGO recueille, traite et protège vos données personnelles et de santé en pleine conformité avec les réglementations RGPD."
        },
        {
            "id": "priv-02",
            "type": "clause",
            "number": "02",
            "title": "Données Recueillies",
            "summary": "Informations de compte, mesures de santé, repas enregistrés et interactions IA.",
            "fullContent": "Nous collectons les données de profil (nom, e-mail), les paramètres physiques (taille, poids, objectifs), les repas enregistrés et les requêtes adressées au Coach IA."
        },
        {
            "id": "priv-callout-1",
            "type": "callout",
            "calloutType": "gdpr",
            "calloutIcon": "shield",
            "title": "CONSENTEMENT RGPD ET DONNÉES DE SANTÉ",
            "fullContent": "Vos données de forme physique sont traitées avec votre consentement explicite et protégées selon des normes de sécurité de pointe."
        },
        {
            "id": "priv-03",
            "type": "clause",
            "number": "03",
            "title": "Finalités du Traitement",
            "summary": "Calculs personnalisés, suivi des repas, classements et optimisation de l'application.",
            "fullContent": "Vos informations sont strictement utilisées pour calculer vos besoins caloriques, générer des recommandations adaptées et assurer le bon fonctionnement de l'application."
        },
        {
            "id": "priv-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "INFRASTRUCTURE IA ET SÉCURITÉ",
            "fullContent": "Les requêtes IA sont traitées en toute confidentialité. Vos historiques de conversation ne sont jamais vendus ni utilisés à des fins d'entraînement public."
        },
        {
            "id": "priv-04",
            "type": "clause",
            "number": "04",
            "title": "Fournisseurs Tiers",
            "summary": "Supabase (base de données), RevenueCat (abonnements) et hébergement sécurisé.",
            "fullContent": "Nous collaborons avec des partenaires de confiance respectant les normes de sécurité les plus strictes de l'industrie (chiffrement TLS 1.3 et stockage chiffré)."
        },
        {
            "id": "priv-05",
            "type": "clause",
            "number": "05",
            "title": "Vos Droits RGPD",
            "summary": "Vous pouvez accéder, rectifier, exporter ou supprimer vos données à tout moment.",
            "fullContent": "Vous disposez d'un droit permanent d'accès, de rectification, de portabilité et de suppression de vos données personnelles directement depuis l'application ou par e-mail."
        },
        {
            "id": "priv-06",
            "type": "clause",
            "number": "06",
            "title": "Contact DPO",
            "summary": "Pour exercer vos droits, contactez fitgoenterprise@gmail.com",
            "fullContent": "Pour exercer vos droits ou pour toute question relative à vos données, contactez notre équipe de confidentialité à fitgoenterprise@gmail.com."
        }
    ]
},
  pt: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Última atualização",
    "lastUpdatedDate": "28 de maio de 2025",
    "title": "Política de Privacidade",
    "items": [
        {
            "id": "priv-01",
            "type": "clause",
            "number": "01",
            "title": "Introdução e Controlador",
            "summary": "A FitGO protege seus dados pessoais de acordo com a LGPD e o GDPR.",
            "fullContent": "Esta Política de Privacidade explica como a FitGO Technologies S.A.S. coleta, armazena e protege seus dados com total transparência e segurança."
        },
        {
            "id": "priv-02",
            "type": "clause",
            "number": "02",
            "title": "Dados Coletados",
            "summary": "Dados de conta, parâmetros físicos, registros de refeições e interações com a IA.",
            "fullContent": "Coletamos informações de perfil (nome, e-mail), medidas corporais (altura, peso, objetivos), refeições e consultas ao Coach IA."
        },
        {
            "id": "priv-callout-1",
            "type": "callout",
            "calloutType": "gdpr",
            "calloutIcon": "shield",
            "title": "CONSENTIMENTO E SEGURANÇA",
            "fullContent": "Seus dados de saúde são tratados sob consentimento explícito e protegidos com criptografia de ponta a ponta."
        },
        {
            "id": "priv-03",
            "type": "clause",
            "number": "03",
            "title": "Finalidade do Tratamento",
            "summary": "Cálculos nutricionais, planos personalizados e funcionamento do aplicativo.",
            "fullContent": "Suas informações são utilizadas estritamente para estimar suas necessidades calóricas e aprimorar sua experiência no aplicativo."
        },
        {
            "id": "priv-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "INFRAESTRUTURA DE IA",
            "fullContent": "As conversas com a IA são privadas. Seu histórico nunca é vendido ou compartilhado publicamente."
        },
        {
            "id": "priv-04",
            "type": "clause",
            "number": "04",
            "title": "Provedores Terceirizados",
            "summary": "Supabase, RevenueCat e servidores seguros em conformidade com padrões globais.",
            "fullContent": "Trabalhamos com parceiros de infraestrutura que seguem os mais rigorosos protocolos de proteção de dados."
        },
        {
            "id": "priv-05",
            "type": "clause",
            "number": "05",
            "title": "Seus Direitos",
            "summary": "Você tem o direito de acessar, retificar, exportar ou excluir seus dados a qualquer momento.",
            "fullContent": "Você pode solicitar a qualquer momento a exclusão permanente dos seus dados através das configurações do app."
        },
        {
            "id": "priv-06",
            "type": "clause",
            "number": "06",
            "title": "Contato de Privacidade",
            "summary": "Contate fitgoenterprise@gmail.com para solicitações de privacidade.",
            "fullContent": "Para exercer seus direitos de privacidade, entre em contato pelo e-mail fitgoenterprise@gmail.com."
        }
    ]
},
  de: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Zuletzt aktualisiert",
    "lastUpdatedDate": "28. Mai 2025",
    "title": "Datenschutzerklärung",
    "items": [
        {
            "id": "priv-01",
            "type": "clause",
            "number": "01",
            "title": "Verantwortlicher & DSGVO",
            "summary": "FitGO Technologies S.A.S. schützt Ihre Daten gemäß der europäischen DSGVO.",
            "fullContent": "Diese Datenschutzerklärung informiert transparent über Erhebung, Verarbeitung und Schutz Ihrer Daten nach DSGVO-Standards."
        },
        {
            "id": "priv-02",
            "type": "clause",
            "number": "02",
            "title": "Erhobene Daten",
            "summary": "Kontodaten, Körpermaße, erfasste Mahlzeiten und Interaktionen mit der KI.",
            "fullContent": "Wir erfassen Profildaten (Name, E-Mail), Gesundheitswerte (Größe, Gewicht), Mahlzeiten und Trainingsdaten."
        },
        {
            "id": "priv-callout-1",
            "type": "callout",
            "calloutType": "gdpr",
            "calloutIcon": "shield",
            "title": "DSGVO-EINWILLIGUNG",
            "fullContent": "Ihre Fitnessdaten werden auf Basis ausdrücklicher Einwilligung und modernster Verschlüsselung verarbeitet."
        },
        {
            "id": "priv-03",
            "type": "clause",
            "number": "03",
            "title": "Zwecke der Verarbeitung",
            "summary": "Berechnung von Kalorienzielen, personalisierte Trainings und App-Funktionen.",
            "fullContent": "Ihre Daten dienen ausschließlich der Berechnung Ihres Bedarfs und der Bereitstellung der App-Funktionen."
        },
        {
            "id": "priv-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "KI-INFRASTRUKTUR",
            "fullContent": "KI-Anfragen werden vertraulich verarbeitet und niemals für öffentliches Modelltraining verwendet."
        },
        {
            "id": "priv-04",
            "type": "clause",
            "number": "04",
            "title": "Drittanbieter",
            "summary": "Supabase, RevenueCat und sichere Cloud-Dienste.",
            "fullContent": "Wir arbeiten mit verlässlichen Partnern, die hohe Sicherheits- und Datenschutzstandards gewährleisten."
        },
        {
            "id": "priv-05",
            "type": "clause",
            "number": "05",
            "title": "Ihre Rechte",
            "summary": "Auskunft, Berichtigung, Datenübertragbarkeit und Löschung jederzeit möglich.",
            "fullContent": "Sie haben das Recht auf Auskunft, Löschung und Berichtigung Ihrer Daten in den Profileinstellungen."
        },
        {
            "id": "priv-06",
            "type": "clause",
            "number": "06",
            "title": "Datenschutz-Kontakt",
            "summary": "Kontaktieren Sie uns unter fitgoenterprise@gmail.com",
            "fullContent": "Bei Fragen zum Datenschutz wenden Sie sich bitte an fitgoenterprise@gmail.com."
        }
    ]
},
  it: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Ultimo aggiornamento",
    "lastUpdatedDate": "28 maggio 2025",
    "title": "Informativa sulla Privacy",
    "items": [
        {
            "id": "priv-01",
            "type": "clause",
            "number": "01",
            "title": "Introduzione e Titolare",
            "summary": "FitGO rispetta il GDPR per la protezione dei tuoi dati personali.",
            "fullContent": "La presente informativa descrive la raccolta e la protezione dei dati in conformità con gli standard europei GDPR."
        },
        {
            "id": "priv-02",
            "type": "clause",
            "number": "02",
            "title": "Dati Raccolti",
            "summary": "Dati di profilo, parametri fisici, pasti registrati e consultazioni con la IA.",
            "fullContent": "Raccogliamo nome, e-mail, altezza, peso, obiettivi e registri delle attività."
        },
        {
            "id": "priv-callout-1",
            "type": "callout",
            "calloutType": "gdpr",
            "calloutIcon": "shield",
            "title": "CONSENSO GDPR",
            "fullContent": "I tuoi dati di benessere sono trattati con consenso esplicito e crittografia di livello bancario."
        },
        {
            "id": "priv-03",
            "type": "clause",
            "number": "03",
            "title": "Finalità del Trattamento",
            "summary": "Calcolo calorico, piani personalizzati e funzionalità dell'app.",
            "fullContent": "I dati sono utilizzati esclusivamente per calcolare i tuoi fabbisogni e migliorare il servizio."
        },
        {
            "id": "priv-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "INFRASTRUTTURA IA",
            "fullContent": "Le chat con l'IA sono riservate e non vengono mai vendute o rese pubbliche."
        },
        {
            "id": "priv-04",
            "type": "clause",
            "number": "04",
            "title": "Fornitori Terzi",
            "summary": "Supabase, RevenueCat e infrastrutture cloud conformi.",
            "fullContent": "Collaboriamo con fornitori di hosting che rispettano rigorosi protocolli di sicurezza."
        },
        {
            "id": "priv-05",
            "type": "clause",
            "number": "05",
            "title": "I Tuoi Diritti",
            "summary": "Accesso, rettifica, portabilità e cancellazione dei dati in qualunque momento.",
            "fullContent": "Puoi richiedere la cancellazione completa del tuo account dalle impostazioni."
        },
        {
            "id": "priv-06",
            "type": "clause",
            "number": "06",
            "title": "Contatto Privacy",
            "summary": "Scrivi a fitgoenterprise@gmail.com per richieste sui dati personali.",
            "fullContent": "Per esercitare i tuoi diritti, contattaci all'indirizzo fitgoenterprise@gmail.com."
        }
    ]
},
  ru: {
    "company": "FitGO Technologies S.A.S.",
    "lastUpdatedLabel": "Последнее обновление",
    "lastUpdatedDate": "28 мая 2025 г.",
    "title": "Политика Конфиденциальности",
    "items": [
        {
            "id": "priv-01",
            "type": "clause",
            "number": "01",
            "title": "Введение и Оператор Данных",
            "summary": "FitGO защищает ваши персональные данные в строгом соответствии с GDPR.",
            "fullContent": "Настоящая Политика описывает порядок сбора, хранения и защиты данных пользователей FitGO."
        },
        {
            "id": "priv-02",
            "type": "clause",
            "number": "02",
            "title": "Собираемые Данные",
            "summary": "Данные учетной записи, физические параметры, записи питания и запросы к ИИ.",
            "fullContent": "Мы собираем имя, e-mail, рост, вес, цели и журнал приемов пищи."
        },
        {
            "id": "priv-callout-1",
            "type": "callout",
            "calloutType": "gdpr",
            "calloutIcon": "shield",
            "title": "СОГЛАСИЕ И БЕЗОПАСНОСТЬ",
            "fullContent": "Ваши данные о здоровье обрабатываются на основе согласия и защищены сквозным шифрованием."
        },
        {
            "id": "priv-03",
            "type": "clause",
            "number": "03",
            "title": "Цели Обработки",
            "summary": "Индивидуальный расчет калорий, персонализированные планы и работа приложения.",
            "fullContent": "Данные используются исключительно для функционирования приложения и формирования рекомендаций."
        },
        {
            "id": "priv-callout-2",
            "type": "callout",
            "calloutType": "ai",
            "calloutIcon": "bot",
            "title": "ИНФРАСТРУКТУРА ИИ",
            "fullContent": "История общения с ИИ конфиденциальна и никогда не передается третьим лицам."
        },
        {
            "id": "priv-04",
            "type": "clause",
            "number": "04",
            "title": "Сторонние Сервисы",
            "summary": "Supabase, RevenueCat и безопасная облачная инфраструктура.",
            "fullContent": "Мы сотрудничаем с провайдерами, обеспечивающими наивысшие стандарты безопасности данных."
        },
        {
            "id": "priv-05",
            "type": "clause",
            "number": "05",
            "title": "Ваши Права",
            "summary": "Доступ, исправление, экспорт и удаление данных в любое время.",
            "fullContent": "Вы можете запросить полное удаление ваших данных в настройках аккаунта."
        },
        {
            "id": "priv-06",
            "type": "clause",
            "number": "06",
            "title": "Контакт по Конфиденциальности",
            "summary": "Для запросов пишите на fitgoenterprise@gmail.com",
            "fullContent": "По любым вопросам о защите данных обращайтесь на fitgoenterprise@gmail.com."
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
