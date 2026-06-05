const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../i18n/translations');

const translations = {
  en: {
    aiDisclaimerTitle: 'AI-Generated Plan',
    aiDisclaimerText: 'This plan is for guidance only and does not replace the advice of a dietitian or medical professional. Consult a specialist before making significant changes to your diet or training.',
    workoutWarningTitle: 'Workout Warning',
    workoutWarningText: 'Perform exercises at your own risk. If you feel pain, stop immediately. Make sure to warm up before starting and verify proper technique.',
  },
  es: {
    aiDisclaimerTitle: 'Plan generado por IA',
    aiDisclaimerText: 'Este plan es orientativo y no reemplaza el asesoramiento de un dietista o médico profesional. Consulta a un especialista antes de realizar cambios significativos en tu alimentación o entrenamiento.',
    workoutWarningTitle: 'Advertencia de Entrenamiento',
    workoutWarningText: 'Realiza los ejercicios bajo tu propia responsabilidad. Si sientes dolor, detente inmediatamente. Asegúrate de calentar antes de iniciar y verificar la técnica.',
  },
  fr: {
    aiDisclaimerTitle: 'Plan généré par IA',
    aiDisclaimerText: "Ce plan est indicatif et ne remplace pas les conseils d'un diététicien ou médecin professionnel. Consultez un spécialiste avant d'apporter des changements significatifs à votre alimentation ou entraînement.",
    workoutWarningTitle: "Avertissement d'entraînement",
    workoutWarningText: "Effectuez les exercices sous votre propre responsabilité. Si vous ressentez de la douleur, arrêtez immédiatement. Assurez-vous de vous échauffer avant de commencer.",
  },
  de: {
    aiDisclaimerTitle: 'KI-generierter Plan',
    aiDisclaimerText: 'Dieser Plan ist nur zur Orientierung und ersetzt nicht die Beratung durch einen Ernährungsberater oder Arzt. Konsultieren Sie einen Spezialisten, bevor Sie wesentliche Änderungen an Ihrer Ernährung oder Ihrem Training vornehmen.',
    workoutWarningTitle: 'Trainingswarnung',
    workoutWarningText: 'Führen Sie Übungen auf eigene Verantwortung durch. Wenn Sie Schmerzen spüren, hören Sie sofort auf. Wärmen Sie sich vor dem Training auf.',
  },
  it: {
    aiDisclaimerTitle: 'Piano generato da IA',
    aiDisclaimerText: "Questo piano è indicativo e non sostituisce il consiglio di un dietista o medico professionista. Consulta uno specialista prima di apportare cambiamenti significativi alla tua alimentazione o allenamento.",
    workoutWarningTitle: 'Avvertenza allenamento',
    workoutWarningText: 'Esegui gli esercizi a tuo rischio e pericolo. Se senti dolore, fermati immediatamente. Assicurati di riscaldarti prima di iniziare.',
  },
  pt: {
    aiDisclaimerTitle: 'Plano gerado por IA',
    aiDisclaimerText: 'Este plano é orientativo e não substitui o conselho de um nutricionista ou médico profissional. Consulte um especialista antes de fazer mudanças significativas na sua alimentação ou treino.',
    workoutWarningTitle: 'Aviso de Treino',
    workoutWarningText: 'Realize os exercícios sob sua própria responsabilidade. Se sentir dor, pare imediatamente. Certifique-se de aquecer antes de começar.',
  },
  ru: {
    aiDisclaimerTitle: 'План создан ИИ',
    aiDisclaimerText: 'Этот план носит ознакомительный характер и не заменяет консультацию диетолога или врача. Проконсультируйтесь со специалистом перед внесением значительных изменений в питание или тренировки.',
    workoutWarningTitle: 'Предупреждение о тренировке',
    workoutWarningText: 'Выполняйте упражнения на свой страх и риск. Если чувствуете боль, немедленно остановитесь. Убедитесь, что разогрелись перед началом.',
  },
};

// League translations
const leagues = {
  en: {
    carbono: { name: 'Carbon League', desc: 'Your starting point in FitGO. Earn points to climb!' },
    neon: { name: 'Neon League', desc: 'Intermediate league. Keep pushing!' },
    titanio: { name: 'Titanium League', desc: 'Advanced league. You are becoming elite!' },
    cuarzo: { name: 'Quartz League', desc: 'Top-tier competitive league.' },
    zenit: { name: 'Elite Zenit League', desc: 'The pinnacle of FitGO competition.' },
    points: 'Points',
    current: '← Current',
    pathToElite: 'Path to Elite',
    inviteFriends: 'Invite Friends',
    inviteFriendsTitle: 'Invite Friends to the Squad',
    leaveSquad: 'Leave Squad',
    leaveSquadTitle: 'Leave Squad',
    leaveSquadMsg: 'Are you sure you want to leave the squad?',
    days: 'days',
    streakDays: 'Streak Days',
  },
  es: {
    carbono: { name: 'Liga Carbono', desc: 'Tu punto de partida en FitGO. ¡Gana puntos para subir!' },
    neon: { name: 'Liga Neón', desc: 'Liga intermedia. ¡Sigue empujando!' },
    titanio: { name: 'Liga Titanio', desc: '¡Liga avanzada. Te estás volviendo élite!' },
    cuarzo: { name: 'Liga Cuarzo', desc: 'Liga competitiva de alto nivel.' },
    zenit: { name: 'Liga Élite Zenit', desc: 'La cúspide de la competición en FitGO.' },
    points: 'Puntos',
    current: '← Actual',
    pathToElite: 'Camino a la Élite',
    inviteFriends: 'Invitar Amigos',
    inviteFriendsTitle: 'Invitar Amigos al Squad',
    leaveSquad: 'Salir del Squad',
    leaveSquadTitle: 'Salir del Squad',
    leaveSquadMsg: '¿Estás seguro de que deseas salir del squad?',
    days: 'días',
    streakDays: 'Días racha',
  },
  fr: {
    carbono: { name: 'Ligue Carbone', desc: 'Votre point de départ dans FitGO. Gagnez des points pour grimper !' },
    neon: { name: 'Ligue Néon', desc: 'Ligue intermédiaire. Continuez !' },
    titanio: { name: 'Ligue Titane', desc: 'Ligue avancée. Vous devenez élite !' },
    cuarzo: { name: 'Ligue Quartz', desc: 'Ligue compétitive de haut niveau.' },
    zenit: { name: 'Ligue Élite Zénith', desc: 'Le sommet de la compétition FitGO.' },
    points: 'Points',
    current: '← Actuel',
    pathToElite: 'Chemin vers l\'Élite',
    inviteFriends: 'Inviter des Amis',
    inviteFriendsTitle: 'Inviter des Amis dans le Squad',
    leaveSquad: 'Quitter le Squad',
    leaveSquadTitle: 'Quitter le Squad',
    leaveSquadMsg: 'Êtes-vous sûr de vouloir quitter le squad ?',
    days: 'jours',
    streakDays: 'Jours de série',
  },
  de: {
    carbono: { name: 'Kohlenstoff-Liga', desc: 'Dein Startpunkt in FitGO. Sammle Punkte zum Aufsteigen!' },
    neon: { name: 'Neon-Liga', desc: 'Mittlere Liga. Weiter so!' },
    titanio: { name: 'Titan-Liga', desc: 'Fortgeschrittene Liga. Du wirst Elite!' },
    cuarzo: { name: 'Quarz-Liga', desc: 'Liga der Spitzenklasse.' },
    zenit: { name: 'Elite-Zenit-Liga', desc: 'Der Gipfel des FitGO-Wettbewerbs.' },
    points: 'Punkte',
    current: '← Aktuell',
    pathToElite: 'Weg zur Elite',
    inviteFriends: 'Freunde einladen',
    inviteFriendsTitle: 'Freunde ins Squad einladen',
    leaveSquad: 'Squad verlassen',
    leaveSquadTitle: 'Squad verlassen',
    leaveSquadMsg: 'Bist du sicher, dass du das Squad verlassen möchtest?',
    days: 'Tage',
    streakDays: 'Streak-Tage',
  },
  it: {
    carbono: { name: 'Lega Carbonio', desc: 'Il tuo punto di partenza in FitGO. Guadagna punti per salire!' },
    neon: { name: 'Lega Neon', desc: 'Lega intermedia. Continua così!' },
    titanio: { name: 'Lega Titanio', desc: 'Lega avanzata. Stai diventando élite!' },
    cuarzo: { name: 'Lega Quarzo', desc: 'Lega competitiva di alto livello.' },
    zenit: { name: 'Lega Elite Zenit', desc: 'Il vertice della competizione FitGO.' },
    points: 'Punti',
    current: '← Attuale',
    pathToElite: 'Percorso verso l\'Elite',
    inviteFriends: 'Invita Amici',
    inviteFriendsTitle: 'Invita Amici nello Squad',
    leaveSquad: 'Lascia lo Squad',
    leaveSquadTitle: 'Lascia lo Squad',
    leaveSquadMsg: 'Sei sicuro di voler lasciare lo squad?',
    days: 'giorni',
    streakDays: 'Giorni di serie',
  },
  pt: {
    carbono: { name: 'Liga Carbono', desc: 'Seu ponto de partida no FitGO. Ganhe pontos para subir!' },
    neon: { name: 'Liga Neon', desc: 'Liga intermediária. Continue assim!' },
    titanio: { name: 'Liga Titânio', desc: 'Liga avançada. Você está se tornando elite!' },
    cuarzo: { name: 'Liga Quartzo', desc: 'Liga competitiva de alto nível.' },
    zenit: { name: 'Liga Elite Zênite', desc: 'O ápice da competição FitGO.' },
    points: 'Pontos',
    current: '← Atual',
    pathToElite: 'Caminho para a Elite',
    inviteFriends: 'Convidar Amigos',
    inviteFriendsTitle: 'Convidar Amigos para o Squad',
    leaveSquad: 'Sair do Squad',
    leaveSquadTitle: 'Sair do Squad',
    leaveSquadMsg: 'Tem certeza de que deseja sair do squad?',
    days: 'dias',
    streakDays: 'Dias de sequência',
  },
  ru: {
    carbono: { name: 'Лига Углерод', desc: 'Ваша стартовая точка в FitGO. Зарабатывайте очки!' },
    neon: { name: 'Неоновая лига', desc: 'Средняя лига. Продолжайте!' },
    titanio: { name: 'Титановая лига', desc: 'Продвинутая лига. Вы становитесь элитой!' },
    cuarzo: { name: 'Кварцевая лига', desc: 'Соревновательная лига высшего уровня.' },
    zenit: { name: 'Элитная лига Зенит', desc: 'Вершина соревнований FitGO.' },
    points: 'Очки',
    current: '← Текущий',
    pathToElite: 'Путь к Элите',
    inviteFriends: 'Пригласить друзей',
    inviteFriendsTitle: 'Пригласить друзей в Squad',
    leaveSquad: 'Покинуть Squad',
    leaveSquadTitle: 'Покинуть Squad',
    leaveSquadMsg: 'Вы уверены, что хотите покинуть отряд?',
    days: 'дней',
    streakDays: 'Дней подряд',
  },
};

const langs = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru'];

for (const lang of langs) {
  const file = path.join(dir, `${lang}.json`);
  const json = JSON.parse(fs.readFileSync(file, 'utf-8'));

  // Add planner disclaimer translations
  if (!json.planner) json.planner = {};
  Object.assign(json.planner, translations[lang]);

  // Add/update competitive.squads keys
  if (!json.competitive) json.competitive = {};
  if (!json.competitive.squads) json.competitive.squads = {};
  if (!json.competitive.leagues) json.competitive.leagues = {};

  const lg = leagues[lang];
  Object.assign(json.competitive.squads, {
    days: lg.days,
    streakDays: lg.streakDays,
    pathToElite: lg.pathToElite,
    inviteFriends: lg.inviteFriends,
    inviteFriendsTitle: lg.inviteFriendsTitle,
    leaveSquad: lg.leaveSquad,
    leaveSquadTitle: lg.leaveSquadTitle,
    leaveSquadMsg: lg.leaveSquadMsg,
    current: lg.current,
    points: lg.points,
  });

  // League names
  json.competitive.leagues.carbono = json.competitive.leagues.carbono || {};
  json.competitive.leagues.carbono.name = lg.carbono.name;
  json.competitive.leagues.carbono.desc = lg.carbono.desc;

  json.competitive.leagues.neon = json.competitive.leagues.neon || {};
  json.competitive.leagues.neon.name = lg.neon.name;
  json.competitive.leagues.neon.desc = lg.neon.desc;

  json.competitive.leagues.titanio = json.competitive.leagues.titanio || {};
  json.competitive.leagues.titanio.name = lg.titanio.name;
  json.competitive.leagues.titanio.desc = lg.titanio.desc;

  json.competitive.leagues.cuarzo = json.competitive.leagues.cuarzo || {};
  json.competitive.leagues.cuarzo.name = lg.cuarzo.name;
  json.competitive.leagues.cuarzo.desc = lg.cuarzo.desc;

  json.competitive.leagues.zenit = json.competitive.leagues.zenit || {};
  json.competitive.leagues.zenit.name = lg.zenit.name;
  json.competitive.leagues.zenit.desc = lg.zenit.desc;

  fs.writeFileSync(file, JSON.stringify(json, null, 2));
  console.log(`Updated ${lang}.json`);
}
