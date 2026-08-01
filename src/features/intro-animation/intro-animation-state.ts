export const INTRO_SAFETY_TIMEOUT_MS = 1_000;
export const INTRO_REDUCED_DURATION_MS = 120;

export type IntroAnimationStatus =
  | 'detect-preference'
  | 'playing'
  | 'reduced'
  | 'complete';

export interface IntroAnimationState {
  status: IntroAnimationStatus;
}

export type IntroAnimationEvent =
  | { type: 'preference-detected'; reduceMotion: boolean }
  | { type: 'reduce-motion' }
  | { type: 'animation-ended' }
  | { type: 'safety-timeout' }
  | { type: 'failed' };

export const INITIAL_INTRO_ANIMATION_STATE: IntroAnimationState = {
  status: 'detect-preference',
};

export function introAnimationReducer(
  state: IntroAnimationState,
  event: IntroAnimationEvent,
): IntroAnimationState {
  if (state.status === 'complete') return state;

  switch (event.type) {
    case 'preference-detected':
      if (state.status !== 'detect-preference') return state;
      return { status: event.reduceMotion ? 'reduced' : 'playing' };
    case 'reduce-motion':
      return state.status === 'playing' ? { status: 'reduced' } : state;
    case 'animation-ended':
      return state.status === 'playing' || state.status === 'reduced'
        ? { status: 'complete' }
        : state;
    case 'safety-timeout':
    case 'failed':
      return { status: 'complete' };
  }
}

interface DeviceCapabilities {
  deviceMemory?: number;
  hardwareConcurrency?: number;
}

export function shouldReduceIntroMotion(
  prefersReducedMotion: boolean,
  capabilities: DeviceCapabilities = {},
): boolean {
  if (prefersReducedMotion) return true;

  const hasLowMemory =
    typeof capabilities.deviceMemory === 'number' &&
    capabilities.deviceMemory <= 2;
  const hasFewCpuCores =
    typeof capabilities.hardwareConcurrency === 'number' &&
    capabilities.hardwareConcurrency <= 2;

  return hasLowMemory || hasFewCpuCores;
}
