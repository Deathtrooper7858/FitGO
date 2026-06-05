const fs = require('fs');
const path = require('path');

const missingTranslations = {
  en: {
    tabs: {
      social: "Community"
    },
    about: {
      version: "Version"
    },
    activities: {
      aiInstructions: 'Tap the microphone to speak (e.g. "Ran 40 minutes in the park") or describe it in the text field.',
      customDesc: "Describe your activity by voice or text and calculate calories automatically.",
      customPlaceholder: "E.g. Boxing, brisk walk...",
      estimate: "Calculate calories with AI",
      estimateError: "Error connecting to AI.",
      estimateFailed: "We couldn't estimate the calories. Try being more specific.",
      noExercises: "No activities matched your search.",
      searchResults: "Search results",
      selectDescription: "Select or describe an exercise to log your progress",
      whatDidYouDo: "What activity did you do?"
    },
    coach: {
      camera: "Camera",
      gallery: "Gallery",
      history: "History",
      newChat: "New Chat",
      noHistory: "No history yet",
      pickImageTitle: "Select Image",
      pickImageSub: "Where do you want to upload the photo from?",
      suggestionsTitle: "Suggestions to start",
      taglineBadge: "Personalized AI • Groq",
      confirmDeleteSession: "Are you sure you want to delete this chat?"
    },
    common: {
      date: "Date",
      less: "Less",
      more: "More",
      notes: "Notes",
      ok: "Got it",
      retake: "Change",
      today: "Today",
      upgrade: "Upgrade to Pro",
      viewAll: "History"
    },
    dashboard: {
      muscleDirectory: "Muscle Directory"
    },
    onboarding: {
      creatingPlan: "Creating plan...",
      goal: "Goal"
    },
    tracker: {
      calories: "Calories",
      carbs: "Carbohydrates",
      enterSteps: "Enter the number of steps:",
      enterWater: "Enter the amount of water in ml:",
      fat: "Fats",
      food: "Food",
      grams: "Grams",
      meal: "Meal",
      protein: "Proteins",
      sleep: "Sleep (h)",
      target: "Calorie Target",
      yesterday: "Yesterday"
    }
  },
  es: {
    tabs: {
      social: "Comunidad"
    },
    about: {
      version: "Versión"
    },
    activities: {
      aiInstructions: 'Toca el micrófono para dictar con tu voz (ej: "Trotemos 40 minutos en el parque") o descríbelo en el campo de texto.',
      customDesc: "Describe tu ejercicio por voz o texto y calcula calorías automáticamente",
      customPlaceholder: "Ej: Boxeo intensivo, Caminata rápida...",
      estimate: "Calcular calorías con IA",
      estimateError: "Error al conectar con la IA.",
      estimateFailed: "No pudimos calcular las calorías. Intenta ser más específico.",
      noExercises: "No encontramos actividades que coincidan.",
      searchResults: "Resultados de búsqueda",
      selectDescription: "Selecciona o describe un ejercicio para registrar tu progreso",
      whatDidYouDo: "¿Qué actividad hiciste?"
    },
    coach: {
      camera: "Cámara",
      gallery: "Galería",
      history: "Historial",
      newChat: "Nuevo Chat",
      noHistory: "Aún no hay historial",
      pickImageTitle: "Seleccionar Imagen",
      pickImageSub: "¿Desde dónde quieres subir la foto?",
      suggestionsTitle: "Sugerencias para empezar",
      taglineBadge: "IA Personalizada • Groq",
      confirmDeleteSession: "¿Estás seguro de que quieres eliminar este chat?"
    },
    common: {
      date: "Fecha",
      less: "Menos",
      more: "Más",
      notes: "Notas",
      ok: "Entendido",
      retake: "Cambiar",
      today: "Hoy",
      upgrade: "Mejorar a Pro",
      viewAll: "Historial"
    },
    dashboard: {
      muscleDirectory: "Directorio Muscular"
    },
    onboarding: {
      creatingPlan: "Creando plan...",
      goal: "Meta"
    },
    tracker: {
      calories: "Calorías",
      carbs: "Carbohidratos",
      enterSteps: "Ingresa el número de pasos:",
      enterWater: "Ingresa la cantidad de agua en ml:",
      fat: "Grasas",
      food: "Alimento",
      grams: "Gramos",
      meal: "Comida",
      protein: "Proteínas",
      sleep: "Sueño (h)",
      target: "Objetivo Calorías",
      yesterday: "Ayer"
    }
  },
  fr: {
    tabs: {
      social: "Communauté"
    },
    about: {
      version: "Version"
    },
    activities: {
      aiInstructions: 'Appuyez sur le microphone pour parler (ex: "Courir 40 minutes dans le parc") ou décrivez-le dans le champ de texte.',
      customDesc: "Décrivez votre activité par voix ou par texte et calculez les calories automatiquement.",
      customPlaceholder: "Ex: Boxe intensive, marche rapide...",
      estimate: "Calculer les calories avec l'IA",
      estimateError: "Erreur de connexion à l'IA.",
      estimateFailed: "Nous n'avons pas pu estimer les calories. Essayez d'être plus précis.",
      noExercises: "Aucune activité ne correspond à votre recherche.",
      searchResults: "Résultats de recherche",
      selectDescription: "Sélectionnez ou décrivez un exercice pour enregistrer vos progrès",
      whatDidYouDo: "Quelle activité avez-vous faite ?"
    },
    coach: {
      camera: "Appareil photo",
      gallery: "Galerie",
      history: "Historique",
      newChat: "Nouvelle discussion",
      noHistory: "Pas encore d'historique",
      pickImageTitle: "Sélectionner une image",
      pickImageSub: "D'où voulez-vous charger la photo ?",
      suggestionsTitle: "Suggestions pour commencer",
      taglineBadge: "IA personnalisée • Groq",
      confirmDeleteSession: "Êtes-vous sûr de vouloir supprimer cette discussion ?"
    },
    common: {
      date: "Date",
      less: "Moins",
      more: "Plus",
      notes: "Notes",
      ok: "Compris",
      retake: "Modifier",
      today: "Aujourd'hui",
      upgrade: "Passer à Pro",
      viewAll: "Historique"
    },
    dashboard: {
      muscleDirectory: "Annuaire des muscles"
    },
    onboarding: {
      creatingPlan: "Création du plan...",
      goal: "Objectif"
    },
    tracker: {
      calories: "Calories",
      carbs: "Glucides",
      enterSteps: "Entrez le nombre de pas :",
      enterWater: "Entrez la quantité d'eau en ml :",
      fat: "Lipides",
      food: "Aliment",
      grams: "Grammes",
      meal: "Repas",
      protein: "Protéines",
      sleep: "Sommeil (h)",
      target: "Objectif calories",
      yesterday: "Hier"
    }
  },
  de: {
    tabs: {
      social: "Gemeinschaft"
    },
    about: {
      version: "Version"
    },
    activities: {
      aiInstructions: 'Tippen Sie auf das Mikrofon, um zu sprechen (z. B. „40 Minuten im Park gelaufen“) oder beschreiben Sie es im Textfeld.',
      customDesc: "Beschreiben Sie Ihre Aktivität per Sprache oder Text und berechnen Sie die Kalorien automatisch.",
      customPlaceholder: "Z. B. Intensives Boxen, schnelles Gehen...",
      estimate: "Kalorien mit KI berechnen",
      estimateError: "Fehler beim Verbinden mit der KI.",
      estimateFailed: "Wir konnten die Kalorien nicht schätzen. Versuchen Sie, genauer zu sein.",
      noExercises: "Keine Aktivitäten entsprechen Ihrer Suche.",
      searchResults: "Suchergebnisse",
      selectDescription: "Wählen Sie eine Übung aus oder beschreiben Sie sie, um Ihren Fortschritt aufzuzeichnen",
      whatDidYouDo: "Welche Aktivität haben Sie gemacht?"
    },
    coach: {
      camera: "Kamera",
      gallery: "Galerie",
      history: "Verlauf",
      newChat: "Neuer Chat",
      noHistory: "Noch kein Verlauf",
      pickImageTitle: "Bild auswählen",
      pickImageSub: "Woher möchten Sie das Foto hochladen?",
      suggestionsTitle: "Vorschläge für den Start",
      taglineBadge: "Personalisierte KI • Groq",
      confirmDeleteSession: "Sind Sie sicher, dass Sie diesen Chat löschen möchten?"
    },
    common: {
      date: "Datum",
      less: "Weniger",
      more: "Mehr",
      notes: "Notizen",
      ok: "Verstanden",
      retake: "Ändern",
      today: "Heute",
      upgrade: "Auf Pro upgraden",
      viewAll: "Verlauf"
    },
    dashboard: {
      muscleDirectory: "Muskelverzeichnis"
    },
    onboarding: {
      creatingPlan: "Plan wird erstellt...",
      goal: "Ziel"
    },
    tracker: {
      calories: "Kalorien",
      carbs: "Kohlenhydrate",
      enterSteps: "Geben Sie die Anzahl der Schritte ein:",
      enterWater: "Geben Sie die Wassermenge in ml ein:",
      fat: "Fette",
      food: "Lebensmittel",
      grams: "Gramm",
      meal: "Mahlzeit",
      protein: "Eiweiß",
      sleep: "Schlaf (h)",
      target: "Kalorienziel",
      yesterday: "Gestern"
    }
  },
  it: {
    tabs: {
      social: "Comunità"
    },
    about: {
      version: "Versione"
    },
    activities: {
      aiInstructions: 'Tocca il microfono per parlare (es: "Corsa di 40 minuti nel parco") o descrivilo nel campo di testo.',
      customDesc: "Descrivi la tua attività a voce o tramite testo e calcola le calorie automaticamente.",
      customPlaceholder: "Es: Pugilato intenso, camminata veloce...",
      estimate: "Calcola calorie con l'IA",
      estimateError: "Errore di connessione all'IA.",
      estimateFailed: "Non siamo riusciti a stimare le calorie. Prova a essere più specifico.",
      noExercises: "Nessuna attività corrisponde alla tua ricerca.",
      searchResults: "Risultati della ricerca",
      selectDescription: "Seleziona o descrivi un esercizio per registrare i tuoi progressi",
      whatDidYouDo: "Che attività hai fatto?"
    },
    coach: {
      camera: "Fotocamera",
      gallery: "Galleria",
      history: "Cronologia",
      newChat: "Nuova chat",
      noHistory: "Ancora nessuna cronologia",
      pickImageTitle: "Seleziona immagine",
      pickImageSub: "Da dove vuoi caricare la foto?",
      suggestionsTitle: "Suggerimenti per iniziare",
      taglineBadge: "IA personalizzata • Groq",
      confirmDeleteSession: "Sei sicuro di voler eliminare questa chat?"
    },
    common: {
      date: "Data",
      less: "Meno",
      more: "Più",
      notes: "Note",
      ok: "Ho capito",
      retake: "Modifica",
      today: "Oggi",
      upgrade: "Passa a Pro",
      viewAll: "Cronologia"
    },
    dashboard: {
      muscleDirectory: "Elenco dei muscoli"
    },
    onboarding: {
      creatingPlan: "Creazione del piano...",
      goal: "Obiettivo"
    },
    tracker: {
      calories: "Calorie",
      carbs: "Carboidrati",
      enterSteps: "Inserisci il numero di passi:",
      enterWater: "Inserisci la quantità di acqua in ml:",
      fat: "Grassi",
      food: "Alimento",
      grams: "Grammi",
      meal: "Pasto",
      protein: "Proteine",
      sleep: "Sonno (h)",
      target: "Obiettivo calorie",
      yesterday: "Ieri"
    }
  },
  pt: {
    tabs: {
      social: "Comunidade"
    },
    about: {
      version: "Versão"
    },
    activities: {
      aiInstructions: 'Toque no microfone para falar (ex: "Correr 40 minutos no parque") ou descreva no campo de texto.',
      customDesc: "Descreva sua atividade por voz ou texto e calcule as calorias automaticamente.",
      customPlaceholder: "Ex: Boxe intensivo, caminhada rápida...",
      estimate: "Calcular calorias com IA",
      estimateError: "Erro ao conectar com a IA.",
      estimateFailed: "Não pudemos calcular as calorias. Tente ser mais específico.",
      noExercises: "Nenhuma atividade corresponde à sua busca.",
      searchResults: "Resultados da busca",
      selectDescription: "Selecione ou descreva um exercício para registrar seu progresso",
      whatDidYouDo: "Qual atividade você fez?"
    },
    coach: {
      camera: "Câmera",
      gallery: "Galeria",
      history: "Histórico",
      newChat: "Nova conversa",
      noHistory: "Nenhum histórico ainda",
      pickImageTitle: "Selecionar imagem",
      pickImageSub: "De onde você quer enviar a foto?",
      suggestionsTitle: "Sugestões para começar",
      taglineBadge: "IA personalizada • Groq",
      confirmDeleteSession: "Tem certeza de que deseja excluir esta conversa?"
    },
    common: {
      date: "Data",
      less: "Menos",
      more: "Mais",
      notes: "Notas",
      ok: "Entendi",
      retake: "Alterar",
      today: "Hoje",
      upgrade: "Atualizar para Pro",
      viewAll: "Histórico"
    },
    dashboard: {
      muscleDirectory: "Diretório Muscular"
    },
    onboarding: {
      creatingPlan: "Criando plano...",
      goal: "Objetivo"
    },
    tracker: {
      calories: "Calorias",
      carbs: "Carboidratos",
      enterSteps: "Insira o número de passos:",
      enterWater: "Insira a quantidade de água em ml:",
      fat: "Gorduras",
      food: "Alimento",
      grams: "Gramas",
      meal: "Refeição",
      protein: "Proteínas",
      sleep: "Sono (h)",
      target: "Meta de calorias",
      yesterday: "Ontem"
    }
  },
  ru: {
    tabs: {
      social: "Сообщество"
    },
    about: {
      version: "Версия"
    },
    activities: {
      aiInstructions: 'Нажмите на микрофон, чтобы надиктовать голосом (например, «Бег 40 минут в парке»), или опишите в текстовом поле.',
      customDesc: "Опишите свою активность голосом или текстом, и калории рассчитются автоматически.",
      customPlaceholder: "Например: Интенсивный бокс, быстрая ходьба...",
      estimate: "Рассчитать калории с помощью ИИ",
      estimateError: "Ошибка подключения к ИИ.",
      estimateFailed: "Мы не смогли рассчитать калории. Попробуйте описать точнее.",
      noExercises: "Активностей не найдено.",
      searchResults: "Результаты поиска",
      selectDescription: "Выберите или опишите упражнение для записи прогресса",
      whatDidYouDo: "Какую активность вы выполнили?"
    },
    coach: {
      camera: "Камера",
      gallery: "Галерея",
      history: "История",
      newChat: "Новый чат",
      noHistory: "Истории пока нет",
      pickImageTitle: "Выбрать изображение",
      pickImageSub: "Откуда вы хотите загрузить фото?",
      suggestionsTitle: "Рекомендации для начала",
      taglineBadge: "Персональный ИИ • Groq",
      confirmDeleteSession: "Вы действительно хотите удалить этот чат?"
    },
    common: {
      date: "Дата",
      less: "Меньше",
      more: "Больше",
      notes: "Заметки",
      ok: "Понятно",
      retake: "Изменить",
      today: "Сегодня",
      upgrade: "Обновить до Pro",
      viewAll: "История"
    },
    dashboard: {
      muscleDirectory: "Мышечный атлас"
    },
    onboarding: {
      creatingPlan: "Создание плана...",
      goal: "Цель"
    },
    tracker: {
      calories: "Калории",
      carbs: "Углеводы",
      enterSteps: "Введите количество шагов:",
      enterWater: "Введите количество воды в мл:",
      fat: "Жиры",
      food: "Продукт",
      grams: "Граммы",
      meal: "Прием пищи",
      protein: "Белки",
      sleep: "Сон (ч)",
      target: "Целевые калории",
      yesterday: "Вчера"
    }
  }
};

const translationsDir = path.join(__dirname, '..', 'i18n', 'translations');

Object.entries(missingTranslations).forEach(([lang, data]) => {
  const filePath = path.join(translationsDir, `${lang}.json`);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  // Merge recursively
  for (const [key, val] of Object.entries(data)) {
    if (typeof val === 'object' && val !== null) {
      content[key] = { ...(content[key] || {}), ...val };
    } else {
      content[key] = val;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf8');
  console.log(`Successfully updated ${lang}.json with general missing keys.`);
});
