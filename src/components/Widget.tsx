import { useDrag } from "react-dnd";
import { Ref, forwardRef } from "react";
import { ConnectDragSource } from "react-dnd";
import { cn } from "@/lib/utils";

interface WidgetProps {
  name: string;
}

type WidgetRef = ConnectDragSource | null;

const Widget = forwardRef<WidgetRef, WidgetProps>(({ name }, ref) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "widget",
    item: { name },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));
  
  const getWidgetStyles = () => {
    switch (name) {
      case "Button":
        return "bg-[#1f6feb] text-white px-4 py-2 rounded-[6px]";
      case "Labels":
        return "text-foreground px-2 py-1";
      case "Entry":
        return "bg-background text-foreground border border-border px-3 py-1 rounded-[6px] w-[150px]";
      case "CheckBox":
        return "flex items-center space-x-2 text-foreground";
      case "RadioButton":
        return "flex items-center space-x-2 text-foreground";
      case "ListBox":
        return "bg-background text-foreground border border-border p-2 rounded-[4px] w-[100px] h-[80px]";
      case "Message":
        return "text-foreground px-2 py-1";
      default:
        return "";
    }
  };

  return (
    <div
      ref={drag as unknown as Ref<HTMLDivElement>}
      className={cn(
        "cursor-move select-none font-sans",
        getWidgetStyles(),
        isDragging && "opacity-50"
      )}
    >
      {name === "CheckBox" ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-[#cccccc] rounded-[2px] mr-2" />
          {name}
        </div>
      ) : name === "RadioButton" ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-[#cccccc] rounded-full mr-2" />
          {name}
        </div>
      ) : name === "ListBox" ? (
        <div className="text-sm">
          Item 1<br />Item 2<br />Item 3
        </div>
      ) : (
        name
      )}
    </div>
  );
});

Widget.displayName = "Widget";

export default Widget;