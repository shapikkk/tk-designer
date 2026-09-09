import { useDrag } from "react-dnd";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { WidgetDef } from "@/frameworks/types";

interface WidgetProps {
  widget: WidgetDef;
}

export default function Widget({ widget }: WidgetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "widget",
      item: { kind: widget.key },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [widget.key]
  );

  useEffect(() => {
    drag(ref);
  }, [drag]);

  const { label, icon: Icon, ctor } = widget;

  return (
    <div
      ref={ref}
      title={`${ctor} — drag onto the canvas`}
      className={cn(
        "group flex items-center gap-2.5 rounded-md border border-transparent",
        "px-2.5 py-[7px] text-sm cursor-grab select-none",
        "transition-colors duration-150",
        "hover:border-border hover:bg-accent active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <Icon
        className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
        strokeWidth={1.75}
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
