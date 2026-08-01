/** @vitest-environment jsdom */

import '@testing-library/jest-dom/vitest';

import {act, cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import {LightboxAdapter} from '@/features/photography/lightbox-adapter';
import type {PhotoViewerLabels} from '@/features/photography';
import {createPhoto, localized} from '@fixtures/domain';

const labels: PhotoViewerLabels = {
  viewerTitle: 'Photography viewer',
  loading: 'Loading viewer…',
  close: 'Close',
  previous: 'Previous',
  next: 'Next',
  zoomIn: 'Zoom in',
  zoomOut: 'Zoom out',
  unavailable: 'The photo viewer is temporarily unavailable',
};

const photos = [
  createPhoto('first', ['landscape'], {
    shotAt: '2024-01',
    city: localized('杭州', 'Hangzhou'),
    description: localized('中文一', 'English first'),
  }),
  createPhoto('second', ['landscape'], {
    shotAt: '2025-02',
    city: localized('上海', 'Shanghai'),
    description: localized('中文二', 'English second'),
  }),
  createPhoto('third', ['landscape'], {
    shotAt: '2026-03',
    city: localized('北京', 'Beijing'),
    description: localized('中文三', 'English third'),
  }),
];

beforeEach(() => {
  class PointerEventStub extends MouseEvent {
    pointerId: number;
    pointerType: string;

    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
      this.pointerType = init.pointerType ?? '';
    }
  }
  class ResizeObserverStub {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('PointerEvent', PointerEventStub);
  vi.stubGlobal('ResizeObserver', ResizeObserverStub);
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 1000,
    height: 700,
    x: 0,
    y: 0,
    top: 0,
    left: 0,
    right: 1000,
    bottom: 700,
    toJSON: () => ({}),
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('LightboxAdapter', () => {
  it.each([
    ['phone', 390],
    ['tablet', 820],
    ['desktop', 1440],
  ])('continuously browses and closes with visible controls at the %s viewport', async (_device, width) => {
    Object.defineProperty(window, 'innerWidth', {configurable: true, value: width});
    const onClose = vi.fn();
    const onView = vi.fn();
    render(
      <LightboxAdapter
        activeId="second"
        labels={labels}
        locale="en"
        onClose={onClose}
        onView={onView}
        photos={photos}
      />,
    );

    await userEvent.click(await screen.findByRole('button', {name: 'Next'}));
    await waitFor(() => expect(onView).toHaveBeenCalledWith('third'));
    await userEvent.click(screen.getByRole('button', {name: 'Previous'}));
    await waitFor(() => expect(onView).toHaveBeenCalledWith('second'));
    await userEvent.click(screen.getByRole('button', {name: 'Close'}));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('shows localized metadata and follows keyboard navigation and Escape', async () => {
    const onClose = vi.fn();
    const onView = vi.fn();
    render(
      <LightboxAdapter
        activeId="first"
        labels={labels}
        locale="en"
        onClose={onClose}
        onView={onView}
        photos={photos}
      />,
    );

    expect(await screen.findByText(/2024-01/)).toBeInTheDocument();
    expect(screen.getByText(/Hangzhou/)).toBeInTheDocument();
    expect(screen.getByText('English first')).toBeInTheDocument();

    const controller = document.querySelector('.yarl__container');
    expect(controller).not.toBeNull();
    fireEvent.keyDown(controller!, {key: 'ArrowRight'});
    await waitFor(() => expect(onView).toHaveBeenCalledWith('second'));
    expect(await screen.findByText(/2025-02/)).toBeInTheDocument();
    expect(screen.getByText(/Shanghai/)).toBeInTheDocument();
    expect(screen.getByText('English second')).toBeInTheDocument();
    fireEvent.keyDown(controller!, {key: 'Escape'});
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('supports zoom controls and only requests one prefetch per loaded tail', async () => {
    const onNearEnd = vi.fn();
    render(
      <LightboxAdapter
        activeId="first"
        labels={labels}
        locale="zh"
        onClose={() => undefined}
        onNearEnd={onNearEnd}
        onView={() => undefined}
        photos={photos}
      />,
    );

    await userEvent.click(await screen.findByRole('button', {name: 'Zoom in'}));
    expect(await screen.findByRole('button', {name: 'Zoom out'})).toBeInTheDocument();

    const controller = document.querySelector('.yarl__container');
    expect(controller).not.toBeNull();
    fireEvent.keyDown(controller!, {key: 'ArrowRight'});
    await waitFor(() => expect(onNearEnd).toHaveBeenCalledTimes(1));
    fireEvent.keyDown(controller!, {key: 'ArrowRight'});
    await act(async () => undefined);
    expect(onNearEnd).toHaveBeenCalledTimes(1);
  });

  it('changes photos with a leftward touch swipe', async () => {
    const onView = vi.fn();
    render(
      <LightboxAdapter
        activeId="first"
        labels={labels}
        locale="zh"
        onClose={() => undefined}
        onView={onView}
        photos={photos}
      />,
    );
    const controller = document.querySelector('.yarl__container');
    expect(controller).not.toBeNull();

    fireEvent.pointerDown(controller!, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 800,
      clientY: 300,
      buttons: 1,
    });
    fireEvent.pointerMove(controller!, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 200,
      clientY: 300,
      buttons: 1,
    });
    fireEvent.pointerMove(controller!, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 50,
      clientY: 300,
      buttons: 1,
    });
    fireEvent.pointerUp(controller!, {
      pointerId: 1,
      pointerType: 'touch',
      clientX: 200,
      clientY: 300,
    });

    await waitFor(() => expect(onView).toHaveBeenCalledWith('second'));
  });

  it('closes from the safe backdrop but not from the image or caption', async () => {
    const onClose = vi.fn();
    render(
      <LightboxAdapter
        activeId="first"
        labels={labels}
        locale="en"
        onClose={onClose}
        onView={() => undefined}
        photos={photos}
      />,
    );

    const backdrop = document.querySelector('.yarl__slide_current');
    expect(backdrop).not.toBeNull();
    fireEvent.click(screen.getByText('English first'));
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.pointerDown(backdrop!, {pointerId: 1, pointerType: 'mouse'});
    fireEvent.pointerUp(backdrop!, {pointerId: 1, pointerType: 'mouse'});
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
