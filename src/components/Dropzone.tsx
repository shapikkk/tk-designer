import { useDrag, useDrop } from "react-dnd";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Component } from "@/types";
import type { FrameworkId } from "@/frameworks/types";
import { WidgetPreview } from "@/components/WidgetPreview";
import { isDarkSurface } from "@/lib/color";

interface DropzoneProps {
  framework: FrameworkId;
  onDrop: (kind: string, x: number, y: number) => void;
  width: number;
  height: number;
  components: Component[];
  updateComponentPosition: (id: string, x: number, y: number) => void;
  selectedComponent: string | null;
  setSelectedComponent: (id: string | null) => void;
  windowBackground: string;
  showGrid: boolean;
  scale: number;
}

export const GRID_SIZE = 20;

function DraggableComponent({
  comp,
  framework,
  surface,
  isSelected,
  onSelect,
}: {
  comp: Component;
  framework: FrameworkId;
  surface: string;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const divRef = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "placed-component",
      item: { id: comp.id, kind: comp.kind, comp },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [comp]
  );

  useEffect(() => {
    drag(divRef);
  }, [drag]);

  return (
    <WidgetPreview
      comp={comp}
      framework={framework}
      surface={surface}
      ref={divRef}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect(comp.id);
      }}
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
  framework,
  onDrop,
  width,
  height,
  components,
  updateComponentPosition,
  selectedComponent,
  setSelectedComponent,
  windowBackground,
  showGrid,
  scale,
}: DropzoneProps) {
  const dropzoneRef = useRef<HTMLDivElement>(null);
  const gridColor = isDarkSurface(windowBackground)
    ? "rgba(255, 255, 255, 0.07)"
    : "var(--canvas-grid)";

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: ["widget", "placed-component"],
      drop: (item: { id?: string; kind: string }, monitor) => {
        const offset = monitor.getSourceClientOffset();
        const rect = dropzoneRef.current?.getBoundingClientRect();
        if (!offset || !rect) return;

        const step = GRID_SIZE * scale;
        const x = (Math.round((offset.x - rect.left) / step) * step) / scale;
        const y = (Math.round((offset.y - rect.top) / step) * step) / scale;

        if (monitor.getItemType() === "widget") {
          onDrop(item.kind, Math.round(x), Math.round(y));
        } else if (item.id) {
          updateComponentPosition(item.id, Math.round(x), Math.round(y));
        }
      },
      collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }),
    [onDrop, updateComponentPosition, scale]
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
        backgroundImage: showGrid
          ? `
          linear-gradient(to right, ${gridColor} 1px, transparent 1px),
          linear-gradient(to bottom, ${gridColor} 1px, transparent 1px)
        `
          : undefined,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
    >
      {components.map((comp) => (
        <DraggableComponent
          key={comp.id}
          comp={comp}
          framework={framework}
          surface={windowBackground}
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
