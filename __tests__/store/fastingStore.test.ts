import { useFastingStore } from '../../store/fastingStore';

describe('useFastingStore', () => {
  beforeEach(() => {
    useFastingStore.setState({
      isFasting: false,
      protocol: '16:8',
      targetHours: 16,
      startTime: null,
      history: [],
    });
  });

  it('initializes with default values', () => {
    const state = useFastingStore.getState();
    expect(state.isFasting).toBe(false);
    expect(state.protocol).toBe('16:8');
    expect(state.targetHours).toBe(16);
  });

  it('starts a fast correctly', () => {
    const { startFast } = useFastingStore.getState();
    startFast('18:6');

    const state = useFastingStore.getState();
    expect(state.isFasting).toBe(true);
    expect(state.protocol).toBe('18:6');
    expect(state.targetHours).toBe(18);
    expect(state.startTime).toBeDefined();
  });

  it('cancels an active fast', () => {
    const { startFast, cancelFast } = useFastingStore.getState();
    startFast('16:8');
    cancelFast();

    const state = useFastingStore.getState();
    expect(state.isFasting).toBe(false);
    expect(state.startTime).toBeNull();
  });

  it('ends a fast and appends to history', () => {
    const { startFast, endFast } = useFastingStore.getState();
    startFast('14:10');
    endFast();

    const state = useFastingStore.getState();
    expect(state.isFasting).toBe(false);
    expect(state.history.length).toBe(1);
    expect(state.history[0].protocol).toBe('14:10');
  });
});
