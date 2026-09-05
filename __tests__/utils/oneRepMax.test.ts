import { calculateOneRepMax } from '../../utils/oneRepMax';

describe('calculateOneRepMax', () => {
  it('returns 0 for non-positive values', () => {
    expect(calculateOneRepMax(0, 10).oneRepMax).toBe(0);
    expect(calculateOneRepMax(100, 0).oneRepMax).toBe(0);
    expect(calculateOneRepMax(-50, 5).oneRepMax).toBe(0);
  });

  it('returns exact weight for 1 rep', () => {
    const res = calculateOneRepMax(100, 1);
    expect(res.oneRepMax).toBe(100);
    expect(res.percentages[90]).toBe(90);
    expect(res.percentages[80]).toBe(80);
    expect(res.percentages[50]).toBe(50);
  });

  it('calculates 1RM accurately for bench press (100kg for 5 reps)', () => {
    const res = calculateOneRepMax(100, 5);
    // Epley: 100 * (1 + 5/30) = 116.67
    // Brzycki: 100 * (36 / 32) = 112.5
    // Avg ~ 114.6
    expect(res.epley).toBeCloseTo(116.7, 1);
    expect(res.brzycki).toBeCloseTo(112.5, 1);
    expect(res.oneRepMax).toBeGreaterThan(112);
    expect(res.oneRepMax).toBeLessThan(117);
    expect(res.percentages[90]).toBeDefined();
  });
});
