import { useAICreditsStore } from '../../store/aiCreditsStore';

describe('useAICreditsStore', () => {
  beforeEach(() => {
    useAICreditsStore.setState({
      creditsLeft: 5,
      lastResetDate: '2026-01-01',
      totalAdsWatched: 0,
      isProUser: false,
    });
  });

  it('resets credits if date is from previous day on consumeCredit', () => {
    useAICreditsStore.setState({
      creditsLeft: 0,
      lastResetDate: '2020-01-01',
      totalAdsWatched: 3,
    });

    const result = useAICreditsStore.getState().consumeCredit();
    expect(result).toBe(true);
    // After consumption from daily reset (freeAICreditsPerDay(3) - 1 = 2)
    expect(useAICreditsStore.getState().creditsLeft).toBe(2);
    expect(useAICreditsStore.getState().totalAdsWatched).toBe(0);
  });

  it('allows unlimited usage for pro users without consuming credits', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    useAICreditsStore.setState({
      creditsLeft: 2,
      lastResetDate: todayStr,
      isProUser: true,
    });

    const result = useAICreditsStore.getState().consumeCredit();
    expect(result).toBe(true);
    expect(useAICreditsStore.getState().creditsLeft).toBe(2);
  });

  it('returns false when no credits are left on current day', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    useAICreditsStore.setState({
      creditsLeft: 0,
      lastResetDate: todayStr,
    });

    const result = useAICreditsStore.getState().consumeCredit();
    expect(result).toBe(false);
  });

  it('recharges credits on rewarded ad watch', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    useAICreditsStore.setState({
      creditsLeft: 2,
      totalAdsWatched: 1,
      lastResetDate: todayStr,
    });

    const success = useAICreditsStore.getState().rechargeCredits(2);
    expect(success).toBe(true);
    expect(useAICreditsStore.getState().creditsLeft).toBe(4);
    expect(useAICreditsStore.getState().totalAdsWatched).toBe(2);
  });
});
