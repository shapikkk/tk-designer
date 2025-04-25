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
        return "bg-[#3b82f6] text-white px-4 py-2 rounded-[6px] hover:bg-[#2563eb] transition-colors w-[140px] h-[28px] flex items-center justify-center";
      case "Labels":
        return "text-foreground px-2 py-1";
      case "Entry":
        return "bg-white text-black border border-[#d1d5db] px-3 py-1 rounded-[6px] w-[140px] h-[28px]";
      case "CheckBox":
        return "flex items-center space-x-2 text-foreground w-[100px] h-[24px]";
      case "RadioButton":
        return "flex items-center space-x-2 text-foreground w-[100px] h-[22px]";
      case "ListBox":
        return "bg-white text-black border border-[#d1d5db] p-2 w-[100px] h-[80px]";
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
          <div className="w-5 h-5 border-2 border-[#d1d5db] rounded-[4px] mr-2" />
          <span className="truncate">{name}</span>
        </div>
      ) : name === "RadioButton" ? (
        <div className="flex items-center">
          <div className="w-5 h-5 border-2 border-[#d1d5db] rounded-full mr-2" />
          <span className="truncate">{name}</span>
        </div>
      ) : name === "ListBox" ? (
        <div className="text-sm">
          Item 1<br />Item 2<br />Item 3
        </div>
      ) : name === "Entry" ? (
        "Entry"
      ) : (
        <span className="truncate">{name}</span>
      )}
    </div>
  );
});

Widget.displayName = "Widget";

export default Widget;