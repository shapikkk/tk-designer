import type { CSSProperties, ComponentPropsWithRef, ReactNode } from "react";
import { Image as ImageIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Component } from "@/types";
import type { FrameworkId, WidgetDef } from "@/frameworks/types";
import { getWidget } from "@/frameworks";
import { readableOn } from "@/lib/color";

const CHAR_WIDTH = 0.62;
const LINE_HEIGHT = 1.5;

interface Resolved {
  text: string;
  items: string[];
  fg?: string;
  bg?: string;
  accent?: string;
  track?: string;
  knob?: string;
  borderColor?: string;
  borderWidth: number;
  radius: number;
  fontSize: number;
  fontFamily?: string;
  bold: boolean;
  italic: boolean;
  align?: string;
  width?: number;
  height?: number;
}

function resolve(comp: Component, widget: WidgetDef): Resolved {
  const { visual } = widget;
  const raw = (key?: string) => (key ? comp.props[key] : undefined);
  const str = (key?: string) => {
    const value = raw(key);
    return typeof value === "string" && value ? value : undefined;
  };
  const num = (key?: string) => {
    const value = raw(key);
    return typeof value === "number" ? value : undefined;
  };
  const list = (key?: string) => {
    const value = raw(key);
    return Array.isArray(value) ? value : [];
  };

  const weight = str(visual.fontWeight);

  return {
    text: str(visual.text) ?? visual.fallbackText ?? "",
    items: list(visual.items),
    fg: str(visual.fg),
    bg: str(visual.bg),
    accent: str(visual.accent),
    track: str(visual.track),
    knob: str(visual.knob),
    borderColor: str(visual.borderColor),
    borderWidth: num(visual.borderWidth) ?? 0,
    radius: num(visual.radius) ?? 0,
    fontSize: num(visual.fontSize) ?? 14,
    fontFamily: str(visual.fontFamily),
    bold: weight !== undefined && weight !== "normal" && weight !== "w_300",
    italic: raw(visual.italic) === true,
    align: str(visual.align),
    width: num(visual.width),
    height: num(visual.height),
  };
}

function boxSize(
  widget: WidgetDef,
  values: Resolved
): { width?: number; height?: number } {
  const chars = widget.sizing === "chars";
  const padX = widget.visual.padX ?? 0;
  const padY = widget.visual.padY ?? 0;

  const width =
    values.width !== undefined && values.width > 0
      ? chars
        ? Math.round(values.width * values.fontSize * CHAR_WIDTH) + padX * 2
        : values.width
      : widget.visual.boxWidth;

  const height =
    values.height !== undefined && values.height > 0
      ? chars
        ? Math.round(values.height * values.fontSize * LINE_HEIGHT) + padY * 2
        : values.height
      : widget.visual.boxHeight;

  return { width, height };
}

const alignItems = (align?: string) => {
  if (align === "center") return "center";
  if (align === "right") return "flex-end";
  return "flex-start";
};

function shapeContent(
  widget: WidgetDef,
  values: Resolved,
  size: { width?: number; height?: number }
): ReactNode {
  const { shape } = widget.visual;
  const label = values.text;

  switch (shape) {
    case "check":
      return (
        <span className="flex items-center gap-2">
          <span
            className="shrink-0 border-2"
            style={{
              width: values.width ?? 18,
              height: values.height ?? 18,
              backgroundColor: values.accent ?? "#3b82f6",
              borderColor: values.borderColor ?? "#9ca3af",
              borderRadius: values.radius || 4,
            }}
          />
          <span className="truncate">{label}</span>
        </span>
      );

    case "radio":
      return (
        <span className="flex items-center gap-2">
          <span
            className="shrink-0 rounded-full border-2"
            style={{
              width: values.width ?? 18,
              height: values.height ?? 18,
              borderColor: values.accent ?? "#9ca3af",
              backgroundColor: "transparent",
              boxShadow: `inset 0 0 0 3px ${values.accent ?? "#3b82f6"}`,
            }}
          />
          <span className="truncate">{label}</span>
        </span>
      );

    case "switch":
      return (
        <span className="flex items-center gap-2">
          <span
            className="relative shrink-0"
            style={{
              width: values.width ?? 40,
              height: values.height ?? 20,
              backgroundColor: values.accent ?? "#3b82f6",
              borderRadius: 999,
            }}
          >
            <span
              className="absolute top-1/2 -translate-y-1/2 rounded-full"
              style={{
                right: 2,
                width: (values.height ?? 20) - 4,
                height: (values.height ?? 20) - 4,
                backgroundColor: values.knob ?? "#ffffff",
              }}
            />
          </span>
          <span className="truncate">{label}</span>
        </span>
      );

    case "slider":
      return (
        <span className="flex w-full items-center">
          <span
            className="relative w-full"
            style={{
              height: 6,
              backgroundColor: values.track ?? "#d1d5db",
              borderRadius: 999,
            }}
          >
            <span
              className="absolute inset-y-0 left-0"
              style={{
                width: "55%",
                backgroundColor: values.accent ?? "#3b82f6",
                borderRadius: 999,
              }}
            />
            <span
              className="absolute top-1/2 -translate-y-1/2 rounded-full shadow-sm"
              style={{
                left: "55%",
                width: 16,
                height: 16,
                marginLeft: -8,
                backgroundColor: values.knob ?? values.bg ?? "#2563eb",
              }}
            />
          </span>
        </span>
      );

    case "progress":
      return (
        <span
          className="relative block w-full overflow-hidden"
          style={{
            height: size.height ?? 8,
            backgroundColor: values.track ?? "#d1d5db",
            borderRadius: values.radius || 999,
          }}
        >
          <span
            className="absolute inset-y-0 left-0"
            style={{
              width: "60%",
              backgroundColor: values.accent ?? "#3b82f6",
            }}
          />
        </span>
      );

    case "list":
      return (
        <span className="block w-full overflow-hidden leading-tight">
          {(values.items.length > 0 ? values.items : ["Item 1"]).map(
            (item, index) => (
              <span
                key={`${item}-${index}`}
                className="block truncate px-1"
                style={
                  index === 0
                    ? {
                        backgroundColor: values.accent,
                        color: values.accent ? "#ffffff" : undefined,
                      }
                    : undefined
                }
              >
                {item}
              </span>
            )
          )}
        </span>
      );

    case "dropdown":
      return (
        <span className="flex w-full items-center justify-between gap-2">
          <span className="truncate">
            {values.items[0] ?? label ?? "Select"}
          </span>
          <span
            className="shrink-0"
            style={{ color: values.accent ?? values.fg }}
          >
            ▾
          </span>
        </span>
      );

    case "image":
      return (
        <span className="flex h-full w-full flex-col items-center justify-center gap-1 text-[11px] opacity-70">
          <ImageIcon className="size-5" strokeWidth={1.5} />
          <span className="max-w-full truncate px-2">{label || "Image"}</span>
        </span>
      );

    case "icon":
      return (
        <Star
          style={{ width: values.fontSize, height: values.fontSize }}
          strokeWidth={1.75}
        />
      );

    case "textarea":
      return (
        <span className="block w-full opacity-60">{label || "Text"}</span>
      );

    case "box":
      return label ? (
        <span className="absolute left-2 top-1 text-[11px] opacity-80">
          {label}
        </span>
      ) : null;

    case "field":
      return <span className="w-full truncate opacity-70">{label}</span>;

    default:
      return <span className="truncate">{label}</span>;
  }
}

const SHAPE_CLASS: Record<string, string> = {
  text: "inline-flex items-center",
  button: "inline-flex items-center justify-center",
  field: "inline-flex items-center",
  textarea: "inline-flex items-start",
  check: "inline-flex items-center",
  radio: "inline-flex items-center",
  switch: "inline-flex items-center",
  slider: "inline-flex items-center",
  progress: "inline-flex items-center",
  list: "inline-flex items-start",
  dropdown: "inline-flex items-center",
  box: "relative inline-flex items-start",
  image: "inline-flex items-center justify-center overflow-hidden",
  icon: "inline-flex items-center justify-center",
};

interface WidgetPreviewProps extends ComponentPropsWithRef<"div"> {
  comp: Component;
  framework: FrameworkId;
  surface?: string;
  overlay?: ReactNode;
}

export function WidgetPreview({
  comp,
  framework,
  surface,
  overlay,
  className,
  style,
  ...rest
}: WidgetPreviewProps) {
  const widget = getWidget(framework, comp.kind);
  const values = resolve(comp, widget);
  const size = boxSize(widget, values);
  const { shape } = widget.visual;
  const chrome = shape !== "check" && shape !== "radio" && shape !== "switch";

  const padX = widget.visual.padX ?? (chrome ? 6 : 0);
  const padY = widget.visual.padY ?? (chrome ? 3 : 0);

  const boxStyle: CSSProperties = {
    width: size.width,
    height: shape === "progress" ? undefined : size.height,
    minWidth: shape === "text" ? 12 : undefined,
    backgroundColor: chrome ? values.bg : undefined,
    color: values.fg ?? readableOn(chrome ? values.bg ?? surface : surface),
    borderStyle: values.borderWidth > 0 ? "solid" : undefined,
    borderWidth: chrome && values.borderWidth > 0 ? values.borderWidth : 0,
    borderColor: values.borderColor ?? values.fg,
    borderRadius: chrome ? values.radius : undefined,
    fontSize: values.fontSize,
    fontFamily: values.fontFamily,
    fontWeight: values.bold ? 600 : undefined,
    fontStyle: values.italic ? "italic" : undefined,
    justifyContent:
      shape === "text" || shape === "field" ? alignItems(values.align) : undefined,
    paddingLeft: chrome ? padX : undefined,
    paddingRight: chrome ? padX : undefined,
    paddingTop: chrome ? padY : undefined,
    paddingBottom: chrome ? padY : undefined,
    lineHeight: 1.3,
  };

  return (
    <div
      {...rest}
      className={cn("font-sans", SHAPE_CLASS[shape], className)}
      style={{ ...boxStyle, ...style }}
    >
      {shapeContent(widget, values, size)}
      {overlay}
    </div>
  );
}
