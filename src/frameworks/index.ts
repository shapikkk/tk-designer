import { CUSTOMTKINTER } from "@/frameworks/customtkinter";
import { FLET } from "@/frameworks/flet";
import { TKINTER } from "@/frameworks/tkinter";
import type {
  FrameworkDef,
  FrameworkId,
  PropSpec,
  ResolvedProps,
  WidgetDef,
} from "@/frameworks/types";

export const FRAMEWORKS: Record<FrameworkId, FrameworkDef> = {
  tkinter: TKINTER,
  customtkinter: CUSTOMTKINTER,
  flet: FLET,
};

export const FRAMEWORK_IDS: FrameworkId[] = [
  "tkinter",
  "customtkinter",
  "flet",
];

export const DEFAULT_FRAMEWORK: FrameworkId = "customtkinter";

export const isFrameworkId = (value: unknown): value is FrameworkId =>
  typeof value === "string" && (FRAMEWORK_IDS as string[]).includes(value);

export const getFramework = (id: FrameworkId): FrameworkDef => FRAMEWORKS[id];

export const findWidget = (
  framework: FrameworkId,
  key: string
): WidgetDef | undefined =>
  FRAMEWORKS[framework].widgets.find((widget) => widget.key === key);

export const getWidget = (framework: FrameworkId, key: string): WidgetDef => {
  const widget = findWidget(framework, key);
  if (!widget) {
    throw new Error(`Unknown ${framework} widget: ${key}`);
  }
  return widget;
};

export const widgetsByCategory = (
  framework: FrameworkId
): { category: string; widgets: WidgetDef[] }[] => {
  const def = FRAMEWORKS[framework];
  return def.categories
    .map((category) => ({
      category,
      widgets: def.widgets.filter((widget) => widget.category === category),
    }))
    .filter((group) => group.widgets.length > 0);
};

export const defaultProps = (widget: WidgetDef): ResolvedProps => {
  const values: ResolvedProps = {};
  for (const spec of widget.props) {
    if (spec.default !== undefined) {
      values[spec.key] = Array.isArray(spec.default)
        ? [...spec.default]
        : spec.default;
    }
  }
  return values;
};

export const propSpec = (
  widget: WidgetDef,
  key: string
): PropSpec | undefined => widget.props.find((spec) => spec.key === key);

export type {
  FrameworkDef,
  FrameworkId,
  PropSpec,
  ResolvedProps,
  WidgetDef,
} from "@/frameworks/types";
