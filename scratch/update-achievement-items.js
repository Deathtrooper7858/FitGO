const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../i18n/translations');

// English achievement items translations
const enItems = {
  welcome: { title: 'Welcome!', description: 'You joined the FitGO community.' },
  premium_club: { title: 'Pro Member', description: 'You are part of the exclusive FitGO club.' },
  dark_mode_lover: { title: 'Shadow Lover', description: 'You activated Dark Mode.' },
  profile_complete: { title: 'Perfectionist', description: 'You completed all profile fields.' },
  streak_3: { title: 'Unstoppable', description: 'You maintained a 3-day streak.' },
  streak_7: { title: 'Perfect Week', description: 'You maintained a 7-day streak.' },
  streak_30: { title: 'Iron Month', description: 'You maintained a 30-day streak.' },
  streak_100: { title: 'Centurion', description: 'You maintained a 100-day streak.' },
  streak_365: { title: 'Iron Year', description: 'You maintained a 365-day streak.' },
  streak_500: { title: 'Discipline Titan', description: 'You maintained a 500-day streak.' },
  streak_1000: { title: 'Olympian God', description: 'You maintained a 1000-day streak.' },
  first_log: { title: 'First Step', description: 'You logged your first meal today.' },
  early_bird: { title: 'Early Bird', description: 'You logged breakfast before 9 AM.' },
  protein_goal: { title: 'Pure Protein', description: 'You hit your protein goal today.' },
  healthy_eater: { title: 'Healthy Eater', description: 'You hit your calorie goal within 10% margin.' },
  perfect_macros: { title: 'Perfect Macros', description: 'You hit all your macro goals within 10%.' },
  water_habit: { title: 'Hydrated', description: 'You logged water today.' },
  water_champion: { title: 'Super Hydrated', description: 'You logged over 2000 ml of water in a day.' },
  water_god: { title: 'Ocean God', description: 'You logged 3000 ml (3L) of water in a day.' },
  water_ocean: { title: 'Inner Ocean', description: 'You logged over 4000 ml (4L) of water in a day.' },
  diet_expert: { title: 'Diet Expert', description: 'You logged meals for 30 consecutive days.' },
  hydration_streak_7: { title: 'Steady River', description: 'You hit your water goal for 7 days in a row.' },
  nutrition_scholar: { title: 'Nutrition Scholar', description: 'You discovered and logged exotic or new foods.' },
  carnival_eater: { title: 'Cheat Day', description: 'You consumed over 3500 calories in a day.' },
  vegan_day: { title: 'All Green', description: 'You logged only plant-based foods in a day.' },
  protein_pancake: { title: 'Fitness Chef', description: 'You logged Protein Pancakes for breakfast.' },
  late_snack: { title: 'Midnight Craving', description: 'You logged a snack after 11 PM.' },
  perfect_week_macros: { title: 'Surgical Precision', description: 'You hit perfect macros for 7 days in a row.' },
  carnivore: { title: 'Alpha Predator', description: 'You consumed over 250g of protein in a day.' },
  sweet_tooth: { title: 'Sweet Tooth', description: 'You logged a dessert but still hit your macros.' },
  coffee_addict: { title: 'Caffeine Blood', description: 'You logged more than 3 coffees in a single day.' },
  fasting_monk: { title: 'Fasting Monk', description: 'You went 16 hours without logging any meals.' },
  chef_kiss: { title: 'Chef\'s Kiss', description: 'You created your first custom recipe in the app.' },
  goal_reached: { title: 'On Target', description: 'You are within 1kg of your target weight.' },
  weight_loss_1: { title: 'First Results', description: 'You lost your first 2kg.' },
  muscle_gain_1: { title: 'Growing', description: 'You gained your first 2kg of muscle.' },
  weight_loss_10: { title: 'Total Transformation', description: 'You lost 10kg since you started.' },
  muscle_gain_10: { title: 'Titan', description: 'You gained 10kg of mass since you started.' },
  body_sculptor: { title: 'Body Sculptor', description: 'You logged your body measurements.' },
  photo_pioneer: { title: 'Change Model', description: 'You uploaded your first progress photo.' },
  step_master: { title: 'Walker', description: 'You surpassed 10,000 steps in a day.' },
  step_marathon: { title: 'Urban Marathoner', description: 'You surpassed 15,000 steps in a single day.' },
  step_half_marathon: { title: 'Half Marathon', description: 'You surpassed 25,000 steps in a day.' },
  workout_warrior: { title: 'Steel Warrior', description: 'You trained for over 60 minutes.' },
  workout_machine: { title: 'Unstoppable Machine', description: 'You trained for over 120 minutes.' },
  sleep_master: { title: 'Great Rest', description: 'You slept more than 7 hours.' },
  sleep_champion: { title: 'Sleeping Beauty', description: 'You slept more than 8 hours.' },
  sleep_god: { title: 'Hibernation', description: 'You slept more than 9 hours in one night.' },
  social_star: { title: 'Social Star', description: 'You posted content in the community.' },
  friend_maker: { title: 'Connector', description: 'You added your first friend in FitGO.' },
  team_player: { title: 'Team Player', description: 'You joined a Squad.' },
  community_leader: { title: 'Community Leader', description: 'You reached the global Top 10.' },
  motivator: { title: 'Motivator', description: 'You gave 10 likes to your friends\' posts.' },
  challenge_starter: { title: 'Challenge Starter', description: 'You created your first challenge.' },
  challenge_winner: { title: 'Champion', description: 'You won a challenge.' },
  challenge_5: { title: 'Challenger', description: 'You participated in 5 challenges.' },
  consistent_challenger: { title: 'Iron Challenger', description: 'You completed a 7-day challenge.' },
  squad_creator: { title: 'Squad Leader', description: 'You created your first Squad.' },
  squad_top: { title: 'Squad MVP', description: 'You were the top scorer in your Squad.' },
  competitive_spirit: { title: 'Competitive Spirit', description: 'You reached the Global Top 10 in the ranking.' },
  data_scientist: { title: 'Data Scientist', description: 'You performed a weekly analysis 3 times.' },
  night_owl: { title: 'Night Owl', description: 'You logged a meal after midnight.' },
  planner_pro: { title: 'Planner Pro', description: 'You generated a nutritional plan.' },
  ai_enthusiast: { title: 'AI Enthusiast', description: 'You used the AI Coach 10 times.' },
  mystery_item: { title: '???', description: 'Complete mysterious challenges to unlock this.' },
  ghost_mode: { title: 'Ghost Mode', description: 'You went 7 days without posting.' },
  comeback_kid: { title: 'Comeback Kid', description: 'You came back after a 7+ day streak.' },
  perfect_month: { title: 'Perfect Month', description: 'You logged every day of the month.' },
  super_admin: { title: 'Super Admin', description: 'You are a FitGO super administrator.' },
  system_builder: { title: 'System Architect', description: 'You built the entire FitGO system.' },
  bug_slayer: { title: 'Bug Slayer', description: 'You fixed 100 bugs in FitGO.' },
  data_guardian: { title: 'Data Guardian', description: 'You protected the data of all FitGO users.' },
  innovation_lab: { title: 'Innovation Lab Pioneer', description: 'You launched FitGO\'s first exclusive feature.' },
  app_first_launch: { title: 'First Launch', description: 'You opened FitGO for the first time.' },
  first_ai_chat: { title: 'First AI Chat', description: 'You had your first conversation with Fitz AI.' },
  notifications_enabled: { title: 'Always Connected', description: 'You enabled FitGO notifications.' },
  language_changed: { title: 'Polyglot', description: 'You changed the app language.' },
  theme_changer: { title: 'Style Icon', description: 'You changed the app theme.' },
  first_plan: { title: 'First Plan', description: 'You generated your first meal plan.' },
  first_workout: { title: 'First Workout', description: 'You generated your first workout plan.' },
  share_progress: { title: 'Show Off', description: 'You shared your progress with the community.' },
  biometric_update: { title: 'Body Scanner', description: 'You updated your weight 5 times.' },
  calorie_deficit_7: { title: 'Calorie Deficit Master', description: 'You maintained a calorie deficit for 7 days.' },
  calorie_surplus_7: { title: 'Calorie Surplus Master', description: 'You maintained a calorie surplus for 7 days.' },
  weight_stability: { title: 'Weight Stability', description: 'You maintained your weight for 30 days.' },
  anniversary: { title: 'Anniversary', description: '1 year using FitGO. Congratulations!' },
};

// French achievement items translations
const frItems = {
  welcome: { title: 'Bienvenue !', description: 'Vous avez rejoint la communauté FitGO.' },
  premium_club: { title: 'Membre Pro', description: 'Vous faites partie du club exclusif FitGO.' },
  dark_mode_lover: { title: 'Amant des Ombres', description: 'Vous avez activé le Mode Sombre.' },
  profile_complete: { title: 'Perfectionniste', description: 'Vous avez complété tous les champs de profil.' },
  streak_3: { title: 'Inarrêtable', description: 'Vous avez maintenu une série de 3 jours.' },
  streak_7: { title: 'Semaine Parfaite', description: 'Vous avez maintenu une série de 7 jours.' },
  streak_30: { title: 'Mois de Fer', description: 'Vous avez maintenu une série de 30 jours.' },
  streak_100: { title: 'Centurion', description: 'Vous avez maintenu une série de 100 jours.' },
  streak_365: { title: 'Année de Fer', description: 'Vous avez maintenu une série de 365 jours.' },
  streak_500: { title: 'Titan de la Discipline', description: 'Vous avez maintenu une série de 500 jours.' },
  streak_1000: { title: 'Dieu de l\'Olympe', description: 'Vous avez maintenu une série de 1000 jours.' },
  first_log: { title: 'Premier Pas', description: 'Vous avez enregistré votre premier repas aujourd\'hui.' },
  early_bird: { title: 'Lève-tôt', description: 'Vous avez enregistré le petit-déjeuner avant 9h.' },
  protein_goal: { title: 'Protéine Pure', description: 'Vous avez atteint votre objectif de protéines.' },
  healthy_eater: { title: 'Mangeur Sain', description: 'Vous avez atteint votre objectif calorique à 10% près.' },
  perfect_macros: { title: 'Macros Parfaits', description: 'Vous avez atteint tous vos objectifs de macros.' },
  water_habit: { title: 'Hydraté', description: 'Vous avez enregistré de l\'eau aujourd\'hui.' },
  water_champion: { title: 'Super Hydraté', description: 'Vous avez enregistré plus de 2000 ml d\'eau en une journée.' },
  water_god: { title: 'Dieu de l\'Océan', description: 'Vous avez enregistré 3000 ml (3L) d\'eau en une journée.' },
  water_ocean: { title: 'Océan Intérieur', description: 'Vous avez enregistré plus de 4000 ml d\'eau en une journée.' },
  goal_reached: { title: 'Dans la Cible', description: 'Vous êtes à moins de 1kg de votre poids cible.' },
  step_master: { title: 'Marcheur', description: 'Vous avez dépassé 10 000 pas en une journée.' },
  sleep_master: { title: 'Grand Repos', description: 'Vous avez dormi plus de 7 heures.' },
  social_star: { title: 'Étoile Sociale', description: 'Vous avez publié du contenu dans la communauté.' },
  planner_pro: { title: 'Planificateur Pro', description: 'Vous avez généré un plan nutritionnel.' },
  first_plan: { title: 'Premier Plan', description: 'Vous avez généré votre premier plan nutritionnel.' },
  first_workout: { title: 'Premier Entraînement', description: 'Vous avez généré votre premier plan d\'entraînement.' },
  anniversary: { title: 'Anniversaire', description: '1 an avec FitGO. Félicitations !' },
};

// German achievement items translations
const deItems = {
  welcome: { title: 'Willkommen!', description: 'Du bist der FitGO-Community beigetreten.' },
  premium_club: { title: 'Pro-Mitglied', description: 'Du bist Teil des exklusiven FitGO-Clubs.' },
  dark_mode_lover: { title: 'Schatten-Liebhaber', description: 'Du hast den Dunkelmodus aktiviert.' },
  profile_complete: { title: 'Perfektionist', description: 'Du hast alle Profilfelder ausgefüllt.' },
  streak_3: { title: 'Unaufhaltsam', description: 'Du hast eine 3-Tage-Serie aufrechterhalten.' },
  streak_7: { title: 'Perfekte Woche', description: 'Du hast eine 7-Tage-Serie aufrechterhalten.' },
  streak_30: { title: 'Eisenmonat', description: 'Du hast eine 30-Tage-Serie aufrechterhalten.' },
  streak_100: { title: 'Centurion', description: 'Du hast eine 100-Tage-Serie aufrechterhalten.' },
  streak_365: { title: 'Eisenjahr', description: 'Du hast eine 365-Tage-Serie aufrechterhalten.' },
  first_log: { title: 'Erster Schritt', description: 'Du hast heute deine erste Mahlzeit eingetragen.' },
  protein_goal: { title: 'Reines Protein', description: 'Du hast heute dein Protein-Ziel erreicht.' },
  healthy_eater: { title: 'Gesunder Esser', description: 'Du hast dein Kalorienziel innerhalb von 10% erreicht.' },
  water_habit: { title: 'Gut hydratisiert', description: 'Du hast heute Wasser eingetragen.' },
  goal_reached: { title: 'Am Ziel', description: 'Du bist weniger als 1kg von deinem Zielgewicht entfernt.' },
  step_master: { title: 'Wanderer', description: 'Du hast 10.000 Schritte an einem Tag überschritten.' },
  sleep_master: { title: 'Große Erholung', description: 'Du hast mehr als 7 Stunden geschlafen.' },
  social_star: { title: 'Sozialer Stern', description: 'Du hast Inhalte in der Community gepostet.' },
  first_plan: { title: 'Erster Plan', description: 'Du hast deinen ersten Ernährungsplan generiert.' },
  anniversary: { title: 'Jubiläum', description: '1 Jahr mit FitGO. Herzlichen Glückwunsch!' },
};

const langs = ['en', 'fr', 'de'];
const itemsByLang = { en: enItems, fr: frItems, de: deItems };

for (const lang of langs) {
  const file = path.join(dir, `${lang}.json`);
  const json = JSON.parse(fs.readFileSync(file, 'utf-8'));

  if (!json.achievements) json.achievements = {};
  if (!json.achievements.items) json.achievements.items = {};

  const items = itemsByLang[lang];
  for (const [id, data] of Object.entries(items)) {
    if (!json.achievements.items[id]) json.achievements.items[id] = {};
    json.achievements.items[id].title = data.title;
    json.achievements.items[id].description = data.description;
  }

  fs.writeFileSync(file, JSON.stringify(json, null, 2));
  console.log(`Updated ${lang}.json with ${Object.keys(items).length} achievement items`);
}
