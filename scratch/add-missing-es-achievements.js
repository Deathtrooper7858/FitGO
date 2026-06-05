const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '../i18n/translations/es.json');
const json = JSON.parse(fs.readFileSync(file, 'utf-8'));

if (!json.achievements) json.achievements = {};
if (!json.achievements.items) json.achievements.items = {};

const missingEsItems = {
  ai_enthusiast: { title: 'Entusiasta de IA', description: 'Usaste el Coach IA 10 veces.' },
  anniversary: { title: 'Aniversario', description: '1 año usando FitGO. ¡Felicidades!' },
  app_first_launch: { title: 'Primer Inicio', description: 'Abriste FitGO por primera vez.' },
  biometric_update: { title: 'Escáner Corporal', description: 'Actualizaste tu peso 5 veces.' },
  bug_slayer: { title: 'Cazador de Bugs', description: 'Arreglaste 100 errores en FitGO.' },
  calorie_deficit_7: { title: 'Maestro del Déficit', description: 'Mantuviste un déficit calórico por 7 días.' },
  calorie_surplus_7: { title: 'Maestro del Superávit', description: 'Mantuviste un superávit calórico por 7 días.' },
  challenge_5: { title: 'Retador', description: 'Participaste en 5 retos.' },
  challenge_starter: { title: 'Iniciador de Retos', description: 'Creaste tu primer reto.' },
  challenge_winner: { title: 'Campeón', description: 'Ganaste un reto.' },
  comeback_kid: { title: 'El Regreso', description: 'Volviste después de una racha de más de 7 días.' },
  community_leader: { title: 'Líder de Comunidad', description: 'Alcanzaste el Top 10 global.' },
  competitive_spirit: { title: 'Espíritu Competitivo', description: 'Llegaste al Top 10 Global del ranking.' },
  consistent_challenger: { title: 'Retador de Hierro', description: 'Completaste un reto de 7 días.' },
  data_guardian: { title: 'Guardián de Datos', description: 'Protegiste los datos de todos los usuarios de FitGO.' },
  data_scientist: { title: 'Científico de Datos', description: 'Realizaste un análisis semanal 3 veces.' },
  first_ai_chat: { title: 'Primer Chat IA', description: 'Tuviste tu primera conversación con Fitz AI.' },
  first_plan: { title: 'Primer Plan', description: 'Generaste tu primer plan de comidas.' },
  first_workout: { title: 'Primer Entrenamiento', description: 'Generaste tu primer plan de entrenamiento.' },
  friend_maker: { title: 'Conector', description: 'Agregaste a tu primer amigo en FitGO.' },
  innovation_lab: { title: 'Pionero de Innovación', description: 'Lanzaste la primera función exclusiva de FitGO.' },
  language_changed: { title: 'Políglota', description: 'Cambiaste el idioma de la aplicación.' },
  motivator: { title: 'Motivador', description: 'Diste 10 likes a las publicaciones de tus amigos.' },
  mystery_item: { title: '???', description: 'Completa retos misteriosos para desbloquear esto.' },
  notifications_enabled: { title: 'Siempre Conectado', description: 'Activaste las notificaciones de FitGO.' },
  perfect_month: { title: 'Mes Perfecto', description: 'Registraste comidas todos los días del mes.' },
  planner_pro: { title: 'Planner Pro', description: 'Generaste un plan nutricional.' },
  share_progress: { title: 'Muestra de Progreso', description: 'Compartiste tu progreso con la comunidad.' },
  squad_top: { title: 'MVP del Squad', description: 'Fuiste el máximo goleador de tu Squad.' },
  super_admin: { title: 'Super Admin', description: 'Eres un superadministrador de FitGO.' },
  system_builder: { title: 'Arquitecto de Sistemas', description: 'Construiste todo el sistema FitGO.' },
  team_player: { title: 'Jugador de Equipo', description: 'Te uniste a un Squad.' },
  theme_changer: { title: 'Ícono de Estilo', description: 'Cambiaste el tema de la aplicación.' },
  weight_stability: { title: 'Estabilidad de Peso', description: 'Mantuviste tu peso durante 30 días.' }
};

for (const [id, data] of Object.entries(missingEsItems)) {
  if (!json.achievements.items[id]) json.achievements.items[id] = {};
  json.achievements.items[id].title = data.title;
  json.achievements.items[id].description = data.description;
}

fs.writeFileSync(file, JSON.stringify(json, null, 2), 'utf-8');
console.log('✅ Added missing achievement items to es.json');
