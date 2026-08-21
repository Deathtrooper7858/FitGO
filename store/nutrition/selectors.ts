export interface DailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
  fiber: number;
  sodium: number;
  iron: number;
  calcium: number;
  saturatedFat: number;
  transFat: number;
}

let _cachedTotalsState: { date: string; logs: any[] } | null = null;
let _cachedTotalsResult: DailyTotals | null = null;

export function selectDailyTotals(state: {
  selectedDate: string;
  todayLogs: { loggedAt: string; calories?: number; protein?: number; carbs?: number; fat?: number; sugar?: number; fiber?: number; sodium?: number; iron?: number; calcium?: number; saturatedFat?: number; transFat?: number }[];
}): DailyTotals {
  const { selectedDate: date, todayLogs: logs } = state;

  if (_cachedTotalsState && _cachedTotalsState.date === date && _cachedTotalsState.logs === logs) {
    return _cachedTotalsResult!;
  }

  const dateLogs = logs.filter(l => l.loggedAt.startsWith(date));
  const raw = dateLogs.reduce(
    (acc, l) => ({
      calories: acc.calories + (Number(l.calories) || 0),
      protein: acc.protein + (Number(l.protein) || 0),
      carbs: acc.carbs + (Number(l.carbs) || 0),
      fat: acc.fat + (Number(l.fat) || 0),
      sugar: acc.sugar + (Number(l.sugar) || 0),
      fiber: acc.fiber + (Number(l.fiber) || 0),
      sodium: acc.sodium + (Number(l.sodium) || 0),
      iron: acc.iron + (Number(l.iron) || 0),
      calcium: acc.calcium + (Number(l.calcium) || 0),
      saturatedFat: acc.saturatedFat + (Number(l.saturatedFat) || 0),
      transFat: acc.transFat + (Number(l.transFat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, sugar: 0, fiber: 0, sodium: 0, iron: 0, calcium: 0, saturatedFat: 0, transFat: 0 }
  );

  _cachedTotalsResult = {
    calories: Math.round(raw.calories),
    protein: Math.round(raw.protein * 10) / 10,
    carbs: Math.round(raw.carbs * 10) / 10,
    fat: Math.round(raw.fat * 10) / 10,
    sugar: Math.round(raw.sugar * 10) / 10,
    fiber: Math.round(raw.fiber * 10) / 10,
    sodium: Math.round(raw.sodium),
    iron: Math.round(raw.iron * 10) / 10,
    calcium: Math.round(raw.calcium),
    saturatedFat: Math.round(raw.saturatedFat * 10) / 10,
    transFat: Math.round(raw.transFat * 10) / 10,
  };
  _cachedTotalsState = { date, logs };

  return _cachedTotalsResult;
}
