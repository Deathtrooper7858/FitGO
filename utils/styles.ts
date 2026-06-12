export const getNameStyle = (
  nameColor?: string | null,
  userId?: string,
  currentUserId?: string,
  currentUserColor?: string | null
): any => {
  // Always use live profile color for the current user (avoids stale cache)
  const isMe = userId && userId === currentUserId;
  const resolvedColor = isMe ? (currentUserColor || nameColor) : nameColor;

  if (resolvedColor === 'admin_glow') {
    return {
      color: '#00F0FF',
      textShadowColor: 'rgba(0, 240, 255, 0.9)',
      textShadowOffset: { width: 0, height: 0 },
      textShadowRadius: 10,
    };
  }
  
  // Return the custom color if set, otherwise strictly enforce white (#FFFFFF)
  return { color: resolvedColor || '#FFFFFF' };
};
