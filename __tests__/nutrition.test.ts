import { recalculateStreak } from '../store/nutrition/utils';
import { selectDailyTotals } from '../store/nutrition/selectors';

describe('recalculateStreak', () => {
  it('returns 0 for empty activeDays', () => {
    expect(recalculateStreak({})).toBe(0);
  });

  it('counts consecutive days backwards', () => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    expect(recalculateStreak({ [today]: true, [yesterday]: true, [twoDaysAgo]: true })).toBe(3);
  });
});

describe('selectDailyTotals', () => {
  it('returns zeros for empty logs', () => {
    const result = selectDailyTotals({ selectedDate: '2026-06-18', todayLogs: [] });
    expect(result.calories).toBe(0);
    expect(result.protein).toBe(0);
  });

  it('aggregates logs for the selected date', () => {
    const todayLogs = [
      { loggedAt: '2026-06-18T08:00:00', calories: 500, protein: 30, carbs: 50, fat: 20, sugar: 10, fiber: 5, sodium: 200, iron: 2, calcium: 100, saturatedFat: 5, transFat: 1 },
      { loggedAt: '2026-06-18T12:00:00', calories: 700, protein: 40, carbs: 60, fat: 25, sugar: 15, fiber: 3, sodium: 300, iron: 1, calcium: 50, saturatedFat: 8, transFat: 0 },
    ];
    const result = selectDailyTotals({ selectedDate: '2026-06-18', todayLogs: todayLogs as any });
    expect(result).toEqual({
      calories: 1200, protein: 70, carbs: 110, fat: 45, sugar: 25, fiber: 8,
      sodium: 500, iron: 3, calcium: 150, saturatedFat: 13, transFat: 1,
    });
  });

  it('excludes logs from other dates', () => {
    const todayLogs = [
      { loggedAt: '2026-06-18T08:00:00', calories: 500, protein: 30, carbs: 50, fat: 20, sugar: 0, fiber: 0, sodium: 0, iron: 0, calcium: 0, saturatedFat: 0, transFat: 0 },
      { loggedAt: '2026-06-17T12:00:00', calories: 999, protein: 99, carbs: 99, fat: 99, sugar: 0, fiber: 0, sodium: 0, iron: 0, calcium: 0, saturatedFat: 0, transFat: 0 },
    ];
    const result = selectDailyTotals({ selectedDate: '2026-06-18', todayLogs: todayLogs as any });
    expect(result.calories).toBe(500);
  });
});
