// ─── Type stubs for packages without bundled type declarations ────────────────

/**
 * react-native-worklets-core is a native module used by react-native-vision-camera
 * for running JS functions on the UI/camera Worklet thread.
 * It does not ship its own TypeScript declarations, so we declare a stub here.
 */
declare module 'react-native-worklets-core' {
  /**
   * Wraps a regular JS function so it can be safely called from a Worklet
   * running on a background thread (e.g. a Vision Camera frame processor).
   */
  export function useRunOnJS<T extends (...args: any[]) => any>(
    fn: T,
    deps: React.DependencyList
  ): T;
}
