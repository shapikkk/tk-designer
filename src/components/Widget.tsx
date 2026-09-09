import { useDrag } from "react-dnd";
import { useEffect, useRef } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WidgetDef } from "@/frameworks/types";

interface WidgetProps {
  widget: WidgetDef;
  onAdd: (kind: string) => void;
}

export default function Widget({ widget, onAdd }: WidgetProps) {
  const ref = useRef<HTMLButtonElement>(null);
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
    <button
      ref={ref}
      type="button"
      onClick={() => onAdd(widget.key)}
      title={`${ctor} — drag onto the canvas or tap to add`}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-md border border-transparent",
        "px-2.5 py-[7px] text-left text-sm cursor-grab select-none",
        "transition-colors duration-150",
        "hover:border-border hover:bg-accent active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isDragging && "opacity-40"
      )}
    >
      <Icon
        className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
        strokeWidth={1.75}
      />
      <span className="truncate">{label}</span>
      <Plus
        className="ml-auto size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        strokeWidth={1.75}
      />
    </button>
  );
}
