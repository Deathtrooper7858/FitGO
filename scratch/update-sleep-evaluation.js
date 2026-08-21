const fs = require('fs');
const path = require('path');

const sleepEvaluationData = {
  en: {
    sleep: {
      totalRegistered: "Total Registered",
      bedtime: "Bedtime",
      waketime: "Wake time",
      tip: "Adults need between 7 and 9 hours of sleep for optimal recovery."
    },
    evaluation: {
      error: "An error occurred while analyzing the image.",
      fatLabel: "Fat",
      feedbackTitle: "Coach Verdict",
      estFat: "Est. Fat",
      strengths: "Strengths",
      improvements: "Areas of Improvement",
      newAnalysis: "New Analysis",
      history: "Evaluation History",
      noHistory: "No evaluations yet.",
      viewHistory: "View History",
      analyzeBtn: "Analyze Physique",
      analyzing: "Analyzing your muscle development...",
      backToMain: "Back to Start",
      instruction: "Upload or take a photo of your current physique to receive a detailed AI analysis of your strengths and areas for improvement."
    }
  },
  es: {
    sleep: {
      totalRegistered: "Total registrado",
      bedtime: "Hora de dormir",
      waketime: "Hora de despertar",
      tip: "Los adultos necesitan entre 7 y 9 horas de sueño para una recuperación óptima."
    },
    evaluation: {
      error: "Ocurrió un error al analizar la imagen.",
      fatLabel: "Grasa",
      feedbackTitle: "Veredicto del Coach",
      estFat: "Grasa Est.",
      strengths: "Puntos Fuertes",
      improvements: "Áreas de Mejora",
      newAnalysis: "Nuevo Análisis",
      history: "Historial de Evaluaciones",
      noHistory: "Aún no hay evaluaciones.",
      viewHistory: "Ver Historial",
      analyzeBtn: "Analizar Físico",
      analyzing: "Analizando tu desarrollo muscular...",
      backToMain: "Volver al Inicio",
      instruction: "Sube o toma una foto de tu físico actual para recibir un análisis detallado de la IA sobre tus puntos fuertes y áreas a mejorar."
    }
  },
  fr: {
    sleep: {
      totalRegistered: "Total enregistré",
      bedtime: "Heure du coucher",
      waketime: "Heure du réveil",
      tip: "Les adultes ont besoin de 7 à 9 heures de sommeil pour une récupération optimale."
    },
    evaluation: {
      error: "Une erreur est survenue lors de l'analyse de l'image.",
      fatLabel: "Graisse",
      feedbackTitle: "Verdict du Coach",
      estFat: "Graisse Est.",
      strengths: "Points forts",
      improvements: "Axes d'amélioration",
      newAnalysis: "Nouvelle analyse",
      history: "Historique des évaluations",
      noHistory: "Pas encore d'évaluation.",
      viewHistory: "Voir l'historique",
      analyzeBtn: "Analyser le physique",
      analyzing: "Analyse de votre développement musculaire...",
      backToMain: "Retour au début",
      instruction: "Téléchargez ou prenez une photo de votre physique actuel pour recevoir une analyse détaillée par IA de vos points forts et des points à améliorer."
    }
  },
  de: {
    sleep: {
      totalRegistered: "Gesamt registriert",
      bedtime: "Schlafenszeit",
      waketime: "Weckzeit",
      tip: "Erwachsene benötigen zwischen 7 und 9 Stunden Schlaf für eine optimale Erholung."
    },
    evaluation: {
      error: "Beim Analysieren des Bildes ist ein Fehler aufgetreten.",
      fatLabel: "Fett",
      feedbackTitle: "Urteil des Coaches",
      estFat: "Geschätztes Fett",
      strengths: "Stärken",
      improvements: "Verbesserungsbereiche",
      newAnalysis: "Neue Analyse",
      history: "Bewertungsverlauf",
      noHistory: "Noch keine Bewertungen.",
      viewHistory: "Verlauf anzeigen",
      analyzeBtn: "Physik analysieren",
      analyzing: "Analysiere Ihre Muskelentwicklung...",
      backToMain: "Zurück zum Start",
      instruction: "Laden Sie ein Foto Ihres aktuellen Körpers hoch oder nehmen Sie eines auf, um eine detaillierte KI-Analyse Ihrer Stärken und Verbesserungsbereiche zu erhalten."
    }
  },
  it: {
    sleep: {
      totalRegistered: "Totale registrato",
      bedtime: "Ora di dormire",
      waketime: "Ora di svegliarsi",
      tip: "Gli adulti hanno bisogno di 7-9 ore di sonno per un recupero ottimale."
    },
    evaluation: {
      error: "Si è verificato un errore durante l'analisi dell'immagine.",
      fatLabel: "Grasso",
      feedbackTitle: "Verdetto del Coach",
      estFat: "Grasso stimato",
      strengths: "Punti di forza",
      improvements: "Aree di miglioramento",
      newAnalysis: "Nuova analisi",
      history: "Cronologia valutazioni",
      noHistory: "Ancora nessuna valutazione.",
      viewHistory: "Visualizza cronologia",
      analyzeBtn: "Analizza fisico",
      analyzing: "Analisi dello sviluppo muscolare in corso...",
      backToMain: "Torna all'inizio",
      instruction: "Carica o scatta una foto del tuo fisico attuale per ricevere un'analisi IA dettagliata dei tuoi punti di forza e delle aree di miglioramento."
    }
  },
  pt: {
    sleep: {
      totalRegistered: "Total registrado",
      bedtime: "Hora de dormir",
      waketime: "Hora de acordar",
      tip: "Os adultos precisam de 7 a 9 horas de sono para uma recuperação ideal."
    },
    evaluation: {
      error: "Ocurreu um erro ao analisar a imagem.",
      fatLabel: "Gordura",
      feedbackTitle: "Veredito do Treinador",
      estFat: "Gordura Est.",
      strengths: "Pontos Fortes",
      improvements: "Áreas de Melhoria",
      newAnalysis: "Nova Análise",
      history: "Histórico de Avaliações",
      noHistory: "Nenhuma avaliação ainda.",
      viewHistory: "Ver Histórico",
      analyzeBtn: "Analisar Físico",
      analyzing: "Analisando seu desenvolvimento muscular...",
      backToMain: "Voltar ao Início",
      instruction: "Envie ou tire uma foto do seu físico atual para receber uma análise detalhada de IA sobre seus pontos fortes e áreas de melhoria."
    }
  },
  ru: {
    sleep: {
      totalRegistered: "Всего зарегистрировано",
      bedtime: "Время ложиться спать",
      waketime: "Время просыпаться",
      tip: "Взрослым необходимо от 7 до 9 часов сна для оптимального восстановления."
    },
    evaluation: {
      error: "Произошла ошибка при анализе изображения.",
      fatLabel: "Жир",
      feedbackTitle: "Вердикт тренера",
      estFat: "Оценка жира",
      strengths: "Сильные стороны",
      improvements: "Области для улучшения",
      newAnalysis: "Новый анализ",
      history: "История оценок",
      noHistory: "Оценок пока нет.",
      viewHistory: "Посмотреть историю",
      analyzeBtn: "Анализировать телосложение",
      analyzing: "Анализ мышечного развития...",
      backToMain: "Вернуться в начало",
      instruction: "Загрузите или сделайте фото вашего текущего телосложения, чтобы получить подробный ИИ-анализ ваших сильных сторон и областей для улучшения."
    }
  }
};

const translationsDir = path.join(__dirname, '..', 'i18n', 'translations');

Object.entries(sleepEvaluationData).forEach(([lang, data]) => {
  const filePath = path.join(translationsDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Merge sleep & evaluation into the root object
  content.sleep = { ...(content.sleep || {}), ...data.sleep };
  content.evaluation = { ...(content.evaluation || {}), ...data.evaluation };

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Updated ${lang}.json successfully.`);
});
