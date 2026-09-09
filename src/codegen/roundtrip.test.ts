import { describe, expect, it } from "vitest";
import { generateCode } from "@/codegen/generate";
import { parsePythonCode } from "@/codegen/parse";
import { FRAMEWORKS, FRAMEWORK_IDS, defaultProps } from "@/frameworks";
import type { FrameworkId } from "@/frameworks/types";
import { emptyDoc } from "@/state/editorReducer";
import type { Component, EditorState, FrameworkDoc } from "@/types";
import { emptyDocs } from "@/state/editorReducer";

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

const stateOf = (framework: FrameworkId, doc: FrameworkDoc): EditorState => ({
  framework,
  docs: { ...emptyDocs(), [framework]: doc },
});

const docWith = (
  framework: FrameworkId,
  components: Component[]
): FrameworkDoc => ({
  ...emptyDoc(framework),
  windowTitle: "Round trip",
  windowBackground: "#101010",
  canvasWidth: 800,
  canvasHeight: 500,
  components,
});

const everyWidget = (framework: FrameworkId): Component[] =>
  FRAMEWORKS[framework].widgets.map((widget, index) => ({
    id: `id-${index}`,
    kind: widget.key,
    x: 20 * index,
    y: 40 + 10 * index,
    props: defaultProps(widget),
  }));

const roundTrip = (framework: FrameworkId, doc: FrameworkDoc) =>
  parsePythonCode(generateCode(stateOf(framework, doc)));

describe.each(FRAMEWORK_IDS)("%s: editor -> python -> editor", (framework) => {
  const doc = docWith(framework, everyWidget(framework));

  it("keeps the framework it was generated for", () => {
    expect(roundTrip(framework, doc).framework).toBe(framework);
  });

  it("restores every widget with its properties, order and position", () => {
    expect(canon(roundTrip(framework, doc).doc)).toEqual(canon(doc));
  });

  it("reports nothing skipped for its own output", () => {
    expect(roundTrip(framework, doc).warnings).toEqual([]);
  });

  it("is stable across repeated trips", () => {
    const once = roundTrip(framework, doc).doc;
    const twice = roundTrip(framework, once).doc;
    expect(canon(twice)).toEqual(canon(once));
  });

  it("regenerates ids and never restores a selection", () => {
    const result = roundTrip(framework, doc).doc;
    expect(result.selectedId).toBeNull();
    for (const component of result.components) {
      expect(component.id).not.toBe("id-0");
      expect(component.id.length).toBeGreaterThan(10);
    }
  });

  it("keeps the window settings", () => {
    const result = roundTrip(framework, doc).doc;
    expect(result.windowTitle).toBe("Round trip");
    expect(result.windowBackground).toBe("#101010");
    expect(result.canvasWidth).toBe(800);
    expect(result.canvasHeight).toBe(500);
  });

  it("survives a document with no widgets", () => {
    const empty = docWith(framework, []);
    expect(canon(roundTrip(framework, empty).doc)).toEqual(canon(empty));
  });
});

describe("customised properties", () => {
  it("carries tkinter text, colours, relief and char sizing", () => {
    const doc = docWith("tkinter", [
      {
        id: "a",
        kind: "Button",
        x: 40,
        y: 60,
        props: {
          text: 'Say "hi"\n\\ ok',
          fg: "#123456",
          bg: "#abcdef",
          relief: "groove",
          borderwidth: 4,
          width: 18,
          height: 3,
          font_family: "Courier New",
          font_size: 22,
          font_weight: "bold",
          state: "disabled",
        },
      },
    ]);
    expect(canon(roundTrip("tkinter", doc).doc)).toEqual(canon(doc));
  });

  it("carries customtkinter colours, radius and hover", () => {
    const doc = docWith("customtkinter", [
      {
        id: "a",
        kind: "CTkButton",
        x: 20,
        y: 20,
        props: {
          text: "Sign in",
          text_color: "#ffffff",
          fg_color: "#ef4444",
          hover: false,
          hover_color: "#b91c1c",
          border_width: 3,
          border_color: "#111111",
          corner_radius: 18,
          width: 200,
          height: 44,
          font_family: "Verdana",
          font_size: 18,
          font_weight: "bold",
        },
      },
    ]);
    expect(canon(roundTrip("customtkinter", doc).doc)).toEqual(canon(doc));
  });

  it("carries flet enums, booleans and dropdown options", () => {
    const doc = docWith("flet", [
      {
        id: "a",
        kind: "Text",
        x: 10,
        y: 10,
        props: {
          value: "Heading",
          size: 32,
          weight: "w_900",
          italic: true,
          text_align: "center",
          color: "#0f172a",
        },
      },
      {
        id: "b",
        kind: "Dropdown",
        x: 10,
        y: 80,
        props: {
          label: "Country",
          options: ["Poland", "Ukraine", "Germany"],
          border_radius: 12,
          width: 300,
        },
      },
      {
        id: "c",
        kind: "IconButton",
        x: 10,
        y: 160,
        props: { icon: "delete", icon_color: "#dc2626", icon_size: 30 },
      },
    ]);
    expect(canon(roundTrip("flet", doc).doc)).toEqual(canon(doc));
  });

  it("keeps a cleared customtkinter colour cleared", () => {
    const doc = docWith("customtkinter", [
      {
        id: "a",
        kind: "CTkButton",
        x: 0,
        y: 0,
        props: { text: "Ghost", text_color: "#000000" },
      },
    ]);
    const result = roundTrip("customtkinter", doc).doc;
    expect(generateCode(stateOf("customtkinter", doc))).toContain(
      'fg_color="transparent"'
    );
    expect(result.components[0].props.fg_color).toBeUndefined();
  });

  it("keeps tkinter listbox items", () => {
    const doc = docWith("tkinter", [
      {
        id: "a",
        kind: "Listbox",
        x: 0,
        y: 0,
        props: { items: ["Alpha", "Beta"], bg: "#ffffff" },
      },
    ]);
    const result = roundTrip("tkinter", doc).doc;
    expect(result.components[0].props.items).toEqual(["Alpha", "Beta"]);
  });
});
