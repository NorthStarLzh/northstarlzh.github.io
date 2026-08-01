// @vitest-environment jsdom

import '@testing-library/jest-dom/vitest';

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  IntroAnimation,
  INTRO_SAFETY_TIMEOUT_MS,
} from '@/features/intro-animation';

interface MotionPreferenceController {
  addEventListener: ReturnType<typeof vi.fn>;
  emit: (matches: boolean) => void;
  listenerCount: () => number;
  removeEventListener: ReturnType<typeof vi.fn>;
}

function installMotionPreference(
  initialMatches: boolean,
): MotionPreferenceController {
  let matches = initialMatches;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  const addEventListener = vi.fn(
    (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
  );
  const removeEventListener = vi.fn(
    (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
  );
  const mediaQuery = {
    get matches() {
      return matches;
    },
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener,
    removeEventListener,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: () => true,
  } as MediaQueryList;

  vi.stubGlobal('matchMedia', vi.fn(() => mediaQuery));

  return {
    addEventListener,
    emit(nextMatches) {
      matches = nextMatches;
      listeners.forEach((listener) =>
        listener({ matches: nextMatches, media: mediaQuery.media } as MediaQueryListEvent),
      );
    },
    listenerCount: () => listeners.size,
    removeEventListener,
  };
}

function setDeviceCapability(name: 'deviceMemory' | 'hardwareConcurrency', value: number) {
  Object.defineProperty(navigator, name, {
    configurable: true,
    value,
  });
}

function finishAnimation(element: HTMLElement) {
  // jsdom has no AnimationEvent constructor, so React selects the WebKit
  // fallback event name during module initialization.
  fireEvent(element, new Event('webkitAnimationEnd', { bubbles: true }));
}

beforeEach(() => {
  vi.useFakeTimers();
  setDeviceCapability('deviceMemory', 8);
  setDeviceCapability('hardwareConcurrency', 8);
});

afterEach(() => {
  cleanup();
  vi.runOnlyPendingTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('IntroAnimation', () => {
  it('plays normally and unmounts the overlay after its own animation ends', () => {
    installMotionPreference(false);
    render(<IntroAnimation />);

    const overlay = screen.getByTestId('intro-animation');
    expect(overlay).toHaveAttribute('data-intro-motion', 'full');

    finishAnimation(overlay);

    expect(screen.queryByTestId('intro-animation')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('uses a reduced fade and can finish without a displacement animation', () => {
    installMotionPreference(true);
    render(<IntroAnimation />);

    const overlay = screen.getByTestId('intro-animation');
    expect(overlay).toHaveAttribute('data-intro-motion', 'reduced');

    finishAnimation(overlay);
    expect(screen.queryByTestId('intro-animation')).not.toBeInTheDocument();
  });

  it('switches to reduced motion if the preference changes while playing', () => {
    const preference = installMotionPreference(false);
    render(<IntroAnimation />);
    expect(screen.getByTestId('intro-animation')).toHaveAttribute(
      'data-intro-motion',
      'full',
    );

    act(() => preference.emit(true));

    expect(screen.getByTestId('intro-animation')).toHaveAttribute(
      'data-intro-motion',
      'reduced',
    );
  });

  it('forces completion at 1000ms when the animation callback is lost', () => {
    installMotionPreference(false);
    render(<IntroAnimation />);
    expect(screen.getByTestId('intro-animation')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(INTRO_SAFETY_TIMEOUT_MS - 1));
    expect(screen.getByTestId('intro-animation')).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByTestId('intro-animation')).not.toBeInTheDocument();
  });

  it('fails open when preference detection throws', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn(() => {
        throw new Error('media query unavailable');
      }),
    );

    render(<IntroAnimation />);

    expect(screen.queryByTestId('intro-animation')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cleans its timeout and media-query listener on unmount', () => {
    const preference = installMotionPreference(false);
    const view = render(<IntroAnimation />);
    expect(preference.listenerCount()).toBe(1);
    expect(vi.getTimerCount()).toBe(1);

    view.unmount();

    expect(preference.listenerCount()).toBe(0);
    expect(preference.removeEventListener).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('plays again after leaving and re-entering the home mount boundary', () => {
    installMotionPreference(false);
    const view = render(<IntroAnimation />);
    finishAnimation(screen.getByTestId('intro-animation'));
    expect(screen.queryByTestId('intro-animation')).not.toBeInTheDocument();

    view.unmount();
    render(<IntroAnimation />);

    expect(screen.getByTestId('intro-animation')).toHaveAttribute(
      'data-intro-motion',
      'full',
    );
  });

  it('does not own or repeat the surrounding home content request', () => {
    installMotionPreference(false);
    const loadContent = vi.fn(() => 'server-rendered home content');

    function HomeHarness() {
      const [content] = useState(loadContent);
      return (
        <>
          <IntroAnimation />
          <main>{content}</main>
        </>
      );
    }

    render(<HomeHarness />);
    finishAnimation(screen.getByTestId('intro-animation'));

    expect(screen.getByRole('main')).toHaveTextContent(
      'server-rendered home content',
    );
    expect(loadContent).toHaveBeenCalledTimes(1);
  });
});
