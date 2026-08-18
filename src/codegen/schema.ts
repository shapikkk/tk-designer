import type { Component, WidgetKind } from "@/types";

export type FieldType = "text" | "color" | "number" | "bool";

export interface Field {
  prop: keyof Component;
  kwarg: string;
  type: FieldType;
}

export interface WidgetCodegen {
  /** Constructor written to the file. Parsing matches on the last segment, so
   *  `from customtkinter import *` style files still load. */
  ctor: string;
  varPrefix: string;
  /** Editor properties that survive a round-trip through the file. */
  fields: Field[];
  /** Emitted as `font=(family, size)`. `familyProp` is only set for widgets
   *  whose family the editor actually models; otherwise the family is fixed
   *  and the parser reads the size alone. */
  font?: { familyProp?: "font_family"; familyFixed: string };
  /** Kwargs the widget needs to look right but the editor does not model. */
  fixed?: Record<string, string | number>;
  /** Statements appended after `.place()`. */
  after?: (varName: string) => string[];
}

export const CODEGEN: Record<WidgetKind, WidgetCodegen> = {
  Button: {
    ctor: "ctk.CTkButton",
    varPrefix: "button",
    fields: [
      { prop: "text", kwarg: "text", type: "text" },
      { prop: "text_color", kwarg: "text_color", type: "color" },
      { prop: "bg_color", kwarg: "fg_color", type: "color" },
      { prop: "enable_hover", kwarg: "hover", type: "bool" },
      { prop: "hover_bg_color", kwarg: "hover_color", type: "color" },
      { prop: "border_width", kwarg: "border_width", type: "number" },
      { prop: "border_color", kwarg: "border_color", type: "color" },
      { prop: "border_radius", kwarg: "corner_radius", type: "number" },
      { prop: "width", kwarg: "width", type: "number" },
      { prop: "height", kwarg: "height", type: "number" },
    ],
    font: { familyFixed: "Arial" },
    fixed: { command: "@on_button_click" },
  },

  Labels: {
    ctor: "ctk.CTkLabel",
    varPrefix: "label",
    fields: [
      { prop: "text", kwarg: "text", type: "text" },
      { prop: "text_color", kwarg: "text_color", type: "color" },
      { prop: "bg_color", kwarg: "fg_color", type: "color" },
    ],
    font: { familyProp: "font_family", familyFixed: "Arial" },
  },

  CheckBox: {
    ctor: "ctk.CTkCheckBox",
    varPrefix: "checkbox",
    fields: [
      { prop: "text", kwarg: "text", type: "text" },
      { prop: "text_color", kwarg: "text_color", type: "color" },
      { prop: "bg_color", kwarg: "bg_color", type: "color" },
    ],
    fixed: { fg_color: "#3b82f6", border_color: "#d1d5db" },
  },

  RadioButton: {
    ctor: "ctk.CTkRadioButton",
    varPrefix: "radiobutton",
    fields: [
      { prop: "text", kwarg: "text", type: "text" },
      { prop: "text_color", kwarg: "text_color", type: "color" },
      { prop: "bg_color", kwarg: "bg_color", type: "color" },
    ],
    fixed: { fg_color: "#3b82f6", border_color: "#d1d5db" },
  },

  Entry: {
    ctor: "ctk.CTkEntry",
    varPrefix: "entry",
    fields: [],
    fixed: {
      fg_color: "#ffffff",
      text_color: "#000000",
      border_color: "#d1d5db",
      corner_radius: 6,
      width: 140,
      height: 28,
    },
  },

  ListBox: {
    ctor: "tk.Listbox",
    varPrefix: "listbox",
    fields: [],
    fixed: {
      height: 5,
      width: 15,
      bg: "#ffffff",
      fg: "#000000",
      highlightthickness: 1,
      highlightcolor: "#d1d5db",
      highlightbackground: "#d1d5db",
    },
    after: (v) => [`${v}.insert(tk.END, "Item 1", "Item 2", "Item 3")`],
  },
};

/** Reverse lookup used by the parser: last segment of the ctor -> widget kind. */
export const CTOR_TO_KIND: Record<string, WidgetKind> = Object.fromEntries(
  (Object.entries(CODEGEN) as [WidgetKind, WidgetCodegen][]).map(
    ([kind, spec]) => [spec.ctor.split(".").pop() as string, kind]
  )
);

/** An unset background means "inherit the window", which CustomTkinter spells
 *  `transparent`. Keeping the sentinel in one place keeps both directions honest. */
export const TRANSPARENT = "transparent";
