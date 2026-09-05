import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { UserProfile, FoodLog } from '../store/types';

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
