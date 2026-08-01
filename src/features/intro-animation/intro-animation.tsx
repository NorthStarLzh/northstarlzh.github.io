'use client';

import { type AnimationEvent, useEffect, useReducer, useRef } from 'react';

import styles from './intro-animation.module.css';
import {
  INITIAL_INTRO_ANIMATION_STATE,
  INTRO_SAFETY_TIMEOUT_MS,
  introAnimationReducer,
  shouldReduceIntroMotion,
} from './intro-animation-state';

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

interface NavigatorWithDeviceMemory extends Navigator {
  readonly deviceMemory?: number;
}

function removeMediaQueryListener(
  mediaQuery: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
) {
  if (typeof mediaQuery.removeEventListener === 'function') {
    mediaQuery.removeEventListener('change', listener);
    return;
  }

  mediaQuery.removeListener(listener);
}

function addMediaQueryListener(
  mediaQuery: MediaQueryList,
  listener: (event: MediaQueryListEvent) => void,
) {
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
    return;
  }

  mediaQuery.addListener(listener);
}

export function IntroAnimation() {
  const [state, dispatch] = useReducer(
    introAnimationReducer,
    INITIAL_INTRO_ANIMATION_STATE,
  );
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    safetyTimer.current = setTimeout(() => {
      safetyTimer.current = null;
      dispatch({ type: 'safety-timeout' });
    }, INTRO_SAFETY_TIMEOUT_MS);

    return () => {
      if (safetyTimer.current !== null) clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    };
  }, []);

  useEffect(() => {
    if (state.status === 'complete') {
      if (safetyTimer.current !== null) clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
      return;
    }

    if (typeof window.matchMedia !== 'function') {
      dispatch({ type: 'failed' });
      return;
    }

    let mediaQuery: MediaQueryList;
    try {
      mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
    } catch {
      dispatch({ type: 'failed' });
      return;
    }

    const listener = (event: MediaQueryListEvent) => {
      if (event.matches) dispatch({ type: 'reduce-motion' });
    };

    addMediaQueryListener(mediaQuery, listener);

    if (state.status === 'detect-preference') {
      const device = navigator as NavigatorWithDeviceMemory;
      dispatch({
        type: 'preference-detected',
        reduceMotion: shouldReduceIntroMotion(mediaQuery.matches, {
          deviceMemory: device.deviceMemory,
          hardwareConcurrency: device.hardwareConcurrency,
        }),
      });
    }

    return () => removeMediaQueryListener(mediaQuery, listener);
  }, [state.status]);

  if (
    state.status === 'detect-preference' ||
    state.status === 'complete'
  ) {
    return null;
  }

  const reduced = state.status === 'reduced';
  const className = reduced ? `${styles.overlay} ${styles.reduced}` : styles.overlay;

  const handleAnimationEnd = (event: AnimationEvent<HTMLDivElement>) => {
    event.stopPropagation();
    dispatch({ type: 'animation-ended' });
  };

  return (
    <div
      aria-hidden="true"
      className={className}
      data-intro-motion={reduced ? 'reduced' : 'full'}
      data-testid="intro-animation"
      onAnimationEnd={handleAnimationEnd}
    >
      <div className={styles.mark}>
        <span className={styles.line} />
        <span>风花诗酒茶</span>
      </div>
    </div>
  );
}
