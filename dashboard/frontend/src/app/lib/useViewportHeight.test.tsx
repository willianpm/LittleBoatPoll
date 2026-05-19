import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { useViewportHeight } from './useViewportHeight';

function TestComponent() {
  useViewportHeight();
  return null;
}

function setVisualViewport(value: VisualViewport | undefined) {
  if (value === undefined) {
    delete (window as { visualViewport?: VisualViewport }).visualViewport;
    return;
  }

  Object.defineProperty(window, 'visualViewport', {
    value,
    configurable: true,
    writable: true,
  });
}

describe('useViewportHeight', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--app-dvh');
    setVisualViewport(undefined);
  });

  it('sets the css var using visualViewport height when available', async () => {
    const addEventListener = jest.fn();
    const removeEventListener = jest.fn();

    setVisualViewport({
      height: 500,
      offsetLeft: 0,
      offsetTop: 0,
      pageLeft: 0,
      pageTop: 0,
      scale: 1,
      width: 300,
      addEventListener,
      removeEventListener,
      dispatchEvent: () => true,
    } as VisualViewport);

    render(<TestComponent />);

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--app-dvh')).toBe('500px');
    });

    expect(addEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(removeEventListener).not.toHaveBeenCalled();
  });

  it('falls back to window.innerHeight when visualViewport is missing', async () => {
    setVisualViewport(undefined);

    Object.defineProperty(window, 'innerHeight', {
      value: 720,
      configurable: true,
    });

    render(<TestComponent />);

    await waitFor(() => {
      expect(document.documentElement.style.getPropertyValue('--app-dvh')).toBe('720px');
    });
  });
});
