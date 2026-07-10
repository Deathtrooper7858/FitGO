const fs = require('fs');
const path = require('path');

const trialTranslations = {
  en: {
    badge: "ONE-TIME OFFER",
    title: "3-Day Free Trial",
    subtitle: "Try all Pro features completely free",
    expires: "Expires in 3 days · Not renewable",
    cta: "Start Free Trial",
    alreadyUsed: "Trial already used",
    alreadyUsedDesc: "You've already used the free trial. Subscribe to FitGO Pro to continue enjoying all premium features.",
    active: "Trial active",
    activeDesc: "Your free trial is active. Enjoy all Pro features until it expires!",
    expired: "Trial expired",
    expiredDesc: "Your 3-day trial has ended. Subscribe to FitGO Pro to keep all premium features.",
    confirmTitle: "Start 3-Day Free Trial",
    confirmSubtitle: "Access everything. No credit card required.",
    confirmPerk1: "Full access to all Pro features",
    confirmPerk2: "Expires automatically after 3 days",
    confirmPerk3: "One-time offer · Not renewable",
    confirmNote: "No payment required. Trial revokes automatically.",
    confirmCta: "Activate Free Trial",
    confirmCancel: "No, thanks"
  },
  es: {
    badge: "OFERTA ÚNICA",
    title: "Prueba Gratuita 3 Días",
    subtitle: "Prueba todas las funciones Pro completamente gratis",
    expires: "Expira en 3 días · No renovable",
    cta: "Comenzar Prueba Gratis",
    alreadyUsed: "Prueba ya utilizada",
    alreadyUsedDesc: "Ya usaste la prueba gratuita. Suscríbete a FitGO Pro para seguir disfrutando de todas las funciones premium.",
    active: "Prueba activa",
    activeDesc: "¡Tu prueba gratuita está activa. Disfruta todas las funciones Pro hasta que expire!",
    expired: "Prueba expirada",
    expiredDesc: "Tu prueba de 3 días ha terminado. Suscríbete a FitGO Pro para conservar todas las funciones premium.",
    confirmTitle: "Iniciar Prueba Gratuita de 3 Días",
    confirmSubtitle: "Acceso completo. Sin tarjeta de crédito.",
    confirmPerk1: "Acceso total a todas las funciones Pro",
    confirmPerk2: "Expira automáticamente después de 3 días",
    confirmPerk3: "Oferta única · No renovable",
    confirmNote: "Sin pago requerido. La prueba se revoca automáticamente.",
    confirmCta: "Activar Prueba Gratuita",
    confirmCancel: "No, gracias"
  },
  pt: {
    badge: "OFERTA ÚNICA",
    title: "Teste Gratuito de 3 Dias",
    subtitle: "Experimente todos os recursos Pro completamente grátis",
    expires: "Expira em 3 dias · Não renovável",
    cta: "Iniciar Teste Grátis",
    alreadyUsed: "Teste já utilizado",
    alreadyUsedDesc: "Você já usou o teste gratuito. Assine o FitGO Pro para continuar aproveitando todos os recursos premium.",
    active: "Teste ativo",
    activeDesc: "Seu teste gratuito está ativo. Aproveite todos os recursos Pro até ele expirar!",
    expired: "Teste expirado",
    expiredDesc: "Seu teste de 3 dias terminou. Assine o FitGO Pro para manter todos os recursos premium.",
    confirmTitle: "Iniciar Teste Gratuito de 3 Dias",
    confirmSubtitle: "Acesso completo. Sem cartão de crédito.",
    confirmPerk1: "Acesso total a todos os recursos Pro",
    confirmPerk2: "Expira automaticamente após 3 dias",
    confirmPerk3: "Oferta única · Não renovável",
    confirmNote: "Sem pagamento necessário. O teste é revogado automaticamente.",
    confirmCta: "Ativar Teste Gratuito",
    confirmCancel: "Não, obrigado"
  },
  fr: {
    badge: "OFFRE UNIQUE",
    title: "Essai Gratuit 3 Jours",
    subtitle: "Essayez toutes les fonctionnalités Pro complètement gratuitement",
    expires: "Expire dans 3 jours · Non renouvelable",
    cta: "Commencer l'Essai Gratuit",
    alreadyUsed: "Essai déjà utilisé",
    alreadyUsedDesc: "Vous avez déjà utilisé l'essai gratuit. Abonnez-vous à FitGO Pro pour continuer à profiter de toutes les fonctionnalités premium.",
    active: "Essai actif",
    activeDesc: "Votre essai gratuit est actif. Profitez de toutes les fonctionnalités Pro jusqu'à son expiration !",
    expired: "Essai expiré",
    expiredDesc: "Votre essai de 3 jours est terminé. Abonnez-vous à FitGO Pro pour conserver toutes les fonctionnalités premium.",
    confirmTitle: "Démarrer l'Essai Gratuit de 3 Jours",
    confirmSubtitle: "Accès complet. Aucune carte de crédit requise.",
    confirmPerk1: "Accès complet à toutes les fonctionnalités Pro",
    confirmPerk2: "Expire automatiquement après 3 jours",
    confirmPerk3: "Offre unique · Non renouvelable",
    confirmNote: "Aucun paiement requis. L'essai se révoque automatiquement.",
    confirmCta: "Activer l'Essai Gratuit",
    confirmCancel: "Non, merci"
  },
  de: {
    badge: "EINMALIGES ANGEBOT",
    title: "3-Tage Kostenloser Test",
    subtitle: "Teste alle Pro-Funktionen völlig kostenlos",
    expires: "Läuft in 3 Tagen ab · Nicht verlängerbar",
    cta: "Kostenlose Testversion starten",
    alreadyUsed: "Test bereits verwendet",
    alreadyUsedDesc: "Du hast die kostenlose Testversion bereits genutzt. Abonniere FitGO Pro, um alle Premium-Funktionen weiter zu genießen.",
    active: "Test aktiv",
    activeDesc: "Deine kostenlose Testversion ist aktiv. Genieße alle Pro-Funktionen bis sie abläuft!",
    expired: "Test abgelaufen",
    expiredDesc: "Dein 3-Tage-Test ist beendet. Abonniere FitGO Pro, um alle Premium-Funktionen zu behalten.",
    confirmTitle: "3-Tage Kostenlose Testversion starten",
    confirmSubtitle: "Voller Zugang. Keine Kreditkarte erforderlich.",
    confirmPerk1: "Vollständiger Zugang zu allen Pro-Funktionen",
    confirmPerk2: "Läuft nach 3 Tagen automatisch ab",
    confirmPerk3: "Einmaliges Angebot · Nicht verlängerbar",
    confirmNote: "Keine Zahlung erforderlich. Test wird automatisch widerrufen.",
    confirmCta: "Kostenlose Testversion aktivieren",
    confirmCancel: "Nein, danke"
  },
  it: {
    badge: "OFFERTA UNICA",
    title: "Prova Gratuita 3 Giorni",
    subtitle: "Prova tutte le funzionalità Pro completamente gratis",
    expires: "Scade in 3 giorni · Non rinnovabile",
    cta: "Inizia la Prova Gratuita",
    alreadyUsed: "Prova già utilizzata",
    alreadyUsedDesc: "Hai già utilizzato la prova gratuita. Abbonati a FitGO Pro per continuare a godere di tutte le funzionalità premium.",
    active: "Prova attiva",
    activeDesc: "La tua prova gratuita è attiva. Goditi tutte le funzionalità Pro fino alla scadenza!",
    expired: "Prova scaduta",
    expiredDesc: "La tua prova di 3 giorni è terminata. Abbonati a FitGO Pro per mantenere tutte le funzionalità premium.",
    confirmTitle: "Inizia la Prova Gratuita di 3 Giorni",
    confirmSubtitle: "Accesso completo. Nessuna carta di credito richiesta.",
    confirmPerk1: "Accesso completo a tutte le funzionalità Pro",
    confirmPerk2: "Scade automaticamente dopo 3 giorni",
    confirmPerk3: "Offerta unica · Non rinnovabile",
    confirmNote: "Nessun pagamento richiesto. La prova viene revocata automaticamente.",
    confirmCta: "Attiva la Prova Gratuita",
    confirmCancel: "No, grazie"
  },
  ru: {
    badge: "РАЗОВОЕ ПРЕДЛОЖЕНИЕ",
    title: "Бесплатная Пробная Версия 3 Дня",
    subtitle: "Попробуйте все Pro функции совершенно бесплатно",
    expires: "Истекает через 3 дня · Не возобновляется",
    cta: "Начать Бесплатную Пробную Версию",
    alreadyUsed: "Пробная версия уже использована",
    alreadyUsedDesc: "Вы уже использовали бесплатную пробную версию. Подпишитесь на FitGO Pro, чтобы продолжать пользоваться всеми премиум-функциями.",
    active: "Пробная версия активна",
    activeDesc: "Ваша бесплатная пробная версия активна. Наслаждайтесь всеми Pro функциями до её истечения!",
    expired: "Пробная версия истекла",
    expiredDesc: "Ваша 3-дневная пробная версия завершена. Подпишитесь на FitGO Pro, чтобы сохранить все премиум-функции.",
    confirmTitle: "Начать 3-дневную Бесплатную Пробную Версию",
    confirmSubtitle: "Полный доступ. Кредитная карта не нужна.",
    confirmPerk1: "Полный доступ ко всем Pro функциям",
    confirmPerk2: "Автоматически истекает через 3 дня",
    confirmPerk3: "Разовое предложение · Не возобновляется",
    confirmNote: "Оплата не требуется. Пробная версия отзывается автоматически.",
    confirmCta: "Активировать Бесплатную Пробную Версию",
    confirmCancel: "Нет, спасибо"
  }
};

const langs = ['es', 'pt', 'fr', 'de', 'it', 'ru'];

for (const lang of langs) {
  const filePath = path.join(__dirname, `${lang}.json`);
  const content = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(content);
  
  if (!json.paywall) {
    console.log(`No paywall section found in ${lang}.json`);
    continue;
  }
  
  if (json.paywall.trial) {
    console.log(`Trial already exists in ${lang}.json, skipping.`);
    continue;
  }
  
  json.paywall.trial = trialTranslations[lang];
  
  fs.writeFileSync(filePath, JSON.stringify(json, null, 2), 'utf8');
  console.log(`✅ Updated ${lang}.json`);
}

console.log('Done!');
