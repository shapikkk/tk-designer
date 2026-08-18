import type { CSSProperties, ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Component, WidgetKind } from "@/types";

/** The only widget rendering in the app: the canvas and the drag ghost both
 *  draw through it, so they cannot look different. */
const SHAPE: Record<WidgetKind, string> = {
  Button:
    "px-4 py-2 flex items-center justify-center transition-colors duration-150",
  Labels: "px-2 py-1 flex items-center",
  Entry:
    "bg-white text-black border border-[#d1d5db] px-3 py-1 rounded-[6px] w-[140px] h-[28px] flex items-center",
  CheckBox: "flex items-center w-[110px] h-[24px]",
  RadioButton: "flex items-center w-[124px] h-[22px]",
  ListBox:
    "bg-white text-black border border-[#d1d5db] p-2 w-[100px] h-[80px] overflow-hidden",
};

function shapeStyle(comp: Component): CSSProperties {
  const isButton = comp.name === "Button";
  return {
    width: isButton ? comp.width ?? 140 : undefined,
    height: isButton ? comp.height ?? 28 : undefined,
    backgroundColor: comp.bg_color || undefined,
    borderWidth: isButton ? comp.border_width ?? 0 : undefined,
    borderStyle: isButton && (comp.border_width ?? 0) > 0 ? "solid" : undefined,
    borderColor: isButton ? comp.border_color ?? "#3b82f6" : undefined,
    borderRadius: isButton ? comp.border_radius ?? 6 : undefined,
    color: comp.text_color || (isButton ? "#ffffff" : undefined),
    fontSize: comp.font_size || undefined,
    fontFamily: comp.font_family || undefined,
  };
}

function content(comp: Component): ReactNode {
  switch (comp.name) {
    case "CheckBox":
      return (
        <>
          <span className="size-[18px] shrink-0 rounded-[4px] border-2 border-[#d1d5db] mr-2" />
          <span className="truncate">{comp.text || "CheckBox"}</span>
        </>
      );
    case "RadioButton":
      return (
        <>
          <span className="size-[18px] shrink-0 rounded-full border-2 border-[#d1d5db] mr-2" />
          <span className="truncate">{comp.text || "RadioButton"}</span>
        </>
      );
    case "ListBox":
      return (
        <div className="text-sm leading-tight">
          Item 1<br />Item 2<br />Item 3
        </div>
      );
    case "Entry":
      return <span className="text-[#9ca3af]">Entry</span>;
    default:
      return <span className="truncate">{comp.text || comp.name}</span>;
  }
}

interface WidgetPreviewProps extends ComponentPropsWithRef<"div"> {
  comp: Component;
  /** Rendered inside the widget box, e.g. selection handles. */
  overlay?: ReactNode;
}

export function WidgetPreview({
  comp,
  overlay,
  className,
  style,
  ...rest
}: WidgetPreviewProps) {
  return (
    <div
      {...rest}
      className={cn("font-sans", SHAPE[comp.name], className)}
      style={{ ...shapeStyle(comp), ...style }}
    >
      {content(comp)}
      {overlay}
    </div>
  );
}
