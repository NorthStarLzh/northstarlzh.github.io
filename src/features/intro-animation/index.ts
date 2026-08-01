export { IntroAnimation } from './intro-animation';
export {
  INITIAL_INTRO_ANIMATION_STATE,
  INTRO_REDUCED_DURATION_MS,
  INTRO_SAFETY_TIMEOUT_MS,
  introAnimationReducer,
  shouldReduceIntroMotion,
} from './intro-animation-state';
export type {
  IntroAnimationEvent,
  IntroAnimationState,
  IntroAnimationStatus,
} from './intro-animation-state';
