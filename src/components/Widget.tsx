import { useDrag } from "react-dnd";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { WidgetKind } from "@/types";
import { WIDGETS } from "@/widgets";

interface WidgetProps {
  name: WidgetKind;
}

/** A palette entry. Deliberately an icon and a name rather than a live preview:
 *  the preview belongs on the canvas, and a uniform list is far easier to scan. */
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

  const { label, icon: Icon } = WIDGETS[name];

  return (
    <div
      ref={ref}
      title={`Drag ${label} onto the canvas`}
      className={cn(
        "group flex items-center gap-2.5 rounded-md border border-transparent",
        "px-2.5 py-2 text-sm cursor-grab select-none",
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
