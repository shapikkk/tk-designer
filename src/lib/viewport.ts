export const WINDOW_SNAP = 20;

export const MIN_WINDOW_WIDTH = 640;
export const MAX_WINDOW_WIDTH = 1920;
export const MIN_WINDOW_HEIGHT = 480;
export const MAX_WINDOW_HEIGHT = 1200;

export const WIDTH_RATIO = 0.75;
export const HEIGHT_RATIO = 0.75;

export interface WindowSize {
  width: number;
  height: number;
}

export const FALLBACK_WINDOW: WindowSize = { width: 900, height: 600 };

const snap = (value: number) =>
  Math.round(value / WINDOW_SNAP) * WINDOW_SNAP;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const windowSizeFor = (
  viewportWidth: number,
  viewportHeight: number
): WindowSize => ({
  width: clamp(
    snap(viewportWidth * WIDTH_RATIO),
    MIN_WINDOW_WIDTH,
    MAX_WINDOW_WIDTH
  ),
  height: clamp(
    snap(viewportHeight * HEIGHT_RATIO),
    MIN_WINDOW_HEIGHT,
    MAX_WINDOW_HEIGHT
  ),
});

export const viewportWindowSize = (): WindowSize =>
  typeof window === "undefined"
    ? FALLBACK_WINDOW
    : windowSizeFor(window.innerWidth, window.innerHeight);
