import { scheduleReminder, triggerInstantNotification, sendRemotePushNotification } from '../services/notifications';
import { Reminder } from '../store/types';
import i18n from '../i18n';

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
        sendRemotePushNotification(token, `💬 ${squadName}`, i18n.t('notifTriggers.newSquadMessage', { sender: senderName }));
      });
    },
    joinRequest: async (token: string, userName: string, squadName: string) => {
      if(token) sendRemotePushNotification(token, `👥 ${i18n.t('notifTriggers.joinRequestTitle')}`, i18n.t('notifTriggers.joinRequest', { user: userName, squad: squadName }));
    },
    memberJoined: async (tokens: string[], userName: string, squadName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `🎉 ${i18n.t('notifTriggers.memberJoinedTitle')}`, i18n.t('notifTriggers.memberJoined', { user: userName, squad: squadName }));
      });
    },
    squadDeleted: async (tokens: string[], squadName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `⚠️ ${i18n.t('notifTriggers.squadDeletedTitle')}`, i18n.t('notifTriggers.squadDeleted', { squad: squadName }));
      });
    },
    memberKicked: async (token: string, squadName: string) => {
      if(token) sendRemotePushNotification(token, `⛔ ${i18n.t('notifTriggers.memberKickedTitle')}`, i18n.t('notifTriggers.memberKicked', { squad: squadName }));
    },
    newInvite: async (token: string, squadName: string) => {
      if(token) sendRemotePushNotification(token, `📩 ${i18n.t('notifTriggers.newInviteTitle')}`, i18n.t('notifTriggers.newInvite', { squad: squadName }));
    },
    leaguePointsReached: async (tokens: string[], points: number) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `🏅 ${i18n.t('notifTriggers.leaguePointsTitle')}`, i18n.t('notifTriggers.leaguePoints', { points }));
      });
    },
    planShared: async (token: string, fromUser: string) => {
      if(token) sendRemotePushNotification(token, `📋 ${i18n.t('notifTriggers.planSharedTitle')}`, i18n.t('notifTriggers.planShared', { user: fromUser }));
    },
    challengeStarted: async (tokens: string[], challengeName: string) => {
      tokens.forEach(token => {
        sendRemotePushNotification(token, `⚔️ ${i18n.t('notifTriggers.challengeStartedTitle')}`, i18n.t('notifTriggers.challengeStarted', { challenge: challengeName }));
      });
    },
  },

  // ==========================================
  // B. NUTRITION & HABITS (Local / Instant)
  // ==========================================
  nutrition: {
    // 10-13. Meal Reminders
    scheduleMealReminders: async () => {
      await scheduleReminder({ id: 'bf', type: 'meal', title: '🍳 ' + i18n.t('notifTriggers.breakfastTitle'), body: i18n.t('notifTriggers.breakfastBody'), time: '08:30', days: [], enabled: true });
      await scheduleReminder({ id: 'lu', type: 'meal', title: '🥗 ' + i18n.t('notifTriggers.lunchTitle'), body: i18n.t('notifTriggers.lunchBody'), time: '13:30', days: [], enabled: true });
      await scheduleReminder({ id: 'dn', type: 'meal', title: '🍽️ ' + i18n.t('notifTriggers.dinnerTitle'), body: i18n.t('notifTriggers.dinnerBody'), time: '20:00', days: [], enabled: true });
      await scheduleReminder({ id: 'sn', type: 'meal', title: '🍎 ' + i18n.t('notifTriggers.snackTitle'), body: i18n.t('notifTriggers.snackBody'), time: '16:00', days: [], enabled: true });
    },
    // 14-15. Hydration
    scheduleHydrationReminders: async () => {
      await scheduleReminder({ id: 'w1', type: 'water', title: '💧 ' + i18n.t('notifTriggers.hydrationAMTitle'), body: i18n.t('notifTriggers.hydrationAMBody'), time: '10:00', days: [], enabled: true });
      await scheduleReminder({ id: 'w2', type: 'water', title: '💧 ' + i18n.t('notifTriggers.hydrationPMTTitle'), body: i18n.t('notifTriggers.hydrationPMTBody'), time: '17:00', days: [], enabled: true });
    },
    // 16-17. Fasting
    fastingStarted: () => {
      triggerInstantNotification('⏳ ' + i18n.t('notifTriggers.fastingStartedTitle'), i18n.t('notifTriggers.fastingStartedBody'), undefined, 'nutrition');
    },
    fastingCompleted: () => {
      triggerInstantNotification('🎉 ' + i18n.t('notifTriggers.fastingCompletedTitle'), i18n.t('notifTriggers.fastingCompletedBody'), undefined, 'nutrition');
    },
    // 18-19. Calories
    calorieWarning: () => {
      triggerInstantNotification('⚠️ ' + i18n.t('notifTriggers.calorieWarningTitle'), i18n.t('notifTriggers.calorieWarningBody'), undefined, 'nutrition');
    },
    calorieGoalReached: () => {
      triggerInstantNotification('🎯 ' + i18n.t('notifTriggers.calorieGoalTitle'), i18n.t('notifTriggers.calorieGoalBody'), undefined, 'nutrition');
    },
  },

  // ==========================================
  // C. WORKOUTS, AI & PROGRESSION
  // ==========================================
  progression: {
    // 20. Pre-workout
    schedulePreWorkout: async (time: string) => {
      await scheduleReminder({ id: 'pw', type: 'workout', title: '💪 ' + i18n.t('notifTriggers.preWorkoutTitle'), body: i18n.t('notifTriggers.preWorkoutBody'), time, days: [], enabled: true });
    },
    // 21. Inactivity Warning
    inactivityWarning: async () => {
      triggerInstantNotification('😢 ' + i18n.t('notifTriggers.inactivityTitle'), i18n.t('notifTriggers.inactivityBody'), undefined, 'fitness');
    },
    // 22. Achievement Unlocked
    achievementUnlocked: async (title: string) => {
      triggerInstantNotification('🏆 ' + i18n.t('notifTriggers.achievementTitle'), i18n.t('notifTriggers.achievementBody', { achievement: title }), undefined, 'achievements');
    },
    // 23. Weigh-in Reminder
    weighInReminder: async () => {
      await scheduleReminder({ id: 'wi', type: 'custom', title: '⚖️ ' + i18n.t('notifTriggers.weighInTitle'), body: i18n.t('notifTriggers.weighInBody'), time: '07:30', days: [0], enabled: true }); // Sunday
    },
    // 24-25. AI Coach
    aiMorningMotivation: async () => {
      await scheduleReminder({ id: 'ai1', type: 'custom', title: '🤖 ' + i18n.t('notifTriggers.aiMorningTitle'), body: i18n.t('notifTriggers.aiMorningBody'), time: '07:00', days: [], enabled: true });
    },
    aiNightlyReview: async () => {
      await scheduleReminder({ id: 'ai2', type: 'custom', title: '🌙 ' + i18n.t('notifTriggers.aiNightlyTitle'), body: i18n.t('notifTriggers.aiNightlyBody'), time: '21:30', days: [], enabled: true });
    },
    // 26. Streak Warning
    streakWarning: async (streak: number) => {
      triggerInstantNotification('🔥 ' + i18n.t('notifTriggers.streakTitle'), i18n.t('notifTriggers.streakBody', { days: streak }), undefined, 'fitness');
    },
    // 27. Step Goal
    stepGoalWarning: async () => {
      triggerInstantNotification('🚶‍♂️ ' + i18n.t('notifTriggers.stepGoalTitle'), i18n.t('notifTriggers.stepGoalBody'), undefined, 'fitness');
    },
    // 28. Recipe Suggestion
    newRecipeSuggested: async () => {
      triggerInstantNotification('🥗 ' + i18n.t('notifTriggers.recipeTitle'), i18n.t('notifTriggers.recipeBody'), undefined, 'nutrition');
    },
    // 29. Supplements
    scheduleSupplementReminder: async (time: string) => {
      await scheduleReminder({ id: 'sup', type: 'custom', title: '💊 ' + i18n.t('notifTriggers.supplementTitle'), body: i18n.t('notifTriggers.supplementBody'), time, days: [], enabled: true });
    },
    // 30. Subscription
    subscriptionEnding: async () => {
      triggerInstantNotification('🔒 ' + i18n.t('notifTriggers.subscriptionTitle'), i18n.t('notifTriggers.subscriptionBody'), undefined, 'default');
    },
  }
};
