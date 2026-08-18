import { describe, expect, it } from "vitest";
import { generateTkinterCode } from "@/codegen/generate";
import { parseTkinterCode } from "@/codegen/parse";
import type { Component, EditorState } from "@/types";

/** Ids are internal and regenerated on load, and property insertion order is
 *  not meaningful, so comparisons are made on a canonical form. */
const canon = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canon);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key, entry]) => entry !== undefined && key !== "id")
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, entry]) => [key, canon(entry)])
    );
  }
  return value;
};

const roundTrip = (state: EditorState) =>
  parseTkinterCode(generateTkinterCode(state)).state;

const baseState = (components: Component[]): EditorState => ({
  components,
  selectedId: null,
  windowTitle: "My App",
  windowBackground: "#ffffff",
  canvasWidth: 900,
  canvasHeight: 600,
});

const everyWidget: EditorState = {
  windowTitle: 'Tricky "title" with \\ backslash',
  windowBackground: "#101828",
  canvasWidth: 1024,
  canvasHeight: 640,
  selectedId: null,
  components: [
    {
      id: "a",
      name: "Button",
      x: 0,
      y: 0,
      text: 'Say "hi"\nnow\ttabbed',
      text_color: "#ffffff",
      bg_color: "#3b82f6",
      border_width: 2,
      border_radius: 12,
      border_color: "#1d4ed8",
      font_size: 18,
      enable_hover: false,
      hover_bg_color: "#2563eb",
      width: 200,
      height: 40,
    },
    {
      id: "b",
      name: "Labels",
      x: 980,
      y: 620,
      text: "Ünicode ✓ label",
      text_color: "#000000",
      bg_color: undefined,
      font_size: 22,
      font_family: "Times New Roman",
    },
    {
      id: "c",
      name: "CheckBox",
      x: 40,
      y: 100,
      text: "Accept",
      text_color: "#ff0000",
      bg_color: "#eeeeee",
    },
    {
      id: "d",
      name: "RadioButton",
      x: 40,
      y: 140,
      text: "Option A",
      text_color: "#00ff00",
      bg_color: undefined,
    },
    { id: "e", name: "Entry", x: 300, y: 200 },
    { id: "f", name: "ListBox", x: 300, y: 300 },
  ],
};

describe("editor -> python -> editor", () => {
  it("restores every widget type with its properties, order and position", () => {
    expect(canon(roundTrip(everyWidget))).toEqual(canon(everyWidget));
  });

  it("reports nothing skipped for its own output", () => {
    const { warnings } = parseTkinterCode(generateTkinterCode(everyWidget));
    expect(warnings).toEqual([]);
  });

  it("is stable across repeated trips", () => {
    const once = generateTkinterCode(everyWidget);
    const twice = generateTkinterCode(parseTkinterCode(once).state);
    expect(twice).toBe(once);
  });

  it("assigns a fresh id to every loaded widget", () => {
    const ids = roundTrip(everyWidget).components.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain("a");
  });
});

describe("values that the old generator could not represent", () => {
  it("keeps a cleared background cleared instead of baking in a default", () => {
    const state = baseState([
      { id: "l", name: "Labels", x: 0, y: 0, text: "x", bg_color: undefined },
    ]);
    expect(generateTkinterCode(state)).toContain('fg_color="transparent"');
    expect(roundTrip(state).components[0].bg_color).toBeUndefined();
  });

  it("distinguishes hover off from a hover colour equal to the background", () => {
    const off = baseState([
      {
        id: "b",
        name: "Button",
        x: 0,
        y: 0,
        enable_hover: false,
        bg_color: "#3b82f6",
        hover_bg_color: "#3b82f6",
      },
    ]);
    const on = baseState([{ ...off.components[0], enable_hover: true }]);

    expect(roundTrip(off).components[0].enable_hover).toBe(false);
    expect(roundTrip(on).components[0].enable_hover).toBe(true);
  });

  it("escapes text so a quote or newline still produces importable Python", () => {
    const text = 'He said "go"\\back\nand\ttabbed';
    const state = baseState([{ id: "l", name: "Labels", x: 0, y: 0, text }]);

    const code = generateTkinterCode(state);
    expect(code).not.toContain('text="He said "go"');
    expect(roundTrip(state).components[0].text).toBe(text);
  });

  it("carries the window size through geometry() rather than a fixed default", () => {
    const state = { ...baseState([]), canvasWidth: 1234, canvasHeight: 567 };
    expect(generateTkinterCode(state)).toContain('root.geometry("1234x567")');
    const restored = roundTrip(state);
    expect([restored.canvasWidth, restored.canvasHeight]).toEqual([1234, 567]);
  });

  it("emits one shared click handler no matter how many buttons there are", () => {
    const code = generateTkinterCode(
      baseState([
        { id: "1", name: "Button", x: 0, y: 0 },
        { id: "2", name: "Button", x: 0, y: 40 },
        { id: "3", name: "Button", x: 0, y: 80 },
      ])
    );
    expect(code.match(/def on_button_click\(\):/g)).toHaveLength(1);
  });

  it("omits the handler entirely when there are no buttons", () => {
    const code = generateTkinterCode(
      baseState([{ id: "l", name: "Labels", x: 0, y: 0 }])
    );
    expect(code).not.toContain("on_button_click");
  });
});

describe("ordering", () => {
  it("preserves widget order, which decides stacking on the canvas", () => {
    const state = baseState([
      { id: "1", name: "Labels", x: 0, y: 0, text: "first" },
      { id: "2", name: "Button", x: 0, y: 0, text: "second" },
      { id: "3", name: "Labels", x: 0, y: 0, text: "third" },
    ]);
    expect(roundTrip(state).components.map((c) => c.text)).toEqual([
      "first",
      "second",
      "third",
    ]);
  });
});
