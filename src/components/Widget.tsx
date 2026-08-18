import { useDrag } from "react-dnd";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { WidgetKind } from "@/types";
import { WIDGETS } from "@/widgets";

interface WidgetProps {
  name: WidgetKind;
}

const getWidgetStyles = (name: WidgetKind) => {
  switch (name) {
    case "Button":
      return "px-4 py-2 rounded-[6px] flex items-center justify-center transition-colors duration-200 bg-[#3b82f6] text-white hover:bg-[#2563eb] w-[140px] h-[28px]";
    case "Labels":
      return "px-2 py-1 flex items-center";
    case "Entry":
      return "border border-[#d1d5db] px-3 py-1 rounded-[6px] w-[140px] h-[28px] flex items-center";
    case "CheckBox":
      return "flex items-center space-x-2 w-[100px] h-[24px]";
    case "RadioButton":
      return "flex items-center space-x-2 w-[100px] h-[22px]";
    case "ListBox":
      return "border border-[#d1d5db] p-2 w-[100px] h-[80px] flex items-start";
    default:
      return "";
  }
};

export default function Widget({ name }: WidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "widget",
    item: { name },
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));

  useEffect(() => {
    drag(ref);
  }, [drag]);

  const label = WIDGETS[name].label;

  return (
    <div
      ref={ref}
      className={cn(
        "cursor-move select-none font-sans",
        getWidgetStyles(name),
        isDragging && "opacity-50"
      )}
      style={{ minWidth: "fit-content", minHeight: "fit-content" }}
    >
      {name === "CheckBox" ? (
        <div className="flex items-center">
          <div className="w-5 h-5 border-2 border-[#d1d5db] rounded-[4px] mr-2" />
          <span className="truncate">{label}</span>
        </div>
      ) : name === "RadioButton" ? (
        <div className="flex items-center">
          <div className="w-5 h-5 border-2 border-[#d1d5db] rounded-full mr-2" />
          <span className="truncate">{label}</span>
        </div>
      ) : name === "ListBox" ? (
        <div className="text-sm">
          Item 1<br />Item 2<br />Item 3
        </div>
      ) : (
        <span className="truncate">{label}</span>
      )}
    </div>
  );
}
