const fs = require('fs');
const path = 'e:/fitgo/i18n/web-translations';
const langs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru'];

const additions = {
  en: {
    squadsRanking: { noSquadsSubtitle: "Be the first to create one from the app!" },
    home: {
      premium: {
        features: {
          instantMacros: "Instant macro tracking",
          customCoach: "Custom AI Coach",
          macroWars: "Macro wars with friends",
          eliteLeagues: "Elite leagues and global rankings"
        },
        cta: "Start for free"
      }
    },
    pricingPage: {
      faq: {
        readyToStart: "Ready to start your transformation?",
        tryFitGoPro: "Try FitGO Pro"
      }
    }
  },
  es: {
    squadsRanking: { noSquadsSubtitle: "¡Sé el primero en crear un squad!" },
    home: {
      premium: {
        features: {
          instantMacros: "Registro de macros instantáneo",
          customCoach: "Coach IA personalizado",
          macroWars: "Guerras de macros con amigos",
          eliteLeagues: "Ligas élite y rankings globales"
        },
        cta: "Empezar gratis"
      }
    },
    pricingPage: {
      faq: {
        readyToStart: "¿Listo para empezar tu transformación?",
        tryFitGoPro: "Probar FitGO Pro"
      }
    }
  },
  fr: {
    squadsRanking: { noSquadsSubtitle: "Soyez le premier à en créer un depuis l'application !" },
    home: {
      premium: {
        features: {
          instantMacros: "Suivi instantané des macros",
          customCoach: "Coach IA personnalisé",
          macroWars: "Guerres de macros entre amis",
          eliteLeagues: "Ligues élite et classements mondiaux"
        },
        cta: "Commencer gratuitement"
      }
    },
    pricingPage: {
      faq: {
        readyToStart: "Prêt à commencer votre transformation ?",
        tryFitGoPro: "Essayer FitGO Pro"
      }
    }
  },
  de: {
    squadsRanking: { noSquadsSubtitle: "Sei der Erste, der einen über die App erstellt!" },
    home: {
      premium: {
        features: {
          instantMacros: "Sofortiges Makro-Tracking",
          customCoach: "Benutzerdefinierter KI-Coach",
          macroWars: "Makro-Kriege mit Freunden",
          eliteLeagues: "Elite-Ligen und globale Ranglisten"
        },
        cta: "Kostenlos starten"
      }
    },
    pricingPage: {
      faq: {
        readyToStart: "Bereit, deine Transformation zu beginnen?",
        tryFitGoPro: "FitGO Pro ausprobieren"
      }
    }
  },
  it: {
    squadsRanking: { noSquadsSubtitle: "Sii il primo a crearne uno dall'app!" },
    home: {
      premium: {
        features: {
          instantMacros: "Tracciamento istantaneo dei macro",
          customCoach: "Coach IA personalizzato",
          macroWars: "Guerre di macro con gli amici",
          eliteLeagues: "Leghe d'élite e classifiche globali"
        },
        cta: "Inizia gratis"
      }
    },
    pricingPage: {
      faq: {
        readyToStart: "Pronto a iniziare la tua trasformazione?",
        tryFitGoPro: "Prova FitGO Pro"
      }
    }
  },
  pt: {
    squadsRanking: { noSquadsSubtitle: "Seja o primeiro a criar um pelo app!" },
    home: {
      premium: {
        features: {
          instantMacros: "Rastreamento instantâneo de macros",
          customCoach: "Coach de IA personalizado",
          macroWars: "Guerras de macros com amigos",
          eliteLeagues: "Ligas de elite e rankings globais"
        },
        cta: "Começar grátis"
      }
    },
    pricingPage: {
      faq: {
        readyToStart: "Pronto para começar sua transformação?",
        tryFitGoPro: "Experimentar FitGO Pro"
      }
    }
  },
  ru: {
    squadsRanking: { noSquadsSubtitle: "Станьте первым, кто создаст squad в приложении!" },
    home: {
      premium: {
        features: {
          instantMacros: "Мгновенное отслеживание макросов",
          customCoach: "Персональный ИИ-тренер",
          macroWars: "Битвы макросов с друзьями",
          eliteLeagues: "Элитные лиги и глобальные рейтинги"
        },
        cta: "Начать бесплатно"
      }
    },
    pricingPage: {
      faq: {
        readyToStart: "Готовы начать трансформацию?",
        tryFitGoPro: "Попробовать FitGO Pro"
      }
    }
  }
};

function deepMerge(target, source) {
  for (const key of Object.keys(source)) {
    if (source[key] instanceof Object && key in target && target[key] instanceof Object) {
      Object.assign(source[key], deepMerge(target[key], source[key]));
    }
  }
  Object.assign(target || {}, source);
  return target;
}

for (const lang of langs) {
  const filePath = `${path}/${lang}.json`;
  let data = {};
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  
  if (additions[lang]) {
    data = deepMerge(data, additions[lang]);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Updated ${lang}`);
  }
}
