import { safe, safeNum, clamp, truncate } from '../../utils/sanitize';

describe('safe', () => {
  it('returns empty string for null', () => {
    expect(safe(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(safe(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(safe('')).toBe('');
  });

  it('strips HTML tags', () => {
    expect(safe('<script>alert("xss")</script>')).toBe('alert("xss")');
  });

  it('strips HTML tags and keeps text', () => {
    expect(safe('<p>Hello</p>')).toBe('Hello');
  });

  it('strips nested tags', () => {
    expect(safe('<div><span>nested</span></div>')).toBe('nested');
  });

  it('trims whitespace', () => {
    expect(safe('  hello  ')).toBe('hello');
  });

  it('passes through plain text', () => {
    expect(safe('hello world')).toBe('hello world');
  });

  it('handles self-closing tags', () => {
    expect(safe('<br/>text<br />')).toBe('text');
  });
});

describe('safeNum', () => {
  it('returns fallback for empty string', () => {
    expect(safeNum('')).toBe(0);
  });

  it('returns fallback for null', () => {
    expect(safeNum(null)).toBe(0);
  });

  it('returns fallback for undefined', () => {
    expect(safeNum(undefined)).toBe(0);
  });

  it('parses numeric string', () => {
    expect(safeNum('42')).toBe(42);
  });

  it('returns fallback for non-numeric string', () => {
    expect(safeNum('abc')).toBe(0);
  });

  it('uses custom fallback', () => {
    expect(safeNum('abc', -1)).toBe(-1);
  });

  it('handles number input', () => {
    expect(safeNum(42)).toBe(42);
  });

  it('returns fallback for NaN', () => {
    expect(safeNum(NaN)).toBe(0);
  });

  it('returns fallback for Infinity', () => {
    expect(safeNum(Infinity)).toBe(0);
  });

  it('returns fallback for -Infinity', () => {
    expect(safeNum(-Infinity)).toBe(0);
  });

  it('parses decimal string', () => {
    expect(safeNum('3.14')).toBeCloseTo(3.14);
  });

  it('parses negative string', () => {
    expect(safeNum('-5')).toBe(-5);
  });
});

describe('clamp', () => {
  it('returns value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('returns min when value is below', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
  });

  it('returns max when value is above', () => {
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('handles value equal to min', () => {
    expect(clamp(0, 0, 10)).toBe(0);
  });

  it('handles value equal to max', () => {
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('handles negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
  });

  it('handles zero range', () => {
    expect(clamp(5, 5, 5)).toBe(5);
  });

  it('clamps at min when range is inverted', () => {
    // Math.min(Math.max(5, 10), 0) = Math.min(10, 0) = 0
    expect(clamp(5, 10, 0)).toBe(0);
  });
});

describe('truncate', () => {
  it('returns full string when within maxLength', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates and appends ellipsis when exceeding maxLength', () => {
    const result = truncate('hello world', 5);
    expect(result).toBe('hell\u2026');
    expect(result.length).toBe(5);
  });

  it('handles exact maxLength', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('handles empty string', () => {
    expect(truncate('', 5)).toBe('');
  });

  it('handles maxLength of 1', () => {
    expect(truncate('ab', 1)).toBe('\u2026');
  });

  it('uses ellipsis character', () => {
    const result = truncate('long string', 4);
    expect(result).toBe('lon\u2026');
    expect(result).not.toBe('lon...');
  });
});
