import { getLocalDateString } from '../../utils/date';

let _cachedStreak = 0;
let _cachedStreakInput = '';
export function memoRecalculateStreak(activeDays: Record<string, boolean>): number {
  const key = JSON.stringify(activeDays);
  if (key === _cachedStreakInput) return _cachedStreak;
  _cachedStreakInput = key;
  _cachedStreak = recalculateStreak(activeDays);
  return _cachedStreak;
}

export function recalculateStreak(activeDays: Record<string, boolean>): number {
  let streak = 0;
  const todayStr = getLocalDateString();
  const checkDate = new Date();
  if (!activeDays[todayStr]) {
    checkDate.setDate(checkDate.getDate() - 1);
  }
  
  const maxPossibleStreak = Object.keys(activeDays).length;
  if (maxPossibleStreak === 0) return 0;
  
  for (let i = 0; i <= maxPossibleStreak; i++) {
    const dateStr = getLocalDateString(checkDate);
    if (!activeDays[dateStr]) break;
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

let _syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleSyncDailyMetrics(fn: () => void, ms = 800) {
  if (_syncDebounceTimer !== null) clearTimeout(_syncDebounceTimer);
  _syncDebounceTimer = setTimeout(() => {
    _syncDebounceTimer = null;
    fn();
  }, ms);
}
