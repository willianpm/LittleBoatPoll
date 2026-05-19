import { useEffect } from 'react';

const VIEWPORT_VAR = '--app-dvh';

function getViewportHeight() {
  if (typeof window === 'undefined') {
    return 0;
  }

  const visualHeight = window.visualViewport?.height;
  if (typeof visualHeight === 'number' && visualHeight > 0) {
    return visualHeight;
  }

  return window.innerHeight;
}

function setViewportHeightVar(height: number) {
  if (typeof document === 'undefined') {
    return;
  }

  const nextHeight = Math.round(height);
  if (!Number.isFinite(nextHeight) || nextHeight <= 0) {
    return;
  }

  document.documentElement.style.setProperty(VIEWPORT_VAR, `${nextHeight}px`);
}

export function useViewportHeight() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    let frameId: number | null = null;
    let timeoutId: number | null = null;

    const scheduleUpdate = () => {
      const update = () => setViewportHeightVar(getViewportHeight());

      update();

      if (typeof window.requestAnimationFrame === 'function') {
        if (frameId !== null) {
          window.cancelAnimationFrame(frameId);
        }
        frameId = window.requestAnimationFrame(update);
      }

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
      timeoutId = window.setTimeout(update, 250);
    };

    scheduleUpdate();

    const viewport = window.visualViewport;

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('orientationchange', scheduleUpdate);
    window.addEventListener('focusin', scheduleUpdate);
    window.addEventListener('focusout', scheduleUpdate);

    viewport?.addEventListener('resize', scheduleUpdate);
    viewport?.addEventListener('scroll', scheduleUpdate);

    return () => {
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      window.removeEventListener('focusin', scheduleUpdate);
      window.removeEventListener('focusout', scheduleUpdate);

      viewport?.removeEventListener('resize', scheduleUpdate);
      viewport?.removeEventListener('scroll', scheduleUpdate);

      if (frameId !== null && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(frameId);
      }
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);
}

export { getViewportHeight, setViewportHeightVar };
