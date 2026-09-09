import { describe, expect, it } from "vitest";
import {
  MAX_WINDOW_HEIGHT,
  MAX_WINDOW_WIDTH,
  MIN_WINDOW_HEIGHT,
  MIN_WINDOW_WIDTH,
  WINDOW_SNAP,
  windowSizeFor,
} from "@/lib/viewport";

describe("window size from the viewport", () => {
  it("gives a desktop screen a roomy window", () => {
    expect(windowSizeFor(1920, 1000)).toEqual({ width: 1440, height: 760 });
  });

  it("scales down with the viewport", () => {
    const laptop = windowSizeFor(1440, 800);
    const desktop = windowSizeFor(1920, 1000);
    expect(laptop.width).toBeLessThan(desktop.width);
    expect(laptop.height).toBeLessThan(desktop.height);
  });

  it("never returns a window too small to design in", () => {
    const phone = windowSizeFor(390, 844);
    expect(phone.width).toBe(MIN_WINDOW_WIDTH);
    expect(phone.height).toBeGreaterThanOrEqual(MIN_WINDOW_HEIGHT);
  });

  it("caps the window on very large screens", () => {
    const wall = windowSizeFor(5120, 2880);
    expect(wall.width).toBe(MAX_WINDOW_WIDTH);
    expect(wall.height).toBe(MAX_WINDOW_HEIGHT);
  });

  it("snaps to the canvas grid so widgets line up", () => {
    for (const width of [320, 768, 1024, 1366, 1512, 2560]) {
      const size = windowSizeFor(width, width);
      expect(size.width % WINDOW_SNAP).toBe(0);
      expect(size.height % WINDOW_SNAP).toBe(0);
    }
  });
});
