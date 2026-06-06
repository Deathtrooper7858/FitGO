import { scheduleReminder, triggerInstantNotification, sendRemotePushNotification } from '../services/notifications';
import { Reminder } from '../store/types';
import { useTranslation } from 'react-i18next';

/**
 * 30 Notification Triggers - Categorized
 */
export const NotificationTriggers = {
  // ==========================================
  // A. SOCIAL & COMMUNITY (Remote Push)
  // ==========================================
  social: {
    newSquadMessage: async (tokens: string[], senderName: string, squadName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `Nuevo mensaje en ${squadName}`, `${senderName} envió un mensaje.`);
      });
    },
    joinRequest: async (token: string, userName: string, squadName: string) => {
      if(token) sendRemotePushNotification(token, `Solicitud de unión`, `${userName} quiere unirse a ${squadName}.`);
    },
    memberJoined: async (tokens: string[], userName: string, squadName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `Nuevo miembro`, `${userName} se ha unido a ${squadName}!`);
      });
    },
    squadDeleted: async (tokens: string[], squadName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `Squad Eliminado`, `El líder ha disuelto el squad ${squadName}.`);
      });
    },
    memberKicked: async (token: string, squadName: string) => {
      if(token) sendRemotePushNotification(token, `Eliminado del Squad`, `Has sido expulsado de ${squadName}.`);
    },
    newInvite: async (token: string, squadName: string) => {
      if(token) sendRemotePushNotification(token, `Nueva Invitación`, `Te han invitado a unirte a ${squadName}.`);
    },
    leaguePointsReached: async (tokens: string[], points: number) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `¡Hito Alcanzado!`, `Tu Squad acaba de alcanzar ${points} puntos de liga.`);
      });
    },
    planShared: async (token: string, fromUser: string) => {
      if(token) sendRemotePushNotification(token, `Plan Compartido`, `${fromUser} ha compartido un plan de entrenamiento contigo.`);
    },
    challengeStarted: async (tokens: string[], challengeName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `Desafío Iniciado`, `El desafío ${challengeName} ha comenzado. ¡A darlo todo!`);
      });
    },
  },

  // ==========================================
  // B. NUTRITION & HABITS (Local / Instant)
  // ==========================================
  nutrition: {
    // 10-13. Meal Reminders
    scheduleMealReminders: async () => {
      // These should be called when setting up default reminders
      await scheduleReminder({ id: 'bf', type: 'meal', title: '¡Hora de Desayunar!', body: 'Registra tu desayuno para no perder la racha.', time: '08:30', days: [], enabled: true });
      await scheduleReminder({ id: 'lu', type: 'meal', title: '¡Hora de Almorzar!', body: '¿Qué comerás hoy? Regístralo en FitGO.', time: '13:30', days: [], enabled: true });
      await scheduleReminder({ id: 'dn', type: 'meal', title: '¡Hora de Cenar!', body: 'No olvides registrar tu última comida del día.', time: '20:00', days: [], enabled: true });
      await scheduleReminder({ id: 'sn', type: 'meal', title: 'Snack Time', body: '¿Un pequeño antojo? Recuerda tus macros.', time: '16:00', days: [], enabled: true });
    },
    // 14-15. Hydration
    scheduleHydrationReminders: async () => {
      await scheduleReminder({ id: 'w1', type: 'water', title: 'Hidratación Matutina', body: 'No olvides beber agua. ¡Mantente hidratado!', time: '10:00', days: [], enabled: true });
      await scheduleReminder({ id: 'w2', type: 'water', title: 'Hidratación Vespertina', body: 'Sigue bebiendo agua, ya casi logras tu meta.', time: '17:00', days: [], enabled: true });
    },
    // 16-17. Fasting
    fastingStarted: () => {
      triggerInstantNotification('Ayuno Iniciado ⏳', 'Tu periodo de ayuno ha comenzado. ¡Tú puedes!');
    },
    fastingCompleted: () => {
      triggerInstantNotification('Ayuno Completado 🎉', '¡Felicidades! Has cumplido tu meta de ayuno.');
    },
    // 18-19. Calories
    calorieWarning: () => {
      triggerInstantNotification('Cuidado con las Calorías ⚠️', 'Te estás acercando a tu límite calórico del día.');
    },
    calorieGoalReached: () => {
      triggerInstantNotification('Meta Calórica Alcanzada 🎯', 'Has llegado a tu objetivo calórico de hoy.');
    },
  },

  // ==========================================
  // C. WORKOUTS, AI & PROGRESSION
  // ==========================================
  progression: {
    // 20. Pre-workout
    schedulePreWorkout: async (time: string) => {
      await scheduleReminder({ id: 'pw', type: 'workout', title: 'Preparación de Entrenamiento', body: '¡Hora de tu batido o calentamiento pre-entrenamiento!', time, days: [], enabled: true });
    },
    // 21. Inactivity Warning
    inactivityWarning: async () => {
      triggerInstantNotification('Te Extrañamos 😢', 'Han pasado 2 días sin entrenar. ¡Retoma tu progreso hoy!');
    },
    // 22. Achievement Unlocked
    achievementUnlocked: async (title: string) => {
      triggerInstantNotification('¡Logro Desbloqueado! 🏆', `Felicidades, acabas de desbloquear: ${title}`);
    },
    // 23. Weigh-in Reminder
    weighInReminder: async () => {
      await scheduleReminder({ id: 'wi', type: 'custom', title: 'Check-in de Peso ⚖️', body: 'Es hora de registrar tu progreso semanal en la báscula.', time: '07:30', days: [0], enabled: true }); // Sunday
    },
    // 24-25. AI Coach
    aiMorningMotivation: async () => {
      await scheduleReminder({ id: 'ai1', type: 'custom', title: 'Mensaje de tu Entrenador IA 🤖', body: '¡Buenos días! Revisa tu plan para hoy en la pestaña IA.', time: '07:00', days: [], enabled: true });
    },
    aiNightlyReview: async () => {
      await scheduleReminder({ id: 'ai2', type: 'custom', title: 'Resumen Diario IA 🌙', body: 'Veamos cómo te fue hoy con tus objetivos de nutrición.', time: '21:30', days: [], enabled: true });
    },
    // 26. Streak Warning
    streakWarning: async (streak: number) => {
      triggerInstantNotification('¡No Pierdas tu Racha! 🔥', `Llevas ${streak} días seguidos. Registra algo hoy para no perderla.`);
    },
    // 27. Step Goal
    stepGoalWarning: async () => {
      triggerInstantNotification('¡Casi llegas! 🚶‍♂️', 'Estás a pocos pasos de tu meta diaria. ¡Sigue moviéndote!');
    },
    // 28. Recipe Suggestion
    newRecipeSuggested: async () => {
      triggerInstantNotification('Nueva Receta Sugerida 🥗', 'El Coach de IA ha generado una receta especial para ti.');
    },
    // 29. Supplements
    scheduleSupplementReminder: async (time: string) => {
      await scheduleReminder({ id: 'sup', type: 'custom', title: 'Hora de Suplementos 💊', body: 'No olvides tomar tus vitaminas/suplementos de hoy.', time, days: [], enabled: true });
    },
    // 30. Subscription
    subscriptionEnding: async () => {
      triggerInstantNotification('Suscripción Pro 🔒', 'Tu acceso Pro está por terminar. Renueva para mantener tus beneficios.');
    },
  }
};
