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
 * Normalizes meal strings (Spanish, English, German, French, Italian, Portuguese, etc.) to standard categories:
 * 'breakfast', 'lunch', 'dinner', 'snack' (or snack2, snack3, etc.)
 */
export function normalizeMealType(meal?: string): 'breakfast' | 'lunch' | 'dinner' | 'snack' | string {
  if (!meal || typeof meal !== 'string') {
    const h = new Date().getHours();
    if (h < 11) return 'breakfast';
    if (h < 16) return 'lunch';
    if (h < 19) return 'snack';
    return 'dinner';
  }
  const norm = meal.toLowerCase().trim();

  // Check for numbered extra snacks (e.g. "snack 2", "snack2", "snack-2", "merienda 2")
  const snackMatch = norm.match(/(?:snack|merienda|colaci[oó]n|refrigerio)[^\d]*(\d+)/i);
  if (snackMatch && snackMatch[1]) {
    const num = parseInt(snackMatch[1], 10);
    return num > 1 ? `snack${num}` : 'snack';
  }

  if (
    norm.includes('desayuno') ||
    norm.includes('breakfast') ||
    norm.includes('petit-déjeuner') ||
    norm.includes('frühstück') ||
    norm.includes('colazione') ||
    norm.includes('café da manhã')
  ) {
    return 'breakfast';
  }

  if (
    norm.includes('almuerzo') ||
    norm.includes('lunch') ||
    norm.includes('comida') ||
    norm.includes('mittagessen') ||
    norm.includes('déjeuner') ||
    norm.includes('pranzo')
  ) {
    return 'lunch';
  }

  if (
    norm.includes('cena') ||
    norm.includes('dinner') ||
    norm.includes('abendessen') ||
    norm.includes('dîner')
  ) {
    return 'dinner';
  }

  if (
    norm.includes('snack') ||
    norm.includes('merienda') ||
    norm.includes('colaci') ||
    norm.includes('tentempi') ||
    norm.includes('refrigerio') ||
    norm.includes('spuntino') ||
    norm.includes('lanche')
  ) {
    return 'snack';
  }

  if (norm.startsWith('snack')) {
    return norm.replace(/\s+/g, '');
  }

  // Safe fallback by current hour if unrecognized string
  const h = new Date().getHours();
  if (h < 11) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 19) return 'snack';
  return 'dinner';
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
