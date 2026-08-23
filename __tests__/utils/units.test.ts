import { convertMass, convertVolume, convertEnergy, formatValue } from '../../utils/units';

describe('convertMass', () => {
  it('returns same value when from === to', () => {
    expect(convertMass(10, 'kg', 'kg')).toBe(10);
    expect(convertMass(5, 'lb', 'lb')).toBe(5);
    expect(convertMass(100, 'g', 'g')).toBe(100);
  });

  it('converts kg to lb', () => {
    const result = convertMass(1, 'kg', 'lb');
    expect(result).toBeCloseTo(2.20462, 4);
  });

  it('converts lb to kg', () => {
    const result = convertMass(2.20462, 'lb', 'kg');
    expect(result).toBeCloseTo(1, 4);
  });

  it('converts g to kg', () => {
    const result = convertMass(1000, 'g', 'kg');
    expect(result).toBeCloseTo(1, 4);
  });

  it('converts kg to g', () => {
    const result = convertMass(0.5, 'kg', 'g');
    expect(result).toBeCloseTo(500, 4);
  });

  it('handles zero value', () => {
    expect(convertMass(0, 'kg', 'lb')).toBe(0);
  });

  it('handles negative values', () => {
    const result = convertMass(-10, 'kg', 'lb');
    expect(result).toBeLessThan(0);
  });
});

describe('convertVolume', () => {
  it('returns same value when from === to', () => {
    expect(convertVolume(250, 'ml', 'ml')).toBe(250);
    expect(convertVolume(1, 'l', 'l')).toBe(1);
    expect(convertVolume(8, 'oz', 'oz')).toBe(8);
  });

  it('converts l to ml', () => {
    const result = convertVolume(1, 'l', 'ml');
    expect(result).toBeCloseTo(1000, 0);
  });

  it('converts ml to oz', () => {
    const result = convertVolume(29.5735, 'ml', 'oz');
    expect(result).toBeCloseTo(1, 0);
  });

  it('converts oz to ml', () => {
    const result = convertVolume(1, 'oz', 'ml');
    expect(result).toBeCloseTo(29.5735, 1);
  });

  it('handles zero value', () => {
    expect(convertVolume(0, 'l', 'ml')).toBe(0);
  });

  it('handles negative values', () => {
    const result = convertVolume(-1, 'l', 'ml');
    expect(result).toBeLessThan(0);
  });
});

describe('convertEnergy', () => {
  it('returns same value when from === to', () => {
    expect(convertEnergy(100, 'kcal', 'kcal')).toBe(100);
    expect(convertEnergy(100, 'kj', 'kj')).toBe(100);
  });

  it('converts kcal to kj', () => {
    const result = convertEnergy(100, 'kcal', 'kj');
    expect(result).toBeCloseTo(418.4, 1);
  });

  it('converts kj to kcal', () => {
    const result = convertEnergy(418.4, 'kj', 'kcal');
    expect(result).toBeCloseTo(100, 1);
  });

  it('handles zero value', () => {
    expect(convertEnergy(0, 'kcal', 'kj')).toBe(0);
  });
});

describe('formatValue', () => {
  it('returns -- for undefined', () => {
    expect(formatValue(undefined as any)).toBe('--');
  });

  it('returns -- for null', () => {
    expect(formatValue(null as any)).toBe('--');
  });

  it('formats number with default precision', () => {
    expect(formatValue(3.14159)).toBe('3.1');
  });

  it('formats number with custom precision', () => {
    expect(formatValue(3.14159, 3)).toBe('3.142');
  });

  it('rounds correctly', () => {
    expect(formatValue(4.5, 0)).toBe('5');
  });

  it('handles negative numbers', () => {
    expect(formatValue(-2.5)).toBe('-2.5');
  });

  it('handles zero', () => {
    expect(formatValue(0)).toBe('0.0');
  });

  it('handles NaN and Infinity', () => {
    expect(formatValue(NaN)).toBe('--');
    expect(formatValue(Infinity)).toBe('--');
    expect(formatValue(-Infinity)).toBe('--');
  });
});
