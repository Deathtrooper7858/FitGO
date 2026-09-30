/**
 * Utility for consistent date formatting across the app.
 * Ensures local time is used instead of UTC to avoid timezone mismatches.
 */

/**
 * Returns a date string in YYYY-MM-DD format based on local time.
 * Uses deterministic date methods to avoid locale/ICU variations across JS engines.
 * @param date Optional date object, defaults to now.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns a local time string in HH:mm:ss format.
 * @param date Optional date object, defaults to now.
 */
export function getLocalTimeString(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * Returns a combined local datetime string in YYYY-MM-DDTHH:mm:ss format.
 * Avoids UTC ISO shifts (e.g., past 6pm/7pm local time becoming next day in UTC).
 * @param date Optional date object, defaults to now.
 * @param dateStr Optional target date string in YYYY-MM-DD format.
 */
export function getLocalDateTimeString(date: Date = new Date(), dateStr?: string): string {
  const d = dateStr || getLocalDateString(date);
  const t = getLocalTimeString(date);
  return `${d}T${t}`;
}

/**
 * Normalizes meal strings (Spanish or English) to standard database categories:
 * 'breakfast', 'lunch', 'dinner', 'snack' (or snack2, etc.)
 */
export function normalizeMealType(meal?: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' | string {
  if (!meal) {
    const h = new Date().getHours();
    if (h < 10) return 'breakfast';
    if (h < 14) return 'lunch';
    if (h < 18) return 'snack';
    return 'dinner';
  }
  const norm = meal.toLowerCase().trim();
  if (norm.includes('desayuno') || norm.includes('breakfast')) return 'breakfast';
  if (norm.includes('almuerzo') || norm.includes('lunch') || norm.includes('comida')) return 'lunch';
  if (norm.includes('cena') || norm.includes('dinner')) return 'dinner';
  if (norm.startsWith('snack')) return norm;
  return 'snack';
}

/**
 * Formats a date for display based on locale.
 */
export function formatDisplayDate(dateStr: string, language: string = 'en'): string {
  const date = new Date(dateStr + 'T12:00:00'); // Use mid-day to avoid TZ shifts
  return date.toLocaleDateString(language, { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
}
/**
 * Adds or subtracts days from a YYYY-MM-DD date string.
 * @param dateStr Current date string.
 * @param days Number of days to add (can be negative).
 */
export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return getLocalDateString(date);
}
