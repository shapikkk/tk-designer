import { useDragLayer } from "react-dnd";
import { cn } from "@/lib/utils";

const CustomDragLayer = () => {
  const { isDragging, item, currentOffset } = useDragLayer((monitor) => ({
    item: monitor.getItem(),
    isDragging: monitor.isDragging(),
    currentOffset: monitor.getSourceClientOffset(),
  }));

  if (!isDragging || !currentOffset) {
    return null;
  }

  const getWidgetStyles = (name: string) => {
    switch (name) {
      case "Button":
        return "bg-[#1f6feb] text-white px-4 py-2 rounded-[6px]";
      case "Labels":
        return "text-foreground px-2 py-1";
      case "Entry":
        return "bg-white text-foreground border border-[#cccccc] px-3 py-1 rounded-[6px] w-[150px]";
      case "CheckBox":
        return "flex items-center space-x-2 text-foreground";
      case "RadioButton":
        return "flex items-center space-x-2 text-foreground";
      case "ListBox":
        return "bg-white text-foreground border border-[#a9a9a9] p-2 rounded-[4px] w-[100px] h-[80px]";
      case "Message":
        return "text-foreground px-2 py-1";
      default:
        return "";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 100,
        left: currentOffset.x,
        top: currentOffset.y,
        opacity: 0.7,
      }}
      className={cn("font-sans", getWidgetStyles(item.name))}
    >
      {item.name === "CheckBox" ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-[#cccccc] rounded-[2px] mr-2" />
          {item.name}
        </div>
      ) : item.name === "RadioButton" ? (
        <div className="flex items-center">
          <div className="w-4 h-4 border-2 border-[#cccccc] rounded-full mr-2" />
          {item.name}
        </div>
      ) : item.name === "ListBox" ? (
        <div className="text-sm">
          Item 1<br />Item 2<br />Item 3
        </div>
      ) : (
        item.name
      )}
    </div>
  );
};

export default CustomDragLayer;