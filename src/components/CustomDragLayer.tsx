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
        return "bg-[#3b82f6] text-white px-4 py-2 rounded-[6px] hover:bg-[#2563eb] transition-colors w-[140px] h-[28px] flex items-center justify-center";
      case "Labels":
        return "text-black px-2 py-1";
      case "Entry":
        return "bg-white text-black border border-[#d1d5db] px-3 py-1 rounded-[6px] w-[140px] h-[28px]";
      case "CheckBox":
        return "flex items-center space-x-2 text-black w-[100px] h-[24px]";
      case "RadioButton":
        return "flex items-center space-x-2 text-black w-[100px] h-[22px]";
      case "ListBox":
        return "bg-white text-black border border-[#d1d5db] p-2 w-[100px] h-[80px]";
      case "Message":
        return "text-black px-2 py-1";
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