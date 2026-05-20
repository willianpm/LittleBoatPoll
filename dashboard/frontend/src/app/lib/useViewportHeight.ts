import { useEffect } from 'react';

const VIEWPORT_VAR = '--app-dvh';
const VIEWPORT_OFFSET_VAR = '--app-vv-offset-top';

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

function getViewportOffsetTop() {
  if (typeof window === 'undefined') {
    return 0;
  }

  const offsetTop = window.visualViewport?.offsetTop;
  if (typeof offsetTop === 'number' && Number.isFinite(offsetTop)) {
    return offsetTop;
  }

  return 0;
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

function setViewportOffsetVar(offsetTop: number) {
  if (typeof document === 'undefined') {
    return;
  }

  const nextOffset = Math.max(0, Math.round(offsetTop));
  if (!Number.isFinite(nextOffset)) {
    return;
  }

  document.documentElement.style.setProperty(VIEWPORT_OFFSET_VAR, `${nextOffset}px`);
}

export function useViewportHeight() {
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }

    let frameId: number | null = null;
    let timeoutId: number | null = null;
    let scrollRoot: HTMLElement | null = null;

    const getScrollRoot = () => {
      if (scrollRoot?.isConnected) {
        return scrollRoot;
      }

      scrollRoot = document.querySelector<HTMLElement>('[data-viewport-scroll-root]');
      return scrollRoot;
    };

    const clampScrollPosition = () => {
      const root = getScrollRoot();
      if (!root) {
        return;
      }

      const maxScrollTop = Math.max(0, root.scrollHeight - root.clientHeight);
      if (root.scrollTop > maxScrollTop) {
        root.scrollTop = maxScrollTop;
      }
    };

    const scheduleUpdate = () => {
      const update = () => {
        setViewportHeightVar(getViewportHeight());
        setViewportOffsetVar(getViewportOffsetTop());
        clampScrollPosition();
      };

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
