function parseHex(hex: string): { r: number; g: number; b: number } | null {
  if (!hex || typeof hex !== 'string') return null;
  let c = hex.trim().replace(/^#/, '');
  if (c.length === 3) {
    c = c.split('').map((char) => char + char).join('');
  }
  if (c.length >= 6) {
    const num = parseInt(c.slice(0, 6), 16);
    if (!isNaN(num)) {
      return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
      };
    }
  }
  return null;
}

export const hexToRgba = (hex: string, alpha: number = 1): string => {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${Math.max(0, Math.min(1, alpha))})`;
};

export const lightenColor = (hex: string, amount: number = 0.25): string => {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const r = Math.min(255, Math.round(rgb.r + (255 - rgb.r) * amount));
  const g = Math.min(255, Math.round(rgb.g + (255 - rgb.g) * amount));
  const b = Math.min(255, Math.round(rgb.b + (255 - rgb.b) * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const darkenColor = (hex: string, amount: number = 0.25): string => {
  const rgb = parseHex(hex);
  if (!rgb) return hex;
  const r = Math.max(0, Math.round(rgb.r * (1 - amount)));
  const g = Math.max(0, Math.round(rgb.g * (1 - amount)));
  const b = Math.max(0, Math.round(rgb.b * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

export const getNameStyle = (
  nameColor?: string | null,
  userId?: string,
  currentUserId?: string,
  currentUserColor?: string | null,
  premiumColor?: string | null,
  fallbackColor?: string,
): { color?: string; textShadowColor?: string; textShadowOffset?: { width: number; height: number }; textShadowRadius?: number } => {
  const isMe = (userId && currentUserId && userId === currentUserId) || (!userId && !currentUserId);
  const effectiveMyColor = (currentUserColor === '#EAB308' && premiumColor) ? premiumColor : (currentUserColor || premiumColor);
  const color = isMe ? (effectiveMyColor || nameColor) : nameColor;

  if (color === 'admin_glow') {
    return {
      color: '#00F0FF',
      textShadowColor: 'rgba(0, 240, 255, 0.9)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    };
  }

  if (color && typeof color === 'string') {
    const trimmed = color.trim();
    // Normalize too-dark purple #4C1D95 to bright accessible purple
    if (trimmed.toLowerCase() === '#4c1d95') {
      return { color: '#8B5CF6' };
    }

    if (trimmed.startsWith('#') || trimmed.startsWith('rgb')) {
      // Check luminance to ensure high readability on dark backgrounds
      const rgb = parseHex(trimmed);
      if (rgb) {
        const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
        if (luminance < 75) {
          // Color is too dark for dark backgrounds! Lighten it
          return { color: lightenColor(trimmed, 0.45) };
        }
      }
      return { color: trimmed };
    }
  }

  if (fallbackColor) {
    return { color: fallbackColor };
  }

  return {};
};

export const getSafeColor = (color?: string | null, fallback?: string): string => {
  if (!color) return fallback || '#7C5CFC';
  if (color === 'admin_glow') return '#00F0FF';
  const trimmed = color.trim();
  if (trimmed.toLowerCase() === '#4c1d95') return '#8B5CF6';
  if (trimmed.startsWith('#') || trimmed.startsWith('rgb')) {
    const rgb = parseHex(trimmed);
    if (rgb) {
      const luminance = 0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b;
      if (luminance < 75) {
        return lightenColor(trimmed, 0.45);
      }
    }
    return trimmed;
  }
  return fallback || '#7C5CFC';
};

export const isValidPremiumColor = (color?: string | null): boolean => {
  if (!color) return false;
  if (color === 'admin_glow') return true;
  return color.startsWith('#') || color.startsWith('rgb');
};
