import { describe, expect, it } from 'vitest';

import {
  INITIAL_INTRO_ANIMATION_STATE,
  introAnimationReducer,
  shouldReduceIntroMotion,
} from '@/features/intro-animation';

describe('introAnimationReducer', () => {
  it('moves from preference detection through the normal animation to complete', () => {
    const playing = introAnimationReducer(INITIAL_INTRO_ANIMATION_STATE, {
      type: 'preference-detected',
      reduceMotion: false,
    });
    expect(playing).toEqual({ status: 'playing' });

    expect(
      introAnimationReducer(playing, { type: 'animation-ended' }),
    ).toEqual({ status: 'complete' });
  });

  it('uses the reduced path when the detected preference requires it', () => {
    const reduced = introAnimationReducer(INITIAL_INTRO_ANIMATION_STATE, {
      type: 'preference-detected',
      reduceMotion: true,
    });
    expect(reduced).toEqual({ status: 'reduced' });

    expect(
      introAnimationReducer(reduced, { type: 'animation-ended' }),
    ).toEqual({ status: 'complete' });
  });

  it('switches a running animation to the reduced path when the preference changes', () => {
    expect(
      introAnimationReducer(
        { status: 'playing' },
        { type: 'reduce-motion' },
      ),
    ).toEqual({ status: 'reduced' });
  });

  it.each(['safety-timeout', 'failed'] as const)(
    'completes from every active state after %s',
    (type) => {
      for (const status of [
        'detect-preference',
        'playing',
        'reduced',
      ] as const) {
        expect(introAnimationReducer({ status }, { type })).toEqual({
          status: 'complete',
        });
      }
    },
  );

  it('ignores late events after completion', () => {
    const complete = { status: 'complete' } as const;
    expect(
      introAnimationReducer(complete, {
        type: 'preference-detected',
        reduceMotion: false,
      }),
    ).toBe(complete);
  });
});

describe('shouldReduceIntroMotion', () => {
  it('honors the operating-system preference', () => {
    expect(
      shouldReduceIntroMotion(true, {
        deviceMemory: 16,
        hardwareConcurrency: 12,
      }),
    ).toBe(true);
  });

  it('degrades on devices with constrained memory or CPU capacity', () => {
    expect(
      shouldReduceIntroMotion(false, {
        deviceMemory: 2,
        hardwareConcurrency: 8,
      }),
    ).toBe(true);
    expect(
      shouldReduceIntroMotion(false, {
        deviceMemory: 8,
        hardwareConcurrency: 2,
      }),
    ).toBe(true);
  });

  it('keeps the full animation when no low-capability signal exists', () => {
    expect(
      shouldReduceIntroMotion(false, {
        deviceMemory: 8,
        hardwareConcurrency: 8,
      }),
    ).toBe(false);
    expect(shouldReduceIntroMotion(false)).toBe(false);
  });
});
