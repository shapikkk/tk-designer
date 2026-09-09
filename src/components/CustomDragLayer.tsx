import { useDragLayer } from "react-dnd";
import type { Component } from "@/types";
import type { FrameworkId } from "@/frameworks/types";
import { defaultProps, findWidget } from "@/frameworks";
import { WidgetPreview } from "@/components/WidgetPreview";

interface DragItem {
  kind: string;
  comp?: Component;
}

export default function CustomDragLayer({
  framework,
  surface,
}: {
  framework: FrameworkId;
  surface: string;
}) {
  const { isDragging, item, offset } = useDragLayer((monitor) => ({
    item: monitor.getItem() as DragItem | null,
    isDragging: monitor.isDragging(),
    offset: monitor.getSourceClientOffset(),
  }));

  if (!isDragging || !offset || !item?.kind) return null;

  const widget = findWidget(framework, item.kind);
  if (!widget) return null;

  const comp: Component = item.comp ?? {
    id: "drag-preview",
    kind: widget.key,
    x: 0,
    y: 0,
    props: defaultProps(widget),
  };

  return (
    <WidgetPreview
      comp={comp}
      framework={framework}
      surface={surface}
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
