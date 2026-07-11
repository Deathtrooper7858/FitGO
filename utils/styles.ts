export const getNameStyle = (
  nameColor?: string | null,
  userId?: string,
  currentUserId?: string,
  currentUserColor?: string | null,
  premiumColor?: string | null,
): { color: string; textShadowColor?: string; textShadowOffset?: { width: number; height: number }; textShadowRadius?: number } => {
  const isMe = userId && userId === currentUserId;
  const color = isMe ? (currentUserColor || nameColor || premiumColor) : nameColor;
  const resolvedColor = color;

  if (resolvedColor === 'admin_glow') {
    return {
      color: '#00F0FF',
      textShadowColor: 'rgba(0, 240, 255, 0.9)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    };
  }

  return { color: resolvedColor || '#FFFFFF' };
};

export const getSafeColor = (color?: string | null, fallback?: string): string => {
  if (!color) return fallback || '#7C5CFC';
  if (color === 'admin_glow') return '#00F0FF';
  return (color.startsWith('#') || color.startsWith('rgb')) ? color : (fallback || '#7C5CFC');
};
