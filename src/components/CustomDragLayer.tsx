import { useDragLayer } from "react-dnd";
import type { Component, WidgetKind } from "@/types";
import { WIDGETS } from "@/widgets";
import { WidgetPreview } from "@/components/WidgetPreview";

interface DragItem {
  name: WidgetKind;
  /** Present when dragging a widget that is already on the canvas, so the
   *  ghost shows the user's actual styling rather than the defaults. */
  comp?: Component;
}

export default function CustomDragLayer() {
  const { isDragging, item, offset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as DragItem | null,
    isDragging: monitor.isDragging(),
    offset: monitor.getSourceClientOffset(),
  }));

  if (!isDragging || !offset || !item?.name) return null;

  const comp: Component =
    item.comp ??
    ({
      id: "drag-preview",
      name: item.name,
      x: 0,
      y: 0,
      ...WIDGETS[item.name].defaults,
    } as Component);

  return (
    <WidgetPreview
      comp={comp}
      style={{
        position: "fixed",
        pointerEvents: "none",
        zIndex: 100,
        left: offset.x,
        top: offset.y,
        opacity: 0.85,
      }}
    />
  );
}
