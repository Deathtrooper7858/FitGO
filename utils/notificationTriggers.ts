import { scheduleReminder, triggerInstantNotification, sendRemotePushNotification } from '../services/notifications';
import { Reminder } from '../store/types';

/**
 * 30 Notification Triggers - Categorized
 * Cada trigger usa su canal correspondiente para diferenciarse visualmente en Android.
 */
export const NotificationTriggers = {
  // ==========================================
  // A. SOCIAL & COMMUNITY (Remote Push)
  // ==========================================
  social: {
    newSquadMessage: async (tokens: string[], senderName: string, squadName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `💬 ${squadName}`, `${senderName} envió un mensaje.`);
      });
    },
    joinRequest: async (token: string, userName: string, squadName: string) => {
      if(token) sendRemotePushNotification(token, `👥 Solicitud de unión`, `${userName} quiere unirse a ${squadName}.`);
    },
    memberJoined: async (tokens: string[], userName: string, squadName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `🎉 Nuevo miembro`, `${userName} se ha unido a ${squadName}!`);
      });
    },
    squadDeleted: async (tokens: string[], squadName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `⚠️ Squad eliminado`, `El líder ha disuelto el squad ${squadName}.`);
      });
    },
    memberKicked: async (token: string, squadName: string) => {
      if(token) sendRemotePushNotification(token, `⛔ Eliminado del squad`, `Has sido expulsado de ${squadName}.`);
    },
    newInvite: async (token: string, squadName: string) => {
      if(token) sendRemotePushNotification(token, `📩 Nueva invitación`, `Te han invitado a unirte a ${squadName}.`);
    },
    leaguePointsReached: async (tokens: string[], points: number) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `🏅 ¡Hito de liga!`, `Tu Squad acaba de alcanzar ${points} puntos de liga.`);
      });
    },
    planShared: async (token: string, fromUser: string) => {
      if(token) sendRemotePushNotification(token, `📋 Plan compartido`, `${fromUser} ha compartido un plan de entrenamiento contigo.`);
    },
    challengeStarted: async (tokens: string[], challengeName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `⚔️ ¡Desafío iniciado!`, `El desafío "${challengeName}" ha comenzado. ¡A darlo todo!`);
      });
    },
  },

  // ==========================================
  // B. NUTRITION & HABITS (Local / Instant)
  // ==========================================
  nutrition: {
    // 10-13. Meal Reminders
    scheduleMealReminders: async () => {
      await scheduleReminder({ id: 'bf', type: 'meal', title: '🍳 ¡Hora de Desayunar!', body: 'Registra tu desayuno para no perder la racha.', time: '08:30', days: [], enabled: true });
      await scheduleReminder({ id: 'lu', type: 'meal', title: '🥗 ¡Hora de Almorzar!', body: '¿Qué comerás hoy? Regístralo en FitGO.', time: '13:30', days: [], enabled: true });
      await scheduleReminder({ id: 'dn', type: 'meal', title: '🍽️ ¡Hora de Cenar!', body: 'No olvides registrar tu última comida del día.', time: '20:00', days: [], enabled: true });
      await scheduleReminder({ id: 'sn', type: 'meal', title: '🍎 Snack Time', body: '¿Un pequeño antojo? Recuerda tus macros.', time: '16:00', days: [], enabled: true });
    },
    // 14-15. Hydration
    scheduleHydrationReminders: async () => {
      await scheduleReminder({ id: 'w1', type: 'water', title: '💧 Hidratación Matutina', body: 'No olvides beber agua. ¡Mantente hidratado!', time: '10:00', days: [], enabled: true });
      await scheduleReminder({ id: 'w2', type: 'water', title: '💧 Hidratación Vespertina', body: 'Sigue bebiendo agua, ya casi logras tu meta.', time: '17:00', days: [], enabled: true });
    },
    // 16-17. Fasting
    fastingStarted: () => {
      triggerInstantNotification('⏳ Ayuno iniciado', 'Tu periodo de ayuno ha comenzado. ¡Tú puedes!', undefined, 'nutrition');
    },
    fastingCompleted: () => {
      triggerInstantNotification('🎉 ¡Ayuno completado!', '¡Felicidades! Has cumplido tu meta de ayuno.', undefined, 'nutrition');
    },
    // 18-19. Calories
    calorieWarning: () => {
      triggerInstantNotification('⚠️ Cuidado con las calorías', 'Te estás acercando a tu límite calórico del día.', undefined, 'nutrition');
    },
    calorieGoalReached: () => {
      triggerInstantNotification('🎯 ¡Meta calórica alcanzada!', 'Has llegado a tu objetivo calórico de hoy. ¡Buen trabajo!', undefined, 'nutrition');
    },
  },

  // ==========================================
  // C. WORKOUTS, AI & PROGRESSION
  // ==========================================
  progression: {
    // 20. Pre-workout
    schedulePreWorkout: async (time: string) => {
      await scheduleReminder({ id: 'pw', type: 'workout', title: '💪 Preparación de Entrenamiento', body: '¡Hora de tu batido o calentamiento pre-entrenamiento!', time, days: [], enabled: true });
    },
    // 21. Inactivity Warning
    inactivityWarning: async () => {
      triggerInstantNotification('😢 ¡Te extrañamos!', 'Han pasado 2 días sin entrenar. ¡Retoma tu progreso hoy!', undefined, 'fitness');
    },
    // 22. Achievement Unlocked
    achievementUnlocked: async (title: string) => {
      triggerInstantNotification('🏆 ¡Logro desbloqueado!', `Acabas de desbloquear: ${title}`, undefined, 'achievements');
    },
    // 23. Weigh-in Reminder
    weighInReminder: async () => {
      await scheduleReminder({ id: 'wi', type: 'custom', title: '⚖️ Check-in de Peso', body: 'Es hora de registrar tu progreso semanal en la báscula.', time: '07:30', days: [0], enabled: true }); // Sunday
    },
    // 24-25. AI Coach
    aiMorningMotivation: async () => {
      await scheduleReminder({ id: 'ai1', type: 'custom', title: '🤖 Mensaje de tu Entrenador IA', body: '¡Buenos días! Revisa tu plan para hoy en la pestaña IA.', time: '07:00', days: [], enabled: true });
    },
    aiNightlyReview: async () => {
      await scheduleReminder({ id: 'ai2', type: 'custom', title: '🌙 Resumen Diario IA', body: 'Veamos cómo te fue hoy con tus objetivos de nutrición.', time: '21:30', days: [], enabled: true });
    },
    // 26. Streak Warning
    streakWarning: async (streak: number) => {
      triggerInstantNotification('🔥 ¡No pierdas tu racha!', `Llevas ${streak} días seguidos. Registra algo hoy para no perderla.`, undefined, 'fitness');
    },
    // 27. Step Goal
    stepGoalWarning: async () => {
      triggerInstantNotification('🚶‍♂️ ¡Casi llegas!', 'Estás a pocos pasos de tu meta diaria. ¡Sigue moviéndote!', undefined, 'fitness');
    },
    // 28. Recipe Suggestion
    newRecipeSuggested: async () => {
      triggerInstantNotification('🥗 Nueva receta sugerida', 'El Coach de IA ha generado una receta especial para ti.', undefined, 'nutrition');
    },
    // 29. Supplements
    scheduleSupplementReminder: async (time: string) => {
      await scheduleReminder({ id: 'sup', type: 'custom', title: '💊 Hora de Suplementos', body: 'No olvides tomar tus vitaminas/suplementos de hoy.', time, days: [], enabled: true });
    },
    // 30. Subscription
    subscriptionEnding: async () => {
      triggerInstantNotification('🔒 Suscripción Pro', 'Tu acceso Pro está por terminar. Renueva para mantener tus beneficios.', undefined, 'default');
    },
  }
};
