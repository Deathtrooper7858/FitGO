import AsyncStorage from '@react-native-async-storage/async-storage';
import { PaywallManager } from '../../utils/paywallManager';

describe('PaywallManager', () => {
  let memoryStore: Record<string, string> = {};

  beforeEach(async () => {
    memoryStore = {};
    (AsyncStorage.getItem as jest.Mock).mockImplementation((key: string) => Promise.resolve(memoryStore[key] ?? null));
    (AsyncStorage.setItem as jest.Mock).mockImplementation((key: string, val: string) => {
      memoryStore[key] = val;
      return Promise.resolve();
    });
    (AsyncStorage.removeItem as jest.Mock).mockImplementation((key: string) => {
      delete memoryStore[key];
      return Promise.resolve();
    });

    await PaywallManager.resetHistory();
    jest.clearAllMocks();
  });

  it('should return false if user is Pro', async () => {
    const shouldShow = await PaywallManager.shouldShowPaywall(true);
    expect(shouldShow).toBe(false);
  });

  it('should return false on opens before reaching the target interval', async () => {
    await PaywallManager.setTargetOpenInterval(4);

    // Open 1: count becomes 1 (< 4)
    const open1 = await PaywallManager.shouldShowPaywall(false);
    expect(open1).toBe(false);

    // Open 2: count becomes 2 (< 4)
    const open2 = await PaywallManager.shouldShowPaywall(false);
    expect(open2).toBe(false);

    // Open 3: count becomes 3 (< 4)
    const open3 = await PaywallManager.shouldShowPaywall(false);
    expect(open3).toBe(false);
  });

  it('should return true when target open interval is reached and automatically reset count', async () => {
    await PaywallManager.setTargetOpenInterval(3);

    // Open 1 (< 3)
    expect(await PaywallManager.shouldShowPaywall(false)).toBe(false);
    // Open 2 (< 3)
    expect(await PaywallManager.shouldShowPaywall(false)).toBe(false);
    // Open 3 (>= 3) -> should trigger!
    expect(await PaywallManager.shouldShowPaywall(false)).toBe(true);

    // Should have automatically reset the counter to 0!
    const countAfterReset = await PaywallManager.getOpensSinceLastShown();
    expect(countAfterReset).toBe(0);
  });

  it('should not show immediately for new user after markAsNewUser', async () => {
    await PaywallManager.markAsNewUser();
    await PaywallManager.setTargetOpenInterval(4);

    // Open 1 for new user: count becomes 1 (< 4)
    const open1 = await PaywallManager.shouldShowPaywall(false);
    expect(open1).toBe(false);
  });

  it('should record paywall shown and reset opens count', async () => {
    await PaywallManager.setTargetOpenInterval(4);
    await PaywallManager.shouldShowPaywall(false); // open 1
    await PaywallManager.shouldShowPaywall(false); // open 2
    expect(await PaywallManager.getOpensSinceLastShown()).toBe(2);

    await PaywallManager.recordPaywallShown();
    expect(await PaywallManager.getOpensSinceLastShown()).toBe(0);
  });
});
