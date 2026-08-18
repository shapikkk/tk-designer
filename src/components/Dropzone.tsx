import { useDrop, useDrag } from "react-dnd";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Component, WidgetKind } from "@/types";

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

interface DraggableComponentProps {
  comp: Component;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function DraggableComponent({
  comp,
  isSelected,
  onSelect,
}: DraggableComponentProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "placed-component",
      item: { id: comp.id, name: comp.name, x: comp.x, y: comp.y },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }),
    [comp.id, comp.name, comp.x, comp.y]
  );

  useEffect(() => {
    drag(divRef);
  }, [drag]);

  const getComponentStyles = (name: WidgetKind) => {
    switch (name) {
      case "Button":
        return "px-4 py-2 rounded-[6px] flex items-center justify-center transition-colors duration-200";
      case "Labels":
        return "px-2 py-1";
      case "Entry":
        return "bg-white text-black border border-[#d1d5db] px-3 py-1 rounded-[6px] w-[140px] h-[28px]";
      case "CheckBox":
        return "flex items-center space-x-2 w-[100px] h-[24px]";
      case "RadioButton":
        return "flex items-center space-x-2 w-[120px] h-[22px]";
      case "ListBox":
        return "bg-white text-black border border-[#d1d5db] p-2 w-[100px] h-[80px]";
      default:
        return "";
    }
  };

  const setHoverBackground = (color?: string) => {
    if (color) divRef.current?.style.setProperty("background-color", color);
  };

  return (
    <div
      ref={divRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(comp.id);
      }}
      onMouseEnter={
        comp.enable_hover
          ? () => setHoverBackground(comp.hover_bg_color)
          : undefined
      }
      onMouseLeave={
        comp.enable_hover ? () => setHoverBackground(comp.bg_color) : undefined
      }
      className={cn(
        "font-sans cursor-move",
        getComponentStyles(comp.name),
        isDragging && "opacity-50",
        isSelected && "ring-2 ring-primary"
      )}
      style={{
        position: "absolute",
        left: comp.x,
        top: comp.y,
        width: comp.name === "Button" ? comp.width ?? 140 : undefined,
        height: comp.name === "Button" ? comp.height ?? 28 : undefined,
        backgroundColor: comp.bg_color || undefined,
        borderWidth: comp.name === "Button" ? comp.border_width ?? 0 : undefined,
        borderStyle:
          comp.name === "Button" && (comp.border_width ?? 0) > 0
            ? "solid"
            : undefined,
        borderColor: comp.border_color || "#3b82f6",
        borderRadius:
          comp.name === "Button" ? comp.border_radius ?? 6 : undefined,
        color:
          comp.text_color || (comp.name === "Button" ? "#ffffff" : undefined),
        fontSize: comp.font_size || undefined,
        fontFamily: comp.font_family || undefined,
      }}
    >
      {comp.name === "CheckBox" ? (
        <div className="flex items-center">
          <div className="w-5 h-5 border-2 border-[#d1d5db] rounded-[4px] mr-2" />
          <span className="truncate">{comp.text || "CheckBox"}</span>
        </div>
      ) : comp.name === "RadioButton" ? (
        <div className="flex items-center">
          <div className="w-5 h-5 border-2 border-[#d1d5db] rounded-full mr-2" />
          <span className="truncate">{comp.text || "RadioButton"}</span>
        </div>
      ) : comp.name === "ListBox" ? (
        <div className="text-sm">
          Item 1<br />Item 2<br />Item 3
        </div>
      ) : comp.name === "Entry" ? (
        "Entry"
      ) : (
        <span className="truncate">{comp.text || comp.name}</span>
      )}
    </div>
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
      drop: (
        item: { id?: string; name: WidgetKind; x?: number; y?: number },
        monitor
      ) => {
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
      onClick={() => setSelectedComponent(null)}
      className="rounded-sm border relative overflow-hidden"
      style={{
        borderColor: "var(--border)",
        width,
        height,
        backgroundColor: isOver ? "#e0e0e0" : windowBackground,
        transition: "background-color 0.2s ease",
        backgroundImage: `
          linear-gradient(to right, #d3d3d3 1px, transparent 1px),
          linear-gradient(to bottom, #d3d3d3 1px, transparent 1px)
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
    </div>
  );
}
