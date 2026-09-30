import { getNameStyle, getSafeColor, isValidPremiumColor, lightenColor, darkenColor, hexToRgba } from '../../utils/styles';

describe('styles utility functions', () => {
  describe('getNameStyle', () => {
    it('returns empty object when no color is provided', () => {
      expect(getNameStyle(null)).toEqual({});
      expect(getNameStyle(undefined)).toEqual({});
      expect(getNameStyle('')).toEqual({});
    });

    it('returns empty object when color is invalid', () => {
      expect(getNameStyle('invalid_color')).toEqual({});
      expect(getNameStyle('12345')).toEqual({});
    });

    it('returns glowing cyan style for admin_glow', () => {
      const style = getNameStyle('admin_glow');
      expect(style).toEqual({
        color: '#00F0FF',
        textShadowColor: 'rgba(0, 240, 255, 0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
      });
    });

    it('returns the valid hex color directly for another user', () => {
      const style = getNameStyle('#FFB800', 'user-2', 'user-1', '#00F0FF', '#00F0FF');
      expect(style).toEqual({ color: '#FFB800' });
    });

    it('prioritizes current user premiumColor over stale yellow nameColor for current user', () => {
      const currentUserId = 'user-1';
      const myYellowNameColor = '#EAB308';
      const myChosenPremiumColor = '#00F0FF';

      // When rendering current user's name
      const style = getNameStyle(
        myYellowNameColor,
        currentUserId,
        currentUserId,
        myYellowNameColor,
        myChosenPremiumColor
      );

      expect(style).toEqual({ color: '#00F0FF' });
    });

    it('resolves current user when IDs are omitted (e.g. Dashboard/Planner greetings)', () => {
      const style = getNameStyle(undefined, undefined, undefined, undefined, '#FF2A54');
      expect(style).toEqual({ color: '#FF2A54' });
    });

    it('falls back to nameColor for current user if no premiumColor was chosen', () => {
      const currentUserId = 'user-1';
      const style = getNameStyle('#FFB800', currentUserId, currentUserId, '#FFB800', null);
      expect(style).toEqual({ color: '#FFB800' });
    });
  });

  describe('isValidPremiumColor', () => {
    it('validates hex, rgb, and admin_glow', () => {
      expect(isValidPremiumColor('#00F0FF')).toBe(true);
      expect(isValidPremiumColor('#FFF')).toBe(true);
      expect(isValidPremiumColor('rgb(255, 0, 0)')).toBe(true);
      expect(isValidPremiumColor('admin_glow')).toBe(true);
      expect(isValidPremiumColor(null)).toBe(false);
      expect(isValidPremiumColor(undefined)).toBe(false);
      expect(isValidPremiumColor('invalid')).toBe(false);
    });
  });

  describe('getSafeColor', () => {
    it('returns fallback or default purple if color is invalid or null', () => {
      expect(getSafeColor(null)).toBe('#7C5CFC');
      expect(getSafeColor(null, '#FF0000')).toBe('#FF0000');
      expect(getSafeColor('invalid', '#FF0000')).toBe('#FF0000');
    });

    it('resolves admin_glow to #00F0FF', () => {
      expect(getSafeColor('admin_glow')).toBe('#00F0FF');
    });

    it('returns valid hex color', () => {
      expect(getSafeColor('#00E676')).toBe('#00E676');
    });
  });

  describe('hexToRgba, lightenColor, darkenColor', () => {
    it('converts hex to rgba', () => {
      expect(hexToRgba('#000000', 0.5)).toBe('rgba(0, 0, 0, 0.5)');
      expect(hexToRgba('#FFFFFF', 1)).toBe('rgba(255, 255, 255, 1)');
    });

    it('lightens and darkens color', () => {
      const light = lightenColor('#7C5CFC', 0.2);
      const dark = darkenColor('#7C5CFC', 0.2);
      expect(light).toMatch(/^#[0-9a-f]{6}$/i);
      expect(dark).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});
