const fs = require('fs');
const path = require('path');

const TRANSLATIONS_DIR = path.join(__dirname, '..', 'i18n', 'translations');

// All translations for each language
const translations = {
  es: {
    // About section
    'about.website': 'Sitio Web',
    'about.credits': 'Créditos',
    
    // Profile - colors
    'profile.colors.default': 'Morado Clásico',
    'profile.colors.gold': 'Dorado Élite',
    'profile.colors.blue': 'Azul Eléctrico',
    'profile.colors.green': 'Verde Neón',
    'profile.colors.red': 'Rojo Rubí',
    'profile.colors.orange': 'Naranja Fuego',
    'profile.colors.magenta': 'Magenta Oscuro',
    'profile.colors.pink': 'Rosa Atardecer',
    'profile.colors.emerald': 'Verde Esmeralda',
    'profile.colors.turquoise': 'Turquesa Profundo',
    'profile.colors.purple': 'Púrpura Imperial',
    'profile.colors.silver': 'Plata Cromo',
    'profile.colors.defaultSubtitle': 'El color por defecto',
    'profile.inviteFriends': 'Invitar Amigos',
    
    // Credits dialog
    'about.creditsTitle': 'Créditos',
    'about.creditsMessage': 'Las animaciones (GIFs) del directorio de ejercicios son propiedad y cortesía de ExerciseDB API.',
    'about.creditsOk': 'Entendido',
    
    // Reminders categories
    'reminders.category.all': 'Todos',
    'reminders.category.meal': 'Comidas',
    'reminders.category.water': 'Hidratación',
    'reminders.category.workout': 'Entrenamiento',
    'reminders.category.general': 'General',
    'reminders.category.social': 'Social & Competitivo',
    
    // No credits modal
    'noCredits.title': 'Sin energía IA por hoy',
    'noCredits.subtitle': 'Usaste tus créditos diarios. Elige cómo continuar:',
    'noCredits.photoDay': 'foto/día',
    'noCredits.textDay': 'texto/día',
    'noCredits.watchAd': 'Ver video corto',
    'noCredits.watchAdDesc': 'Gana +1 crédito IA ⚡ gratis',
    'noCredits.free': 'GRATIS',
    'noCredits.goPro': 'Hacerse Pro · IA Ilimitada',
    'noCredits.price': 'Solo $11.800 COP/mes · Cancela cuando quieras',
    'noCredits.videoLimit': 'Límite de videos alcanzado',
    'noCredits.comeBack': 'Vuelve mañana para más créditos',
    'noCredits.earned': '⚡ +{{count}} créditos ganados',
    'noCredits.earnedSub': '¡Gracias! Ya puedes seguir usando la IA.',
    
    // Premium colors modal
    'premiumColors.title': 'Color Premium',
    'premiumColors.proExclusive': 'Exclusivo para Pro',
    'premiumColors.proDesc': 'Mejora tu cuenta para desbloquear los colores premium y destacar en la aplicación.',
    'premiumColors.upgrade': 'Mejorar',
    'premiumColors.description': 'Personaliza el aspecto de toda la aplicación eligiendo tu color de acento favorito.',
    
    // Default reminder titles and bodies
    'reminders.default.breakfast': 'Desayuno',
    'reminders.default.breakfastBody': '¡Hora de un desayuno saludable!',
    'reminders.default.lunch': 'Almuerzo',
    'reminders.default.lunchBody': '¡No olvides tu almuerzo nutritivo!',
    'reminders.default.dinner': 'Cena',
    'reminders.default.dinnerBody': 'Hora de tu cena. ¡Que aproveche!',
    'reminders.default.snack': 'Merienda',
    'reminders.default.snackBody': '¡Hora de un snack saludable!',
    'reminders.default.water': 'Agua',
    'reminders.default.waterBody': '¡Mantente hidratado! Bebe un vaso de agua.',
    'reminders.default.waterAfternoon': 'Agua tarde',
    'reminders.default.waterAfternoonBody': '¡No olvides hidratarte por la tarde!',
    'reminders.default.workout': 'Entreno',
    'reminders.default.workoutBody': '¡Hora de cumplir tu meta de movimiento!',
    'reminders.default.walk': 'Caminata',
    'reminders.default.walkBody': '¡Revisa tus pasos! Hora de una caminata.',
    'reminders.default.cardio': 'Cardio',
    'reminders.default.cardioBody': '¡Activa tu cardio del día!',
    'reminders.default.vitamins': 'Vitaminas',
    'reminders.default.vitaminsBody': '¡Recuerda tomar tus vitaminas y suplementos!',
    'reminders.default.sleep': 'Dormir',
    'reminders.default.sleepBody': '¡Descansa bien para recuperarte!',
    'reminders.default.log': 'Registro',
    'reminders.default.logBody': '¡Registra tus comidas de hoy en FitGo!',
    'reminders.default.league': 'Liga',
    'reminders.default.leagueBody': '¡La batalla de la liga no para! Revisa tu posición.',
    'reminders.default.dailyChallenge': 'Reto diario',
    'reminders.default.dailyChallengeBody': '¡Completa el reto diario antes de que expire!',
    'reminders.default.friends': 'Amigos',
    'reminders.default.friendsBody': '¡Mira qué están logrando tus amigos hoy!',
    'reminders.default.streak': 'Racha',
    'reminders.default.streakBody': '¡No rompas tu racha! Registra tu progreso.',
    'reminders.default.achievements': 'Logros',
    'reminders.default.achievementsBody': '¡Tienes logros desbloqueados esperándote!',
    'reminders.default.leaderboard': 'Leaderboard',
    'reminders.default.leaderboardBody': '🔥 El ranking semanal termina pronto. ¡Sube posiciones!',
    'reminders.default.messages': 'Mensajes',
    'reminders.default.messagesBody': '💬 ¡Tienes nuevos mensajes en FitGO Social!',
  },
  
  en: {
    // About section
    'about.website': 'Website',
    'about.credits': 'Credits',
    
    // Profile - colors
    'profile.colors.default': 'Classic Purple',
    'profile.colors.gold': 'Elite Gold',
    'profile.colors.blue': 'Electric Blue',
    'profile.colors.green': 'Neon Green',
    'profile.colors.red': 'Ruby Red',
    'profile.colors.orange': 'Fire Orange',
    'profile.colors.magenta': 'Dark Magenta',
    'profile.colors.pink': 'Sunset Pink',
    'profile.colors.emerald': 'Emerald Green',
    'profile.colors.turquoise': 'Deep Turquoise',
    'profile.colors.purple': 'Imperial Purple',
    'profile.colors.silver': 'Chrome Silver',
    'profile.colors.defaultSubtitle': 'The default color',
    'profile.inviteFriends': 'Invite Friends',
    
    // Credits dialog
    'about.creditsTitle': 'Credits',
    'about.creditsMessage': 'The animations (GIFs) in the exercise directory are property of and courtesy of ExerciseDB API.',
    'about.creditsOk': 'Got it',
    
    // Reminders categories
    'reminders.category.all': 'All',
    'reminders.category.meal': 'Meals',
    'reminders.category.water': 'Hydration',
    'reminders.category.workout': 'Training',
    'reminders.category.general': 'General',
    'reminders.category.social': 'Social & Competitive',
    
    // No credits modal
    'noCredits.title': 'No AI energy for today',
    'noCredits.subtitle': 'You used your daily credits. Choose how to continue:',
    'noCredits.photoDay': 'photo/day',
    'noCredits.textDay': 'text/day',
    'noCredits.watchAd': 'Watch short video',
    'noCredits.watchAdDesc': 'Earn +1 free AI credit ⚡',
    'noCredits.free': 'FREE',
    'noCredits.goPro': 'Go Pro · Unlimited AI',
    'noCredits.price': 'Only $11,800 COP/month · Cancel anytime',
    'noCredits.videoLimit': 'Video limit reached',
    'noCredits.comeBack': 'Come back tomorrow for more credits',
    'noCredits.earned': '⚡ +{{count}} credits earned',
    'noCredits.earnedSub': 'Thanks! You can continue using AI now.',
    
    // Premium colors modal
    'premiumColors.title': 'Premium Color',
    'premiumColors.proExclusive': 'Pro Exclusive',
    'premiumColors.proDesc': 'Upgrade your account to unlock premium colors and stand out in the app.',
    'premiumColors.upgrade': 'Upgrade',
    'premiumColors.description': 'Customize the look of the entire app by choosing your favorite accent color.',
    
    // Default reminder titles and bodies
    'reminders.default.breakfast': 'Breakfast',
    'reminders.default.breakfastBody': 'Time for a healthy breakfast!',
    'reminders.default.lunch': 'Lunch',
    'reminders.default.lunchBody': "Don't miss your nutritious lunch!",
    'reminders.default.dinner': 'Dinner',
    'reminders.default.dinnerBody': 'Time for dinner. Enjoy your meal!',
    'reminders.default.snack': 'Snack',
    'reminders.default.snackBody': 'Time for a healthy snack!',
    'reminders.default.water': 'Water',
    'reminders.default.waterBody': 'Stay hydrated! Drink a glass of water.',
    'reminders.default.waterAfternoon': 'Afternoon water',
    'reminders.default.waterAfternoonBody': "Don't forget to hydrate in the afternoon!",
    'reminders.default.workout': 'Workout',
    'reminders.default.workoutBody': "Time to reach your movement goal!",
    'reminders.default.walk': 'Walk',
    'reminders.default.walkBody': 'Check your steps! Time for a walk.',
    'reminders.default.cardio': 'Cardio',
    'reminders.default.cardioBody': 'Activate your daily cardio!',
    'reminders.default.vitamins': 'Vitamins',
    'reminders.default.vitaminsBody': 'Remember to take your vitamins and supplements!',
    'reminders.default.sleep': 'Sleep',
    'reminders.default.sleepBody': 'Rest well to recover!',
    'reminders.default.log': 'Log',
    'reminders.default.logBody': "Log today's meals in FitGo!",
    'reminders.default.league': 'League',
    'reminders.default.leagueBody': 'The league battle never stops! Check your position.',
    'reminders.default.dailyChallenge': 'Daily challenge',
    'reminders.default.dailyChallengeBody': 'Complete the daily challenge before it expires!',
    'reminders.default.friends': 'Friends',
    'reminders.default.friendsBody': "See what your friends are achieving today!",
    'reminders.default.streak': 'Streak',
    'reminders.default.streakBody': "Don't break your streak! Log your progress.",
    'reminders.default.achievements': 'Achievements',
    'reminders.default.achievementsBody': 'You have unlocked achievements waiting for you!',
    'reminders.default.leaderboard': 'Leaderboard',
    'reminders.default.leaderboardBody': '🔥 Weekly ranking ends soon. Climb the ranks!',
    'reminders.default.messages': 'Messages',
    'reminders.default.messagesBody': '💬 You have new messages on FitGO Social!',
  },
  
  fr: {
    // About section
    'about.website': 'Site Web',
    'about.credits': 'Crédits',
    
    // Profile - colors
    'profile.colors.default': 'Violet Classique',
    'profile.colors.gold': "Or d'Élite",
    'profile.colors.blue': 'Bleu Électrique',
    'profile.colors.green': 'Vert Néon',
    'profile.colors.red': 'Rouge Rubis',
    'profile.colors.orange': 'Orange Feu',
    'profile.colors.magenta': 'Magenta Foncé',
    'profile.colors.pink': 'Rose Coucher de Soleil',
    'profile.colors.emerald': 'Vert Émeraude',
    'profile.colors.turquoise': 'Turquoise Profond',
    'profile.colors.purple': 'Violet Impérial',
    'profile.colors.silver': 'Argent Chromé',
    'profile.colors.defaultSubtitle': 'La couleur par défaut',
    'profile.inviteFriends': 'Inviter des Amis',
    
    // Credits dialog
    'about.creditsTitle': 'Crédits',
    'about.creditsMessage': "Les animations (GIFs) du répertoire d'exercices sont la propriété et la courtoisie de ExerciseDB API.",
    'about.creditsOk': 'Compris',
    
    // Reminders categories
    'reminders.category.all': 'Tous',
    'reminders.category.meal': 'Repas',
    'reminders.category.water': 'Hydratation',
    'reminders.category.workout': 'Entraînement',
    'reminders.category.general': 'Général',
    'reminders.category.social': 'Social & Compétitif',
    
    // No credits modal
    'noCredits.title': "Pas d'énergie IA pour aujourd'hui",
    'noCredits.subtitle': "Vous avez utilisé vos crédits quotidiens. Choisissez comment continuer :",
    'noCredits.photoDay': 'photo/jour',
    'noCredits.textDay': 'texte/jour',
    'noCredits.watchAd': 'Regarder une courte vidéo',
    'noCredits.watchAdDesc': 'Gagnez +1 crédit IA ⚡ gratuit',
    'noCredits.free': 'GRATUIT',
    'noCredits.goPro': 'Passer Pro · IA Illimitée',
    'noCredits.price': "Seulement 11 800 COP/mois · Annulez quand vous voulez",
    'noCredits.videoLimit': 'Limite de vidéos atteinte',
    'noCredits.comeBack': 'Revenez demain pour plus de crédits',
    'noCredits.earned': '⚡ +{{count}} crédits gagnés',
    'noCredits.earnedSub': 'Merci ! Vous pouvez continuer à utiliser IA.',
    
    // Premium colors modal
    'premiumColors.title': 'Couleur Premium',
    'premiumColors.proExclusive': 'Exclusif aux Pro',
    'premiumColors.proDesc': "Passez à la version supérieure pour débloquer les couleurs premium et vous démarquer dans l'application.",
    'premiumColors.upgrade': 'Améliorer',
    'premiumColors.description': "Personnalisez l'apparence de l'application entière en choisissant votre couleur d'accent préférée.",
    
    // Default reminder titles and bodies
    'reminders.default.breakfast': 'Petit-déjeuner',
    'reminders.default.breakfastBody': "C'est l'heure d'un petit-déjeuner sain !",
    'reminders.default.lunch': 'Déjeuner',
    'reminders.default.lunchBody': "N'oubliez pas votre déjeuner nutritif !",
    'reminders.default.dinner': 'Dîner',
    'reminders.default.dinnerBody': "C'est l'heure du dîner. Bon appétit !",
    'reminders.default.snack': 'Collation',
    'reminders.default.snackBody': "C'est l'heure d'une collation saine !",
    'reminders.default.water': 'Eau',
    'reminders.default.waterBody': "Restez hydraté ! Buvez un verre d'eau.",
    'reminders.default.waterAfternoon': 'Eau après-midi',
    'reminders.default.waterAfternoonBody': "N'oubliez pas de vous hydrater l'après-midi !",
    'reminders.default.workout': 'Entraînement',
    'reminders.default.workoutBody': "C'est l'heure d'atteindre votre objectif de mouvement !",
    'reminders.default.walk': 'Marche',
    'reminders.default.walkBody': "Vérifiez vos pas ! C'est l'heure de marcher.",
    'reminders.default.cardio': 'Cardio',
    'reminders.default.cardioBody': "Activez votre cardio du jour !",
    'reminders.default.vitamins': 'Vitamines',
    'reminders.default.vitaminsBody': "N'oubliez pas de prendre vos vitamines et suppléments !",
    'reminders.default.sleep': 'Sommeil',
    'reminders.default.sleepBody': "Reposez-vous bien pour récupérer !",
    'reminders.default.log': 'Journal',
    'reminders.default.logBody': "Enregistrez vos repas du jour dans FitGo !",
    'reminders.default.league': 'Ligue',
    'reminders.default.leagueBody': "La bataille de la ligue ne s'arrête pas ! Vérifiez votre position.",
    'reminders.default.dailyChallenge': 'Défi quotidien',
    'reminders.default.dailyChallengeBody': "Complétez le défi quotidien avant qu'il n'expire !",
    'reminders.default.friends': 'Amis',
    'reminders.default.friendsBody': "Voyez ce que vos amis accomplissent aujourd'hui !",
    'reminders.default.streak': 'Série',
    'reminders.default.streakBody': "Ne brisez pas votre série ! Enregistrez vos progrès.",
    'reminders.default.achievements': 'Succès',
    'reminders.default.achievementsBody': "Vous avez des succès débloqués qui vous attendent !",
    'reminders.default.leaderboard': 'Classement',
    'reminders.default.leaderboardBody': "Le classement hebdomadaire se termine bientôt. Montez dans le rang !",
    'reminders.default.messages': 'Messages',
    'reminders.default.messagesBody': "💬 Vous avez de nouveaux messages sur FitGO Social !",
  },
  
  de: {
    // About section
    'about.website': 'Webseite',
    'about.credits': 'Credits',
    
    // Profile - colors
    'profile.colors.default': 'Klassisches Lila',
    'profile.colors.gold': 'Elite-Gold',
    'profile.colors.blue': 'Elektrisches Blau',
    'profile.colors.green': 'Neongrün',
    'profile.colors.red': 'Rubinrot',
    'profile.colors.orange': 'Feuerorange',
    'profile.colors.magenta': 'Dunkles Magenta',
    'profile.colors.pink': 'Sonnenuntergang-Rosa',
    'profile.colors.emerald': 'Smaragdgrün',
    'profile.colors.turquoise': 'Tiefes Türkis',
    'profile.colors.purple': 'Imperiales Violett',
    'profile.colors.silver': 'Chromsilber',
    'profile.colors.defaultSubtitle': 'Die Standardfarbe',
    'profile.inviteFriends': 'Freunde Einladen',
    
    // Credits dialog
    'about.creditsTitle': 'Credits',
    'about.creditsMessage': 'Die Animationen (GIFs) im Übungsverzeichnis sind Eigentum von und courtesy ExerciseDB API.',
    'about.creditsOk': 'Verstanden',
    
    // Reminders categories
    'reminders.category.all': 'Alle',
    'reminders.category.meal': 'Mahlzeiten',
    'reminders.category.water': 'Hydration',
    'reminders.category.workout': 'Training',
    'reminders.category.general': 'Allgemein',
    'reminders.category.social': 'Sozial & Wettbewerb',
    
    // No credits modal
    'noCredits.title': 'Keine KI-Energie für heute',
    'noCredits.subtitle': 'Sie haben Ihre täglichen Credits verbraucht. Wählen Sie, wie Sie fortfahren:',
    'noCredits.photoDay': 'Foto/Tag',
    'noCredits.textDay': 'Text/Tag',
    'noCredits.watchAd': 'Kurzes Video ansehen',
    'noCredits.watchAdDesc': '+1 kostenloses KI-Credit verdienen ⚡',
    'noCredits.free': 'KOSTENLOS',
    'noCredits.goPro': 'Pro werden · Unbegrenzte KI',
    'noCredits.price': 'Nur 11.800 COP/Monat · Jederzeit kündbar',
    'noCredits.videoLimit': 'Video-Limit erreicht',
    'noCredits.comeBack': 'Kommen Sie morgen für mehr Credits zurück',
    'noCredits.earned': '⚡ +{{count}} Credits verdient',
    'noCredits.earnedSub': 'Danke! Sie können jetzt weiter KI nutzen.',
    
    // Premium colors modal
    'premiumColors.title': 'Premium-Farbe',
    'premiumColors.proExclusive': 'Exklusiv für Pro',
    'premiumColors.proDesc': 'Verbessern Sie Ihr Konto, um Premium-Farben freizuschalten und in der App hervorzustechen.',
    'premiumColors.upgrade': 'Verbessern',
    'premiumColors.description': 'Passen Sie das Aussehen der gesamten App an, indem Sie Ihre Lieblings-Akzentfarbe wählen.',
    
    // Default reminder titles and bodies
    'reminders.default.breakfast': 'Frühstück',
    'reminders.default.breakfastBody': 'Zeit für ein gesundes Frühstück!',
    'reminders.default.lunch': 'Mittagessen',
    'reminders.default.lunchBody': 'Vergessen Sie nicht Ihr nährstoffreiches Mittagessen!',
    'reminders.default.dinner': 'Abendessen',
    'reminders.default.dinnerBody': 'Zeit für das Abendessen. Guten Appetit!',
    'reminders.default.snack': 'Snack',
    'reminders.default.snackBody': 'Zeit für einen gesunden Snack!',
    'reminders.default.water': 'Wasser',
    'reminders.default.waterBody': 'Bleiben Sie hydriert! Trinken Sie ein Glas Wasser.',
    'reminders.default.waterAfternoon': 'Nachmittagswasser',
    'reminders.default.waterAfternoonBody': 'Vergessen Sie nicht, sich am Nachmittag zu hydrieren!',
    'reminders.default.workout': 'Training',
    'reminders.default.workoutBody': 'Zeit, Ihr Bewegungsziel zu erreichen!',
    'reminders.default.walk': 'Spaziergang',
    'reminders.default.walkBody': 'Überprüfen Sie Ihre Schritte! Zeit für einen Spaziergang.',
    'reminders.default.cardio': 'Cardio',
    'reminders.default.cardioBody': 'Aktivieren Sie Ihr tägliches Cardio!',
    'reminders.default.vitamine': 'Vitamine',
    'reminders.default.vitamineBody': 'Denken Sie daran, Ihre Vitamine und Nahrungsergänzungsmittel einzunehmen!',
    'reminders.default.sleep': 'Schlaf',
    'reminders.default.sleepBody': 'Ruhen Sie sich gut aus, um sich zu erholen!',
    'reminders.default.log': 'Protokoll',
    'reminders.default.logBody': 'Tragen Sie Ihre heutigen Mahlzeiten in FitGo ein!',
    'reminders.default.league': 'Liga',
    'reminders.default.leagueBody': 'Der Liga-Kampf hört nie auf! Überprüfen Sie Ihre Position.',
    'reminders.default.dailyChallenge': 'Tagesherausforderung',
    'reminders.default.dailyChallengeBody': 'Schließen Sie die Tagesherausforderung ab, bevor sie abläuft!',
    'reminders.default.friends': 'Freunde',
    'reminders.default.friendsBody': 'Schauen Sie, was Ihre Freunde heute erreichen!',
    'reminders.default.streak': 'Serie',
    'reminders.default.streakBody': 'Brechen Sie Ihre Serie nicht! Protokollieren Sie Ihren Fortschritt.',
    'reminders.default.achievements': 'Errungenschaften',
    'reminders.default.achievementsBody': 'Sie haben freigeschaltete Errungenschaften, die auf Sie warten!',
    'reminders.default.leaderboard': 'Rangliste',
    'reminders.default.leaderboardBody': 'Die wöchentliche Rangliste endet bald. Steigen Sie in den Rängen auf!',
    'reminders.default.messages': 'Nachrichten',
    'reminders.default.messagesBody': '💬 Sie haben neue Nachrichten auf FitGO Social!',
  },
  
  it: {
    // About section
    'about.website': 'Sito Web',
    'about.credits': 'Crediti',
    
    // Profile - colors
    'profile.colors.default': 'Viola Classico',
    'profile.colors.gold': "Oro d'Élite",
    'profile.colors.blue': 'Blu Elettrico',
    'profile.colors.green': 'Verde Neon',
    'profile.colors.red': 'Rosso Rubino',
    'profile.colors.orange': 'Arancione Fuoco',
    'profile.colors.magenta': 'Magenta Scuro',
    'profile.colors.pink': 'Rosa Tramonto',
    'profile.colors.emerald': 'Verde Smeraldo',
    'profile.colors.turquoise': 'Turchese Profondo',
    'profile.colors.purple': 'Viola Imperiale',
    'profile.colors.silver': 'Argento Cromato',
    'profile.colors.defaultSubtitle': 'Il colore predefinito',
    'profile.inviteFriends': 'Invita Amici',
    
    // Credits dialog
    'about.creditsTitle': 'Crediti',
    'about.creditsMessage': "Le animazioni (GIF) nella cartella degli esercizi sono di proprietà e per cortesia di ExerciseDB API.",
    'about.creditsOk': 'Capito',
    
    // Reminders categories
    'reminders.category.all': 'Tutti',
    'reminders.category.meal': 'Pasti',
    'reminders.category.water': 'Idratazione',
    'reminders.category.workout': 'Allenamento',
    'reminders.category.general': 'Generale',
    'reminders.category.social': 'Sociale & Competitivo',
    
    // No credits modal
    'noCredits.title': "Nessuna energia IA per oggi",
    'noCredits.subtitle': "Hai usato i tuoi crediti giornalieri. Scegli come continuare:",
    'noCredits.photoDay': 'foto/giorno',
    'noCredits.textDay': 'testo/giorno',
    'noCredits.watchAd': 'Guarda un breve video',
    'noCredits.watchAdDesc': 'Guadagna +1 credito IA ⚡ gratuito',
    'noCredits.free': 'GRATIS',
    'noCredits.goPro': 'Diventa Pro · IA Illimitata',
    'noCredits.price': 'Solo 11.800 COP/mese · Annulla quando vuoi',
    'noCredits.videoLimit': 'Limite video raggiunto',
    'noCredits.comeBack': 'Torna domani per più crediti',
    'noCredits.earned': '⚡ +{{count}} crediti guadagnati',
    'noCredits.earnedSub': 'Grazie! Ora puoi continuare a usare IA.',
    
    // Premium colors modal
    'premiumColors.title': 'Colore Premium',
    'premiumColors.proExclusive': 'Esclusivo per Pro',
    'premiumColors.proDesc': "Aggiorna il tuo account per sbloccare i colori premium e distinguerti nell'app.",
    'premiumColors.upgrade': 'Aggiorna',
    'premiumColors.description': "Personalizza l'aspetto dell'intera app scegliendo il tuo colore accento preferito.",
    
    // Default reminder titles and bodies
    'reminders.default.breakfast': 'Colazione',
    'reminders.default.breakfastBody': "È l'ora di una colazione sana!",
    'reminders.default.lunch': 'Pranzo',
    'reminders.default.lunchBody': "Non dimenticare il tuo pranzo nutriente!",
    'reminders.default.dinner': 'Cena',
    'reminders.default.dinnerBody': "È l'ora della cena. Buon appetito!",
    'reminders.default.snack': 'Spuntino',
    'reminders.default.snackBody': "È l'ora di uno spuntino sano!",
    'reminders.default.water': 'Acqua',
    'reminders.default.waterBody': 'Resta idratato! Bevi un bicchiere d\'acqua.',
    'reminders.default.waterAfternoon': 'Acqua pomeriggio',
    'reminders.default.waterAfternoonBody': 'Non dimenticare di idratarti nel pomeriggio!',
    'reminders.default.workout': 'Allenamento',
    'reminders.default.workoutBody': "È l'ora di raggiungere il tuo obiettivo di movimento!",
    'reminders.default.walk': 'Passeggiata',
    'reminders.default.walkBody': 'Controlla i tuoi passi! È ora di fare una passeggiata.',
    'reminders.default.cardio': 'Cardio',
    'reminders.default.cardioBody': 'Attiva il tuo cardio giornaliero!',
    'reminders.default.vitamins': 'Vitamine',
    'reminders.default.vitaminsBody': 'Ricorda di prendere le tue vitamine e integratori!',
    'reminders.default.sleep': 'Sonno',
    'reminders.default.sleepBody': 'Riposa bene per recuperare!',
    'reminders.default.log': 'Registro',
    'reminders.default.logBody': "Registra i pasti di oggi su FitGo!",
    'reminders.default.league': 'Lega',
    'reminders.default.leagueBody': 'La battaglia della lega non si ferma! Controlla la tua posizione.',
    'reminders.default.dailyChallenge': 'Sfida giornaliera',
    'reminders.default.dailyChallengeBody': 'Completa la sfida giornaliera prima che scada!',
    'reminders.default.friends': 'Amici',
    'reminders.default.friendsBody': 'Vedi cosa stanno ottenendo i tuoi amici oggi!',
    'reminders.default.streak': 'Serie',
    'reminders.default.streakBody': 'Non rompere la tua serie! Registra i tuoi progressi.',
    'reminders.default.achievements': 'Traguardi',
    'reminders.default.achievementsBody': 'Hai traguardi sbloccati che ti aspettano!',
    'reminders.default.leaderboard': 'Classifica',
    'reminders.default.leaderboardBody': 'La classifica settimanale finisce presto. Salta di posizione!',
    'reminders.default.messages': 'Messaggi',
    'reminders.default.messagesBody': '💬 Hai nuovi messaggi su FitGO Social!',
  },
  
  pt: {
    // About section
    'about.website': 'Site',
    'about.credits': 'Créditos',
    
    // Profile - colors
    'profile.colors.default': 'Roxo Clássico',
    'profile.colors.gold': 'Ouro Elite',
    'profile.colors.blue': 'Azul Elétrico',
    'profile.colors.green': 'Verde Neon',
    'profile.colors.red': 'Vermelho Rubi',
    'profile.colors.orange': 'Laranja Fogo',
    'profile.colors.magenta': 'Magenta Escuro',
    'profile.colors.pink': 'Rosa Pôr do Sol',
    'profile.colors.emerald': 'Verde Esmeralda',
    'profile.colors.turquoise': 'Turquesa Profundo',
    'profile.colors.purple': 'Roxo Imperial',
    'profile.colors.silver': 'Prata Cromado',
    'profile.colors.defaultSubtitle': 'A cor padrão',
    'profile.inviteFriends': 'Convidar Amigos',
    
    // Credits dialog
    'about.creditsTitle': 'Créditos',
    'about.creditsMessage': 'As animações (GIFs) do diretório de exercícios são propriedade e cortesia da ExerciseDB API.',
    'about.creditsOk': 'Entendi',
    
    // Reminders categories
    'reminders.category.all': 'Todos',
    'reminders.category.meal': 'Refeições',
    'reminders.category.water': 'Hidratação',
    'reminders.category.workout': 'Treino',
    'reminders.category.general': 'Geral',
    'reminders.category.social': 'Social & Competitivo',
    
    // No credits modal
    'noCredits.title': 'Sem energia IA por hoje',
    'noCredits.subtitle': 'Você usou seus créditos diários. Escolha como continuar:',
    'noCredits.photoDay': 'foto/dia',
    'noCredits.textDay': 'texto/dia',
    'noCredits.watchAd': 'Assistir vídeo curto',
    'noCredits.watchAdDesc': 'Ganhe +1 crédito IA ⚡ grátis',
    'noCredits.free': 'GRÁTIS',
    'noCredits.goPro': 'Fazer Pro · IA Ilimitada',
    'noCredits.price': 'Apenas $11.800 COP/mês · Cancele quando quiser',
    'noCredits.videoLimit': 'Limite de vídeos atingido',
    'noCredits.comeBack': 'Volte amanhã para mais créditos',
    'noCredits.earned': '⚡ +{{count}} créditos ganhos',
    'noCredits.earnedSub': 'Obrigado! Agora você pode continuar usando IA.',
    
    // Premium colors modal
    'premiumColors.title': 'Cor Premium',
    'premiumColors.proExclusive': 'Exclusivo para Pro',
    'premiumColors.proDesc': 'Faça upgrade para desbloquear cores premium e se destacar no app.',
    'premiumColors.upgrade': 'Melhorar',
    'premiumColors.description': 'Personalize a aparência de todo o app escolhendo sua cor de destaque favorita.',
    
    // Default reminder titles and bodies
    'reminders.default.breakfast': 'Café da manhã',
    'reminders.default.breakfastBody': 'Hora de um café da manhã saudável!',
    'reminders.default.lunch': 'Almoço',
    'reminders.default.lunchBody': 'Não esqueça do seu almoço nutritivo!',
    'reminders.default.dinner': 'Jantar',
    'reminders.default.dinnerBody': 'Hora do jantar. Bom apetite!',
    'reminders.default.snack': 'Lanche',
    'reminders.default.snackBody': 'Hora de um lanche saudável!',
    'reminders.default.water': 'Água',
    'reminders.default.waterBody': 'Mantenha-se hidratado! Beba um copo de água.',
    'reminders.default.waterAfternoon': 'Água tarde',
    'reminders.default.waterAfternoonBody': 'Não esqueça de se hidratar à tarde!',
    'reminders.default.workout': 'Treino',
    'reminders.default.workoutBody': 'Hora de alcançar sua meta de movimento!',
    'reminders.default.walk': 'Caminhada',
    'reminders.default.walkBody': 'Confira seus passos! Hora de uma caminhada.',
    'reminders.default.cardio': 'Cardio',
    'reminders.default.cardioBody': 'Ative seu cardio do dia!',
    'reminders.default.vitamins': 'Vitaminas',
    'reminders.default.vitaminsBody': 'Lembre-se de tomar suas vitaminas e suplementos!',
    'reminders.default.sleep': 'Dormir',
    'reminders.default.sleepBody': 'Descanse bem para se recuperar!',
    'reminders.default.log': 'Registro',
    'reminders.default.logBody': 'Registre suas refeições de hoje no FitGo!',
    'reminders.default.league': 'Liga',
    'reminders.default.leagueBody': 'A batalha da liga não para! Confira sua posição.',
    'reminders.default.dailyChallenge': 'Desafio diário',
    'reminders.default.dailyChallengeBody': 'Complete o desafio diário antes que ele expire!',
    'reminders.default.friends': 'Amigos',
    'reminders.default.friendsBody': 'Veja o que seus amigos estão conquistando hoje!',
    'reminders.default.streak': 'Sequência',
    'reminders.default.streakBody': 'Não quebre sua sequência! Registre seu progresso.',
    'reminders.default.achievements': 'Conquistas',
    'reminders.default.achievementsBody': 'Você tem conquistas desbloqueadas esperando por você!',
    'reminders.default.leaderboard': 'Placar',
    'reminders.default.leaderboardBody': 'O ranking semanal termina em breve. Suba de posição!',
    'reminders.default.messages': 'Mensagens',
    'reminders.default.messagesBody': '💬 Você tem novas mensagens no FitGO Social!',
  },
  
  ru: {
    // About section
    'about.website': 'Веб-сайт',
    'about.credits': 'Кредиты',
    
    // Profile - colors
    'profile.colors.default': 'Классический фиолетовый',
    'profile.colors.gold': 'Элитное золото',
    'profile.colors.blue': 'Электрический синий',
    'profile.colors.green': 'Неоновый зелёный',
    'profile.colors.red': 'Рубиновый красный',
    'profile.colors.orange': 'Огненный оранжевый',
    'profile.colors.magenta': 'Тёмный пурпурный',
    'profile.colors.pink': 'Розовый закат',
    'profile.colors.emerald': 'Изумрудный зелёный',
    'profile.colors.turquoise': 'Глубокий бирюзовый',
    'profile.colors.purple': 'Императорский фиолетовый',
    'profile.colors.silver': 'Хромированное серебро',
    'profile.colors.defaultSubtitle': 'Цвет по умолчанию',
    'profile.inviteFriends': 'Пригласить Друзей',
    
    // Credits dialog
    'about.creditsTitle': 'Кредиты',
    'about.creditsMessage': 'Анимации (GIF) в каталоге упражнений являются собственностью и любезно предоставлены ExerciseDB API.',
    'about.creditsOk': 'Понятно',
    
    // Reminders categories
    'reminders.category.all': 'Все',
    'reminders.category.meal': 'Приёмы пищи',
    'reminders.category.water': 'Гидратация',
    'reminders.category.workout': 'Тренировка',
    'reminders.category.general': 'Общее',
    'reminders.category.social': 'Социальное & Соревнование',
    
    // No credits modal
    'noCredits.title': 'Нет ИИ-энергии на сегодня',
    'noCredits.subtitle': 'Вы использовали свои дневные кредиты. Выберите, как продолжить:',
    'noCredits.photoDay': 'фото/день',
    'noCredits.textDay': 'текст/день',
    'noCredits.watchAd': 'Посмотреть короткое видео',
    'noCredits.watchAdDesc': 'Получите +1 бесплатный ИИ-кредит ⚡',
    'noCredits.free': 'БЕСПЛАТНО',
    'noCredits.goPro': 'Стать Pro · Безлимитный ИИ',
    'noCredits.price': 'Всего 11 800 COP/мес · Отмена в любое время',
    'noCredits.videoLimit': 'Достигнут лимит видео',
    'noCredits.comeBack': 'Возвращайтесь завтра за кредитами',
    'noCredits.earned': '⚡ +{{count}} кредитов заработано',
    'noCredits.earnedSub': 'Спасибо! Теперь вы можете продолжать использовать ИИ.',
    
    // Premium colors modal
    'premiumColors.title': 'Премиум-цвет',
    'premiumColors.proExclusive': 'Эксклюзивно для Pro',
    'premiumColors.proDesc': 'Обновите свою учётную запись, чтобы разблокировать премиум-цвета и выделиться в приложении.',
    'premiumColors.upgrade': 'Обновить',
    'premiumColors.description': 'Настройте внешний вид всего приложения, выбрав свой любимый цвет акцента.',
    
    // Default reminder titles and bodies
    'reminders.default.breakfast': 'Завтрак',
    'reminders.default.breakfastBody': 'Время для здорового завтрака!',
    'reminders.default.lunch': 'Обед',
    'reminders.default.lunchBody': 'Не забудьте о питательном обеде!',
    'reminders.default.dinner': 'Ужин',
    'reminders.default.dinnerBody': 'Время ужина. Приятного аппетита!',
    'reminders.default.snack': 'Перекус',
    'reminders.default.snackBody': 'Время для здорового перекуса!',
    'reminders.default.water': 'Вода',
    'reminders.default.waterBody': 'Поддерживайте водный баланс! Выпейте стакан воды.',
    'reminders.default.waterAfternoon': 'Вода днём',
    'reminders.default.waterAfternoonBody': 'Не забудьте пить воду днём!',
    'reminders.default.workout': 'Тренировка',
    'reminders.default.workoutBody': 'Время достичь цели по активности!',
    'reminders.default.walk': 'Прогулка',
    'reminders.default.walkBody': 'Проверьте свои шаги! Время для прогулки.',
    'reminders.default.cardio': 'Кардио',
    'reminders.default.cardioBody': 'Активируйте ежедневное кардио!',
    'reminders.default.vitamins': 'Витамины',
    'reminders.default.vitaminsBody': 'Не забудьте принять витамины и добавки!',
    'reminders.default.sleep': 'Сон',
    'reminders.default.sleepBody': 'Хорошо отдохните для восстановления!',
    'reminders.default.log': 'Журнал',
    'reminders.default.logBody': 'Запишите сегодняшние приёмы пищи в FitGo!',
    'reminders.default.league': 'Лига',
    'reminders.default.leagueBody': 'Битва лиги не останавливается! Проверьте свою позицию.',
    'reminders.default.dailyChallenge': 'Ежедневное испытание',
    'reminders.default.dailyChallengeBody': 'Выполните ежедневное испытание до истечения срока!',
    'reminders.default.friends': 'Друзья',
    'reminders.default.friendsBody': 'Смотрите, чего достигают ваши друзья сегодня!',
    'reminders.default.streak': 'Серия',
    'reminders.default.streakBody': 'Не прерывайте серию! Записывайте свой прогресс.',
    'reminders.default.achievements': 'Достижения',
    'reminders.default.achievementsBody': 'У вас есть разблокированные достижения, которые ждут вас!',
    'reminders.default.leaderboard': 'Таблица лидеров',
    'reminders.default.leaderboardBody': 'Еженедельный рейтинг скоро закончится. Поднимайтесь в таблице!',
    'reminders.default.messages': 'Сообщения',
    'reminders.default.messagesBody': '💬 У вас новые сообщения в FitGO Social!',
  },
};

// Apply translations to each language file
for (const [lang, keys] of Object.entries(translations)) {
  const filePath = path.join(TRANSLATIONS_DIR, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    continue;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  // Strip BOM if present
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
  const data = JSON.parse(content);
  
  let added = 0;
  for (const [keyPath, value] of Object.entries(keys)) {
    const parts = keyPath.split('.');
    let current = data;
    
    // Navigate to the right nested object
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }
    
    const lastKey = parts[parts.length - 1];
    if (!current[lastKey]) {
      current[lastKey] = value;
      added++;
    }
  }
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`${lang}.json: added ${added} keys`);
}

console.log('\nDone! All translations updated.');
