describe('Name Colors & Pro Access logic', () => {
  const isColorMatch = (a?: string | null, b?: string | null) => {
    if (!a || !b) return false;
    const normA = a.toLowerCase().trim();
    const normB = b.toLowerCase().trim();
    if (normA === normB) return true;
    const goldAliases = ['#ffb800', '#ffc000', '#eab308', '#ffd700'];
    if (goldAliases.includes(normA) && goldAliases.includes(normB)) return true;
    const redAliases = ['#ff2a54', '#ef4444', '#f43f5e'];
    if (redAliases.includes(normA) && redAliases.includes(normB)) return true;
    const blueAliases = ['#00f0ff', '#3b82f6', '#0ea5e9'];
    if (blueAliases.includes(normA) && blueAliases.includes(normB)) return true;
    const greenAliases = ['#00e676', '#10b981', '#22c55e'];
    if (greenAliases.includes(normA) && greenAliases.includes(normB)) return true;
    const magentaAliases = ['#ff00ff', '#d946ef', '#ec4899'];
    if (magentaAliases.includes(normA) && magentaAliases.includes(normB)) return true;
    const purpleAliases = ['#8b5cf6', '#4c1d95', '#7c3aed'];
    if (purpleAliases.includes(normA) && purpleAliases.includes(normB)) return true;
    return false;
  };

  const resolveAccess = (
    colorHex: string,
    isPro: boolean,
    hookIsPro: boolean,
    role?: string
  ) => {
    const isUserPro = Boolean(
      isPro ||
      hookIsPro ||
      role === 'owner' ||
      role === 'admin' ||
      role === 'super_admin' ||
      role === 'pro_user'
    );
    const isAdminGlow = colorHex === 'admin_glow';
    const isStaff = role === 'admin' || role === 'owner' || role === 'super_admin';
    return isAdminGlow ? isStaff : isUserPro;
  };

  it('grants Pro color access to owner, admin, and super_admin even if isPro prop is false', () => {
    expect(resolveAccess('#FFB800', false, false, 'owner')).toBe(true);
    expect(resolveAccess('#FF2A54', false, false, 'owner')).toBe(true);
    expect(resolveAccess('#FFB800', false, false, 'admin')).toBe(true);
    expect(resolveAccess('#FFB800', false, false, 'super_admin')).toBe(true);
    expect(resolveAccess('#FFB800', false, false, 'pro_user')).toBe(true);
  });

  it('grants access when hook indicates user is pro', () => {
    expect(resolveAccess('#FFB800', false, true, 'user')).toBe(true);
    expect(resolveAccess('#00F0FF', false, true, 'user')).toBe(true);
  });

  it('denies access to normal free users without pro', () => {
    expect(resolveAccess('#FFB800', false, false, 'user')).toBe(false);
    expect(resolveAccess('#FF2A54', false, false, 'user')).toBe(false);
  });

  it('restricts admin_glow to staff only', () => {
    expect(resolveAccess('admin_glow', true, true, 'owner')).toBe(true);
    expect(resolveAccess('admin_glow', true, true, 'admin')).toBe(true);
    expect(resolveAccess('admin_glow', true, true, 'pro_user')).toBe(false);
    expect(resolveAccess('admin_glow', true, true, 'user')).toBe(false);
  });

  it('matches color aliases correctly between legacy and modern palettes', () => {
    expect(isColorMatch('#FF2A54', '#EF4444')).toBe(true);
    expect(isColorMatch('#FFB800', '#FFC000')).toBe(true);
    expect(isColorMatch('#00F0FF', '#3B82F6')).toBe(true);
    expect(isColorMatch('#8B5CF6', '#4C1D95')).toBe(true);
    expect(isColorMatch('#FFB800', '#FF2A54')).toBe(false);
  });
});
