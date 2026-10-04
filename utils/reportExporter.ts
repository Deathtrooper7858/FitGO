import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import * as XLSX from 'xlsx';
import { UserProfile, FoodLog } from '../store/types';
import { convertMass, convertVolume, convertLength } from './units';
import { getLocalDateString } from './date';

export interface ReportData {
  profile: UserProfile;
  startDate: string;
  endDate: string;
  logs: FoodLog[];
  dailyWater: Record<string, number>;
  dailySteps: Record<string, number>;
  massUnit?: string;
  energyUnit?: string;
}

export interface ExcelExportOptions {
  profile?: UserProfile | null;
  measurements?: any[];
  foodLogs?: any[];
  dailyWater?: Record<string, number>;
  dailySteps?: Record<string, number>;
  dailySleep?: Record<string, number>;
  dailyNeat?: Record<string, string>;
  dailyExercise?: Record<string, string>;
  activityLogs?: any[];
  workouts?: any[];
  massUnit?: string;
  lengthUnit?: string;
  energyUnit?: string;
  volumeUnit?: string;
  t?: any;
}

/**
 * Generates and shares a PDF progress and nutrition report.
 */
export async function exportReportPDF(data: ReportData): Promise<void> {
  const { profile, startDate, endDate, logs, dailyWater, dailySteps, massUnit = 'kg', energyUnit = 'kcal' } = data;

  // Aggregate stats
  const dateSet = new Set<string>();
  logs.forEach(l => dateSet.add(l.loggedAt.split('T')[0]));
  const totalDays = Math.max(1, dateSet.size);

  const totalCalories = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
  const totalProtein = logs.reduce((sum, l) => sum + (l.protein || 0), 0);
  const totalCarbs = logs.reduce((sum, l) => sum + (l.carbs || 0), 0);
  const totalFat = logs.reduce((sum, l) => sum + (l.fat || 0), 0);

  const avgCalories = Math.round(totalCalories / totalDays);
  const avgProtein = Math.round(totalProtein / totalDays);
  const avgCarbs = Math.round(totalCarbs / totalDays);
  const avgFat = Math.round(totalFat / totalDays);

  const waterValues = Object.values(dailyWater);
  const avgWater = waterValues.length > 0
    ? Math.round(waterValues.reduce((a, b) => a + b, 0) / waterValues.length)
    : 0;

  const stepsValues = Object.values(dailySteps);
  const avgSteps = stepsValues.length > 0
    ? Math.round(stepsValues.reduce((a, b) => a + b, 0) / stepsValues.length)
    : 0;

  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>Reporte de Progreso FitGO</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: #0b0f19; color: #f8fafc; padding: 32px; }
        .header { border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
        .logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #60a5fa; }
        .logo span { color: #a855f7; }
        .date { font-size: 13px; color: #94a3b8; }
        .card { background: #1e293b; border-radius: 14px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; }
        .title { font-size: 16px; font-weight: 700; margin-bottom: 14px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; }
        .stat-box { background: #0f172a; padding: 14px; border-radius: 10px; border: 1px solid #1e293b; }
        .stat-label { font-size: 12px; color: #94a3b8; margin-bottom: 4px; }
        .stat-value { font-size: 20px; font-weight: 800; color: #38bdf8; }
        .macro-row { display: flex; justify-content: space-between; margin-top: 8px; font-size: 13px; color: #e2e8f0; }
        .footer { margin-top: 36px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #1e293b; padding-top: 16px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">Fit<span>GO</span></div>
          <div style="font-size: 14px; color: #94a3b8; margin-top: 4px;">Informe Nutricional y de Progreso</div>
        </div>
        <div class="date">${startDate} - ${endDate}</div>
      </div>

      <div class="card">
        <div class="title">Perfil del Atleta</div>
        <div class="grid">
          <div class="stat-box">
            <div class="stat-label">Usuario</div>
            <div class="stat-value" style="font-size: 18px; color: #f8fafc;">${profile.name || 'Atleta'}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Objetivo</div>
            <div class="stat-value" style="font-size: 18px; color: #a855f7;">${profile.goal ? profile.goal.toUpperCase() : 'SALUD'}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Peso Actual</div>
            <div class="stat-value">${profile.weight || '--'} ${massUnit}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Peso Objetivo</div>
            <div class="stat-value" style="color: #10b981;">${profile.targetWeight || '--'} ${massUnit}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="title">Promedios Diarios Registrados</div>
        <div class="grid">
          <div class="stat-box">
            <div class="stat-label">Calorías Promedio</div>
            <div class="stat-value">${avgCalories} <span style="font-size: 12px; font-weight: 500;">${energyUnit}</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Meta Calórica</div>
            <div class="stat-value" style="color: #e2e8f0;">${profile.targetCalories || 2000} <span style="font-size: 12px; font-weight: 500;">${energyUnit}</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Hidratación Promedio</div>
            <div class="stat-value" style="color: #06b6d4;">${avgWater} <span style="font-size: 12px; font-weight: 500;">ml</span></div>
          </div>
          <div class="stat-box">
            <div class="stat-label">Pasos Promedio</div>
            <div class="stat-value" style="color: #f59e0b;">${avgSteps.toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="title">Distribución de Macronutrientes (Promedio)</div>
        <div class="macro-row">
          <span>🥩 Proteína</span>
          <strong>${avgProtein}g (${Math.round(avgProtein * 4 / Math.max(1, avgCalories) * 100)}%)</strong>
        </div>
        <div class="macro-row">
          <span>🍚 Carbohidratos</span>
          <strong>${avgCarbs}g (${Math.round(avgCarbs * 4 / Math.max(1, avgCalories) * 100)}%)</strong>
        </div>
        <div class="macro-row">
          <span>🥑 Grasas</span>
          <strong>${avgFat}g (${Math.round(avgFat * 9 / Math.max(1, avgCalories) * 100)}%)</strong>
        </div>
      </div>

      <div class="footer">
        Generado con FitGO App • Tu asistente de entrenamiento y nutrición impulsado por IA
      </div>
    </body>
    </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (isSharingAvailable) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Exportar Reporte FitGO'
    });
  }
}

/**
 * Generates and shares a CSV data export of food logs and daily metrics.
 */
export async function exportReportCSV(data: ReportData): Promise<void> {
  const { logs, dailyWater, dailySteps } = data;

  let csvContent = 'Fecha,Comida,Alimento,Gramos,Calorias,Proteina(g),Carbos(g),Grasas(g)\n';

  logs.forEach(log => {
    const date = log.loggedAt.split('T')[0];
    const name = `"${(log.foodItem?.name || '').replace(/"/g, '""')}"`;
    csvContent += `${date},${log.meal},${name},${log.grams},${log.calories},${log.protein},${log.carbs},${log.fat}\n`;
  });

  csvContent += '\n\nFecha,Agua(ml),Pasos\n';
  const allDates = Array.from(new Set([...Object.keys(dailyWater), ...Object.keys(dailySteps)])).sort();
  allDates.forEach(date => {
    csvContent += `${date},${dailyWater[date] || 0},${dailySteps[date] || 0}\n`;
  });

  const fileUri = `${FileSystem.cacheDirectory}fitgo-datos-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, { encoding: FileSystem.EncodingType.UTF8 });

  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (isSharingAvailable) {
    await Sharing.shareAsync(fileUri, {
      UTI: 'public.comma-separated-values-text',
      mimeType: 'text/csv',
      dialogTitle: 'Exportar Datos CSV FitGO'
    });
  }
}

/**
 * Generates and shares an Excel (.xlsx) workbook with multiple sheets:
 * Profile, Body Measurements, Nutrition, Daily Metrics, Cardio/Activities, and Workouts.
 */
export async function exportReportXLSX(options: ExcelExportOptions): Promise<string> {
  const {
    profile,
    measurements = [],
    foodLogs = [],
    dailyWater = {},
    dailySteps = {},
    dailySleep = {},
    dailyNeat = {},
    dailyExercise = {},
    activityLogs = [],
    workouts = [],
    massUnit = 'kg',
    lengthUnit = 'cm',
    energyUnit = 'kcal',
    volumeUnit = 'l',
    t = (_key: string, def?: string) => def || '',
  } = options;

  const getGoalText = (g: string | undefined) => {
    if (!g) return '';
    if (g === 'lose_weight' || g === 'lose') return t('profile.loseWeight', 'Perder Peso');
    if (g === 'gain_muscle' || g === 'gain') return t('profile.gainMuscle', 'Ganar Músculo');
    if (g === 'maintain') return t('profile.maintain', 'Mantener');
    return g;
  };

  const getSexText = (s: string | undefined) => {
    if (!s) return '';
    if (s === 'male') return t('profile.male', 'Hombre');
    if (s === 'female') return t('profile.female', 'Mujer');
    return s;
  };

  const getMealText = (m: string) => {
    const key = `tracker.${(m || '').toLowerCase()}`;
    return t(key, m);
  };

  const getNeatText = (n: string) => {
    if (!n) return '';
    return t(`neat.${n}`, n);
  };

  const getExerciseText = (e: string) => {
    if (!e) return '';
    return t(`exercise.${e}`, e);
  };

  const getActivityName = (name: string) => {
    const key = `activities.${(name || '').toLowerCase().replace(/\s+/g, '_')}`;
    return t(key, name);
  };

  // 1. Profile Rows
  const profileRows = [
    { [t('profile.field', 'Campo')]: t('profile.editName', 'Nombre'), [t('profile.value', 'Valor')]: profile?.name || '' },
    { [t('profile.field', 'Campo')]: t('auth.email', 'Email'), [t('profile.value', 'Valor')]: profile?.email || '' },
    { [t('profile.field', 'Campo')]: t('profile.userId', 'ID Usuario'), [t('profile.value', 'Valor')]: profile?.id || '' },
    { [t('profile.field', 'Campo')]: t('onboarding.goal', 'Meta'), [t('profile.value', 'Valor')]: getGoalText(profile?.goal) },
    { [t('profile.field', 'Campo')]: `${t('profile.weight', 'Peso')} (${massUnit})`, [t('profile.value', 'Valor')]: profile?.weight ? parseFloat(convertMass(profile.weight, 'kg', massUnit as any).toFixed(1)) : '' },
    { [t('profile.field', 'Campo')]: `${t('profile.height', 'Altura')} (${lengthUnit})`, [t('profile.value', 'Valor')]: profile?.height ? parseFloat(convertLength(profile.height, 'cm', lengthUnit as any).toFixed(1)) : '' },
    { [t('profile.field', 'Campo')]: t('profile.age', 'Edad'), [t('profile.value', 'Valor')]: profile?.age || '' },
    { [t('profile.field', 'Campo')]: t('profile.sex', 'Sexo'), [t('profile.value', 'Valor')]: getSexText(profile?.sex) },
    { [t('profile.field', 'Campo')]: `TDEE (${energyUnit})`, [t('profile.value', 'Valor')]: profile?.tdee || '' },
    { [t('profile.field', 'Campo')]: `${t('tracker.target', 'Objetivo de Calorías')} (${energyUnit})`, [t('profile.value', 'Valor')]: profile?.targetCalories || '' },
    { [t('profile.field', 'Campo')]: `${t('tracker.protein', 'Proteínas')} (g)`, [t('profile.value', 'Valor')]: profile?.macros?.protein || '' },
    { [t('profile.field', 'Campo')]: `${t('tracker.carbs', 'Carbohidratos')} (g)`, [t('profile.value', 'Valor')]: profile?.macros?.carbs || '' },
    { [t('profile.field', 'Campo')]: `${t('tracker.fat', 'Grasas')} (g)`, [t('profile.value', 'Valor')]: profile?.macros?.fat || '' },
  ];

  // 2. Measurements Rows
  const measRows = measurements.map((m: any) => ({
    [t('common.date', 'Fecha')]: m.date,
    [`${t('profile.weight', 'Peso')} (${massUnit})`]: m.weight ? parseFloat(convertMass(m.weight, 'kg', massUnit as any).toFixed(1)) : '',
    [`${t('profile.bodyFat', 'Grasa')} %`]: m.bodyFat ? parseFloat(Number(m.bodyFat).toFixed(1)) : '',
    [`${t('profile.waist', 'Cintura')} (${lengthUnit})`]: m.waist ? parseFloat(convertLength(m.waist, 'cm', lengthUnit as any).toFixed(1)) : '',
    [`${t('profile.hips', 'Cadera')} (${lengthUnit})`]: m.hips ? parseFloat(convertLength(m.hips, 'cm', lengthUnit as any).toFixed(1)) : '',
    [`${t('profile.chest', 'Pecho')} (${lengthUnit})`]: m.chest ? parseFloat(convertLength(m.chest, 'cm', lengthUnit as any).toFixed(1)) : '',
    [`${t('profile.arms', 'Brazos')} (${lengthUnit})`]: m.arms ? parseFloat(convertLength(m.arms, 'cm', lengthUnit as any).toFixed(1)) : '',
    [`${t('profile.legs', 'Piernas')} (${lengthUnit})`]: m.legs ? parseFloat(convertLength(m.legs, 'cm', lengthUnit as any).toFixed(1)) : '',
    [`${t('profile.neck', 'Cuello')} (${lengthUnit})`]: m.neck ? parseFloat(convertLength(m.neck, 'cm', lengthUnit as any).toFixed(1)) : '',
    [t('common.notes', 'Notas')]: m.notes || '',
  }));

  // 3. Food/Nutrition Rows
  const foodRows = foodLogs.map((l: any) => ({
    [t('common.date', 'Fecha')]: l.loggedAt ? l.loggedAt.split('T')[0] : '',
    [t('tracker.meal', 'Comida')]: getMealText(l.meal),
    [t('tracker.food', 'Alimento')]: l.foodItem?.name || '',
    [`${t('tracker.grams', 'Cantidad')} (g)`]: l.grams,
    [`${t('tracker.calories', 'Calorías')} (${energyUnit})`]: l.calories,
    [`${t('tracker.protein', 'Proteínas')} (g)`]: l.protein,
    [`${t('tracker.carbs', 'Carbohidratos')} (g)`]: l.carbs,
    [`${t('tracker.fat', 'Grasas')} (g)`]: l.fat,
    [`${t('tracker.fiber', 'Fibra')} (g)`]: l.fiber || 0,
    [`${t('tracker.sugar', 'Azúcar')} (g)`]: l.sugar || 0,
    [`${t('tracker.sodium', 'Sodio')} (mg)`]: l.sodium || 0,
  }));

  // 4. Daily Metrics Rows
  const metricDates = Array.from(new Set([...Object.keys(dailyWater), ...Object.keys(dailySteps), ...Object.keys(dailySleep)])).sort().reverse();
  const metricRows = metricDates.map((d: string) => ({
    [t('common.date', 'Fecha')]: d,
    [t('tracker.steps', 'Pasos')]: dailySteps[d] || 0,
    [`${t('tracker.water', 'Agua')} (${volumeUnit})`]: parseFloat(convertVolume(dailyWater[d] || 0, 'ml', volumeUnit as any).toFixed(2)),
    [`${t('tracker.sleep', 'Sueño')} (h)`]: dailySleep[d] || 0,
    [`${t('tracker.lifestyle', 'Estilo de vida')} (NEAT)`]: getNeatText(dailyNeat[d] || ''),
    [t('exercise.title', 'Ejercicio')]: getExerciseText(dailyExercise[d] || ''),
  }));

  // 5. Cardio & Activity Rows
  const activityRows = activityLogs.map((a: any) => ({
    [t('common.date', 'Fecha')]: a.loggedAt ? a.loggedAt.split('T')[0] : '',
    [t('profile.activity', 'Actividad')]: getActivityName(a.name),
    [`${t('activities.duration', 'Duración')} (min)`]: a.duration,
    [`${t('tracker.calories', 'Calorías')} (${energyUnit})`]: a.calories,
  }));

  // 6. Workout Rows
  const workoutRows: any[] = [];
  workouts.forEach((w: any) => {
    (w.exercises || []).forEach((ex: any) => {
      workoutRows.push({
        [t('common.date', 'Fecha')]: w.date,
        [t('profile.routine', 'Rutina')]: w.routineName,
        [t('exercise.title', 'Ejercicio')]: ex.name,
        [t('planner.sets', 'Series')]: ex.sets,
        [t('planner.reps', 'Repeticiones')]: ex.reps,
        [`${t('profile.weight', 'Peso')} (${massUnit})`]: ex.weight ? parseFloat(convertMass(ex.weight, 'kg', massUnit as any).toFixed(1)) : '',
        'RPE': ex.rpe || '',
      });
    });
  });

  const wb = XLSX.utils.book_new();

  const addSheet = (data: any[], sheetName: string) => {
    const ws = XLSX.utils.json_to_sheet(data);
    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      ws['!cols'] = headers.map(h => {
        let maxLen = String(h).length;
        data.forEach(r => {
          const val = r[h];
          if (val !== undefined && val !== null) {
            maxLen = Math.max(maxLen, String(val).length);
          }
        });
        return { wch: Math.min(Math.max(maxLen + 3, 10), 40) };
      });
    }
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  };

  addSheet(profileRows, t('profile.sheetProfile', 'Perfil'));
  addSheet(measRows, t('profile.sheetWeight', 'Peso'));
  addSheet(foodRows, t('profile.sheetNutrition', 'Nutrición'));
  addSheet(metricRows, t('profile.sheetMetrics', 'Métricas'));
  addSheet(activityRows, t('profile.cardioAndActivities', 'Actividades'));
  addSheet(workoutRows, t('planner.workoutsTab', 'Entrenamientos'));

  const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
  const uri = `${FileSystem.cacheDirectory}FitGO_Data_${getLocalDateString(new Date())}.xlsx`;

  await FileSystem.writeAsStringAsync(uri, wbout, { encoding: FileSystem.EncodingType.Base64 });

  const isSharingAvailable = await Sharing.isAvailableAsync();
  if (isSharingAvailable) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: t('profile.exportData', 'Exportar Data'),
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
  }

  return uri;
}
