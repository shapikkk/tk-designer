import { useDrop, useDrag } from "react-dnd";
import { forwardRef, Ref, useRef, useEffect } from "react";
import { ConnectDropTarget, ConnectDragSource } from "react-dnd";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onDrop: (widgetName: string, x: number, y: number) => void;
  width: string | number;
  height: string | number;
  components: { id: string; name: string; x: number; y: number }[];
  updateComponentPosition: (id: string, x: number, y: number) => void;
}

type DropzoneRef = ConnectDropTarget | null;

const GRID_SIZE = 20;

interface DraggableComponentProps {
  comp: { id: string; name: string; x: number; y: number };
  updateComponentPosition: (id: string, x: number, y: number) => void;
}

type DraggableComponentRef = ConnectDragSource | null;

const DraggableComponent = forwardRef<DraggableComponentRef, DraggableComponentProps>(
  ({ comp, updateComponentPosition }, ref) => {
    const divRef = useRef<HTMLDivElement>(null);
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "placed-component",
      item: { id: comp.id, name: comp.name, x: comp.x, y: comp.y },
      collect: (monitor) => ({
        isDragging: !!monitor.isDragging(),
      }),
    }));

    useEffect(() => {
      drag(divRef);
    }, [drag]);

    const getComponentStyles = (name: string) => {
      switch (name) {
        case "Button":
          return "bg-[#1f6feb] text-white px-4 py-2 rounded-[6px]";
        case "Labels":
          return "text-foreground px-2 py-1";
        case "Entry":
          return "bg-background text-foreground border border-[#cccccc] px-3 py-1 rounded-[6px] w-[150px]";
        case "CheckBox":
          return "flex items-center space-x-2 text-foreground";
        case "RadioButton":
          return "flex items-center space-x-2 text-foreground"; 
        case "ListBox":
          return "bg-background text-foreground border border-[#a9a9a9] p-2 rounded-[4px] w-[100px] h-[80px]";
        case "Message":
          return "text-foreground px-2 py-1";
        default:
          return "";
      }
    };

    return (
      <div
        ref={divRef}
        className={cn(
          "font-sans cursor-move",
          getComponentStyles(comp.name),
          isDragging && "opacity-50"
        )}
        style={{
          position: "absolute",
          left: comp.x,
          top: comp.y,
        }}
      >
        {comp.name === "CheckBox" ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-[#cccccc] rounded-[2px] mr-2" />
            {comp.name}
          </div>
        ) : comp.name === "RadioButton" ? (
          <div className="flex items-center">
            <div className="w-4 h-4 border-2 border-[#cccccc] rounded-full mr-2" />
            {comp.name}
          </div>
        ) : comp.name === "ListBox" ? (
          <div className="text-sm">
            Item 1<br />Item 2<br />Item 3
          </div>
        ) : (
          comp.name
        )}
      </div>
    );
  }
);

DraggableComponent.displayName = "DraggableComponent";

const Dropzone = forwardRef<DropzoneRef, DropzoneProps>(
  ({ onDrop, width, height, components, updateComponentPosition }, ref) => {
    const dropzoneRef = useRef<HTMLDivElement>(null);

    const [{ isOver }, drop] = useDrop(() => ({
      accept: ["widget", "placed-component"],
      drop: (item: { id?: string; name: string; x?: number; y?: number }, monitor) => {
        const offset = monitor.getSourceClientOffset();
        const dropzoneRect = dropzoneRef.current?.getBoundingClientRect();

        if (offset && dropzoneRect) {
          let x = offset.x - dropzoneRect.left;
          let y = offset.y - dropzoneRect.top;

          x = Math.round(x / GRID_SIZE) * GRID_SIZE;
          y = Math.round(y / GRID_SIZE) * GRID_SIZE;

          x = Math.max(0, Math.min(x, dropzoneRect.width - 50));
          y = Math.max(0, Math.min(y, dropzoneRect.height - 20));

          if (monitor.getItemType() === "widget") {
            onDrop(item.name, x, y);
          } else if (monitor.getItemType() === "placed-component" && item.id) {
            updateComponentPosition(item.id, x, y);
          }
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
      }),
    }));

    const combinedRef = (node: HTMLDivElement | null) => {
      dropzoneRef.current = node;
      drop(node);
    };

    return (
      <div
        ref={combinedRef as unknown as Ref<HTMLDivElement>}
        className="w-full rounded-sm border relative"
        style={{
          borderColor: "var(--border)",
          width,
          height,
          backgroundColor: isOver ? "#e0e0e0" : "var(--background)",
          transition: "all 0.3s ease",
          backgroundImage: `
            linear-gradient(to right,rgba(211, 211, 211, 0.45) 1px, transparent 1px),
            linear-gradient(to bottom,rgba(211, 211, 211, 0.45) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
        }}
      >
        {components.map((comp) => (
          <DraggableComponent
            key={comp.id}
            comp={comp}
            updateComponentPosition={updateComponentPosition}
          />
        ))}
      </div>
    );
  }
);

Dropzone.displayName = "Dropzone";

export default Dropzone;