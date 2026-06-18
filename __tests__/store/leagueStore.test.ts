import { getStreakMultiplier } from '../../store/leagueStore';

jest.mock('../../services/supabase', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

describe('getStreakMultiplier', () => {
  it('returns 1.0 for streak 0', () => {
    expect(getStreakMultiplier(0)).toBe(1.0);
  });

  it('returns 1.0 for streak 1', () => {
    expect(getStreakMultiplier(1)).toBe(1.0);
  });

  it('returns 1.0 for streak 2', () => {
    expect(getStreakMultiplier(2)).toBe(1.0);
  });

  it('returns 1.2 for streak 3', () => {
    expect(getStreakMultiplier(3)).toBe(1.2);
  });

  it('returns 1.2 for streak 4', () => {
    expect(getStreakMultiplier(4)).toBe(1.2);
  });

  it('returns 1.2 for streak 7', () => {
    expect(getStreakMultiplier(7)).toBe(1.2);
  });

  it('returns 1.5 for streak 8', () => {
    expect(getStreakMultiplier(8)).toBe(1.5);
  });

  it('returns 1.5 for streak 10', () => {
    expect(getStreakMultiplier(10)).toBe(1.5);
  });

  it('returns 1.5 for streak 14', () => {
    expect(getStreakMultiplier(14)).toBe(1.5);
  });

  it('returns 2.0 for streak 15', () => {
    expect(getStreakMultiplier(15)).toBe(2.0);
  });

  it('returns 2.0 for streak 20', () => {
    expect(getStreakMultiplier(20)).toBe(2.0);
  });

  it('returns 2.0 for streak 100', () => {
    expect(getStreakMultiplier(100)).toBe(2.0);
  });

  it('handles negative streak as 1.0', () => {
    expect(getStreakMultiplier(-1)).toBe(1.0);
  });

  it('handles boundary at streak 2 vs 3', () => {
    expect(getStreakMultiplier(2)).toBe(1.0);
    expect(getStreakMultiplier(3)).toBe(1.2);
  });

  it('handles boundary at streak 7 vs 8', () => {
    expect(getStreakMultiplier(7)).toBe(1.2);
    expect(getStreakMultiplier(8)).toBe(1.5);
  });

  it('handles boundary at streak 14 vs 15', () => {
    expect(getStreakMultiplier(14)).toBe(1.5);
    expect(getStreakMultiplier(15)).toBe(2.0);
  });
});
