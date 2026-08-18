import type { Component, EditorState } from "@/types";
import { CODEGEN, TRANSPARENT, type Field } from "@/codegen/schema";

/** Python string literal. Without this, a widget whose text contains a quote,
 *  a backslash or a newline produces a file that will not even import. */
export const pyString = (value: string): string =>
  '"' +
  value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t") +
  '"';

const pyLiteral = (value: string | number): string =>
  typeof value === "number" ? String(value) : pyString(value);

const fieldLiteral = (comp: Component, field: Field): string => {
  const raw = comp[field.prop];
  switch (field.type) {
    case "text":
      return pyString(typeof raw === "string" ? raw : "");
    case "color":
      // undefined background means "inherit the window background"
      return pyString(typeof raw === "string" && raw ? raw : TRANSPARENT);
    case "number":
      return String(typeof raw === "number" ? raw : 0);
    case "bool":
      return raw ? "True" : "False";
  }
};

export const generateTkinterCode = (state: EditorState): string => {
  const {
    components,
    windowTitle,
    windowBackground,
    canvasWidth,
    canvasHeight,
  } = state;

  const lines: string[] = [
    "import tkinter as tk",
    "import customtkinter as ctk",
    "",
    "root = ctk.CTk()",
    `root.title(${pyString(windowTitle)})`,
    `root.geometry(${pyString(`${canvasWidth}x${canvasHeight}`)})`,
    `root.configure(fg_color=${pyString(windowBackground)})`,
    "",
  ];

  // One shared handler rather than a duplicate definition per button.
  if (components.some((c) => c.name === "Button")) {
    lines.push("", "def on_button_click():", '    print("button clicked")', "");
  }

  components.forEach((comp, index) => {
    const spec = CODEGEN[comp.name];
    const varName = `${spec.varPrefix}_${index + 1}`;
    const kwargs: string[] = ["master=root"];

    for (const field of spec.fields) {
      kwargs.push(`${field.kwarg}=${fieldLiteral(comp, field)}`);
    }

    if (spec.font) {
      const family = spec.font.familyProp
        ? comp[spec.font.familyProp] || spec.font.familyFixed
        : spec.font.familyFixed;
      kwargs.push(`font=(${pyString(String(family))}, ${comp.font_size ?? 14})`);
    }

    for (const [kwarg, value] of Object.entries(spec.fixed ?? {})) {
      // "@name" marks a bare identifier (a callback) rather than a string.
      kwargs.push(
        typeof value === "string" && value.startsWith("@")
          ? `${kwarg}=${value.slice(1)}`
          : `${kwarg}=${pyLiteral(value)}`
      );
    }

    lines.push(`${varName} = ${spec.ctor}(`);
    lines.push(...kwargs.map((k) => `    ${k},`));
    lines.push(")");
    lines.push(`${varName}.place(x=${comp.x}, y=${comp.y})`);
    lines.push(...(spec.after?.(varName) ?? []));
    lines.push("");
  });

  lines.push("root.mainloop()", "");
  return lines.join("\n");
};
