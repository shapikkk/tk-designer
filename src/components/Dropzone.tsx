import { useDrag, useDrop } from "react-dnd";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Component, WidgetKind } from "@/types";
import { WidgetPreview } from "@/components/WidgetPreview";

interface DropzoneProps {
  onDrop: (name: WidgetKind, x: number, y: number) => void;
  width: number;
  height: number;
  components: Component[];
  updateComponentPosition: (id: string, x: number, y: number) => void;
  selectedComponent: string | null;
  setSelectedComponent: (id: string | null) => void;
  windowBackground: string;
}

export const GRID_SIZE = 20;

function DraggableComponent({
  comp,
  isSelected,
  onSelect,
}: {
  comp: Component;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "placed-component",
      item: { id: comp.id, name: comp.name, comp },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [comp]
  );

  useEffect(() => {
    drag(divRef);
  }, [drag]);

  const setBackground = (color?: string) => {
    if (color) divRef.current?.style.setProperty("background-color", color);
  };

  return (
    <WidgetPreview
      comp={comp}
      ref={divRef}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(comp.id);
      }}
      onMouseEnter={
        comp.enable_hover ? () => setBackground(comp.hover_bg_color) : undefined
      }
      onMouseLeave={
        comp.enable_hover ? () => setBackground(comp.bg_color) : undefined
      }
      className={cn(
        "absolute cursor-grab active:cursor-grabbing",
        "outline-offset-2 hover:outline hover:outline-1 hover:outline-primary/50",
        isSelected && "outline outline-2 outline-primary hover:outline-2",
        isDragging && "opacity-40"
      )}
      style={{ left: comp.x, top: comp.y }}
      overlay={isSelected ? <SelectionHandles /> : null}
    />
  );
}

/** Corner markers on the selected widget. Purely an affordance — resizing is
 *  done from the Properties panel, which is the one place sizes live. */
function SelectionHandles() {
  const corners = [
    "-top-[3px] -left-[3px]",
    "-top-[3px] -right-[3px]",
    "-bottom-[3px] -left-[3px]",
    "-bottom-[3px] -right-[3px]",
  ];
  return (
    <>
      {corners.map((position) => (
        <span
          key={position}
          className={cn(
            "absolute size-[7px] rounded-[2px] bg-background",
            "border border-primary pointer-events-none",
            position
          )}
        />
      ))}
    </>
  );
}

export default function Dropzone({
  onDrop,
  width,
  height,
  components,
  updateComponentPosition,
  selectedComponent,
  setSelectedComponent,
  windowBackground,
}: DropzoneProps) {
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ["widget", "placed-component"],
      drop: (item: { id?: string; name: WidgetKind }, monitor) => {
        const offset = monitor.getSourceClientOffset();
        const rect = dropzoneRef.current?.getBoundingClientRect();
        if (!offset || !rect) return;

        // Snap only. Bounds are the reducer's job, so drag and the Properties
        // panel cannot disagree about what a valid position is.
        const x = Math.round((offset.x - rect.left) / GRID_SIZE) * GRID_SIZE;
        const y = Math.round((offset.y - rect.top) / GRID_SIZE) * GRID_SIZE;

        if (monitor.getItemType() === "widget") {
          onDrop(item.name, x, y);
        } else if (item.id) {
          updateComponentPosition(item.id, x, y);
        }
      },
      collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }),
    [onDrop, updateComponentPosition]
  );

  return (
    <div
      ref={(node) => {
        dropzoneRef.current = node;
        drop(node);
      }}
      onMouseDown={() => setSelectedComponent(null)}
      className={cn(
        "relative shrink-0 overflow-hidden rounded-lg",
        "shadow-[0_1px_2px_rgba(0,0,0,0.06),0_12px_32px_-12px_rgba(0,0,0,0.25)]",
        "ring-1 transition-shadow duration-200",
        isOver ? "ring-2 ring-primary" : "ring-black/10 dark:ring-white/10"
      )}
      style={{
        width,
        height,
        backgroundColor: windowBackground,
        backgroundImage: `
          linear-gradient(to right, var(--canvas-grid) 1px, transparent 1px),
          linear-gradient(to bottom, var(--canvas-grid) 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
    >
      {components.map((comp) => (
        <DraggableComponent
          key={comp.id}
          comp={comp}
          isSelected={selectedComponent === comp.id}
          onSelect={setSelectedComponent}
        />
      ))}

      {components.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="rounded-md bg-background/85 px-3 py-2 text-sm text-muted-foreground shadow-sm">
            Drag a widget from the left to start
          </p>
        </div>
      )}
    </div>
  );
}
