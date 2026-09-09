import type { LucideIcon } from "lucide-react";

export type FrameworkId = "tkinter" | "customtkinter" | "flet";

export type PropValue = string | number | boolean | string[];

export type PropType = "text" | "color" | "number" | "bool" | "select" | "list";

export type PropGroup =
  | "Content"
  | "Text"
  | "Appearance"
  | "Layout"
  | "Behavior";

export interface SelectOption {
  value: string;
  label: string;
  code?: string;
}

export interface PropSpec {
  key: string;
  kwarg: string;
  label: string;
  type: PropType;
  group: PropGroup;
  default?: PropValue;
  min?: number;
  max?: number;
  unit?: string;
  hint?: string;
  placeholder?: string;
  options?: SelectOption[];
  clearable?: boolean;
  transparentValue?: string;
  itemCtor?: string;
  enumPrefix?: string;
  virtual?: boolean;
}

export type PreviewShape =
  | "text"
  | "button"
  | "field"
  | "textarea"
  | "check"
  | "radio"
  | "switch"
  | "slider"
  | "progress"
  | "list"
  | "box"
  | "dropdown"
  | "image"
  | "icon";

export interface VisualMap {
  shape: PreviewShape;
  text?: string;
  fallbackText?: string;
  bg?: string;
  fg?: string;
  accent?: string;
  track?: string;
  knob?: string;
  borderWidth?: string;
  borderColor?: string;
  radius?: string;
  fontSize?: string;
  fontFamily?: string;
  fontWeight?: string;
  italic?: string;
  align?: string;
  width?: string;
  height?: string;
  items?: string;
  boxWidth?: number;
  boxHeight?: number;
  padX?: number;
  padY?: number;
}

export interface WidgetDef {
  key: string;
  label: string;
  icon: LucideIcon;
  category: string;
  ctor: string;
  varPrefix: string;
  props: PropSpec[];
  fixed?: Record<string, string | number | boolean>;
  font?: {
    kwarg: string;
    familyKey?: string;
    sizeKey?: string;
    weightKey?: string;
    fallbackFamily?: string;
    fallbackSize?: number;
  };
  after?: (varName: string, props: ResolvedProps) => string[];
  sizing?: "px" | "chars";
  visual: VisualMap;
}

export type ResolvedProps = Record<string, PropValue | undefined>;

export interface FrameworkDef {
  id: FrameworkId;
  label: string;
  shortLabel: string;
  tagline: string;
  module: string;
  alias: string;
  docsUrl: string;
  accent: string;
  widgets: WidgetDef[];
  categories: string[];
  defaultWindow: { width: number; height: number; background: string };
}
