import { getLocalDateString, formatDisplayDate, addDays, getLocalTimeString, getLocalDateTimeString, normalizeMealType } from '../../utils/date';

describe('getLocalDateString', () => {
  it('returns YYYY-MM-DD format for a given date', () => {
    const date = new Date(2026, 5, 18); // June 18, 2026
    expect(getLocalDateString(date)).toBe('2026-06-18');
  });

  it('returns YYYY-MM-DD format for another date', () => {
    const date = new Date(2025, 0, 1); // January 1, 2025
    expect(getLocalDateString(date)).toBe('2025-01-01');
  });

  it('returns YYYY-MM-DD format for December', () => {
    const date = new Date(2026, 11, 31); // December 31, 2026
    expect(getLocalDateString(date)).toBe('2026-12-31');
  });
});

describe('formatDisplayDate', () => {
  it('returns locale-aware formatted date in English', () => {
    const result = formatDisplayDate('2026-06-18', 'en');
    expect(result).toContain('Thursday');
    expect(result).toContain('18');
    expect(result).toContain('June');
  });

  it('returns locale-aware formatted date in Spanish', () => {
    const result = formatDisplayDate('2026-06-18', 'es');
    expect(result).toContain('jueves');
    expect(result).toContain('18');
    expect(result).toContain('junio');
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2026-06-18', 3)).toBe('2026-06-21');
  });

  it('subtracts days', () => {
    expect(addDays('2026-06-18', -3)).toBe('2026-06-15');
  });

  it('returns same date when days is zero', () => {
    expect(addDays('2026-06-18', 0)).toBe('2026-06-18');
  });

  it('crosses month boundary forward', () => {
    expect(addDays('2026-06-28', 5)).toBe('2026-07-03');
  });

  it('crosses month boundary backward', () => {
    expect(addDays('2026-07-03', -5)).toBe('2026-06-28');
  });

  it('crosses year boundary forward', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('crosses year boundary backward', () => {
    expect(addDays('2027-01-02', -3)).toBe('2026-12-30');
  });
});

describe('getLocalTimeString and getLocalDateTimeString', () => {
  it('formats local time as HH:mm:ss with padding', () => {
    const d = new Date(2026, 8, 12, 19, 5, 9); // 7:05:09 PM
    expect(getLocalTimeString(d)).toBe('19:05:09');
  });

  it('combines local date and time without UTC shift', () => {
    const d = new Date(2026, 8, 12, 20, 30, 0); // 8:30 PM on Sept 12
    expect(getLocalDateTimeString(d)).toBe('2026-09-12T20:30:00');
  });

  it('respects explicitly provided dateStr', () => {
    const d = new Date(2026, 8, 12, 21, 15, 0); // 9:15 PM
    expect(getLocalDateTimeString(d, '2026-09-10')).toBe('2026-09-10T21:15:00');
  });
});

describe('normalizeMealType', () => {
  it('normalizes Spanish breakfast/desayuno terms to breakfast', () => {
    expect(normalizeMealType('desayuno')).toBe('breakfast');
    expect(normalizeMealType('Desayuno')).toBe('breakfast');
    expect(normalizeMealType('Breakfast')).toBe('breakfast');
  });

  it('normalizes Spanish lunch/almuerzo terms to lunch', () => {
    expect(normalizeMealType('almuerzo')).toBe('lunch');
    expect(normalizeMealType('Almuerzo')).toBe('lunch');
    expect(normalizeMealType('comida')).toBe('lunch');
    expect(normalizeMealType('Lunch')).toBe('lunch');
  });

  it('normalizes Spanish dinner/cena terms to dinner', () => {
    expect(normalizeMealType('cena')).toBe('dinner');
    expect(normalizeMealType('Cena')).toBe('dinner');
    expect(normalizeMealType('Dinner')).toBe('dinner');
  });

  it('normalizes snacks correctly', () => {
    expect(normalizeMealType('snack')).toBe('snack');
    expect(normalizeMealType('Snack')).toBe('snack');
    expect(normalizeMealType('snack2')).toBe('snack2');
  });
});

