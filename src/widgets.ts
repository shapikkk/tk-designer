import {
  CircleDot,
  List,
  RectangleHorizontal,
  SquareCheck,
  TextCursorInput,
  Type,
  type LucideIcon,
} from "lucide-react";
import type { Component, WidgetKind } from "@/types";

export type EditableProp =
  | "text"
  | "text_color"
  | "bg_color"
  | "width"
  | "height"
  | "border_width"
  | "border_radius"
  | "border_color"
  | "font_size"
  | "font_family"
  | "enable_hover"
  | "hover_bg_color";

interface WidgetSpec {
  /** Label shown in the widget palette. */
  label: string;
  /** Palette icon. One library, one stroke weight, across the whole app. */
  icon: LucideIcon;
  /** Applied when the widget is first dropped on the canvas. */
  defaults: Omit<Partial<Component>, "id" | "name" | "x" | "y">;
  /** Which properties the Properties panel offers for this widget. */
  editable: EditableProp[];
}

export const WIDGETS: Record<WidgetKind, WidgetSpec> = {
  Labels: {
    label: "Label",
    icon: Type,
    defaults: {
      text: "Label",
      text_color: "#000000",
      font_size: 14,
      font_family: "Arial",
    },
    editable: ["text", "text_color", "bg_color", "font_family", "font_size"],
  },
  Button: {
    label: "Button",
    icon: RectangleHorizontal,
    defaults: {
      text: "Button",
      width: 140,
      height: 28,
      text_color: "#ffffff",
      bg_color: "#3b82f6",
      border_width: 0,
      border_radius: 6,
      border_color: "#3b82f6",
      font_size: 14,
      enable_hover: true,
      hover_bg_color: "#2563eb",
    },
    editable: [
      "text",
      "text_color",
      "bg_color",
      "border_width",
      "border_radius",
      "border_color",
      "font_size",
      "enable_hover",
      "hover_bg_color",
      "width",
      "height",
    ],
  },
  CheckBox: {
    label: "CheckBox",
    icon: SquareCheck,
    defaults: { text: "CheckBox", text_color: "#000000" },
    editable: ["text", "text_color", "bg_color"],
  },
  RadioButton: {
    label: "RadioButton",
    icon: CircleDot,
    defaults: { text: "RadioButton", text_color: "#000000" },
    editable: ["text", "text_color", "bg_color"],
  },
  Entry: {
    label: "Entry",
    icon: TextCursorInput,
    defaults: {},
    editable: [],
  },
  ListBox: {
    label: "ListBox",
    icon: List,
    defaults: {},
    editable: [],
  },
};

export const WIDGET_KINDS = Object.keys(WIDGETS) as WidgetKind[];

export const canEdit = (name: WidgetKind, prop: EditableProp) =>
  WIDGETS[name].editable.includes(prop);
