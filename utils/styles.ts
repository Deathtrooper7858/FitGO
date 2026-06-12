export const getNameStyle = (
  nameColor?: string | null,
  userId?: string,
  currentUserId?: string,
  currentUserColor?: string | null,
  /** Pass the local store premiumColor so own-user rows always reflect real-time changes */
  storePremiumColor?: string | null
): any => {
  // Always use live profile color for the current user (avoids stale cache)
  const isMe = userId && userId === currentUserId;
  const baseColor = isMe ? (currentUserColor || nameColor) : nameColor;

  // Never override admin_glow with a local store premium color. 
  // We use storePremiumColor only as a fallback if baseColor is missing.
  const resolvedColor = baseColor || (isMe ? storePremiumColor : null);

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
