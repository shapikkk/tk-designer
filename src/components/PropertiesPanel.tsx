import type { Dispatch } from "react";
import { Trash } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NumberField } from "@/components/NumberField";
import type { Component, EditorState } from "@/types";
import { canEdit } from "@/widgets";
import type { EditorAction } from "@/state/editorReducer";

interface PropertiesPanelProps {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
}

export default function PropertiesPanel({
  state,
  dispatch,
}: PropertiesPanelProps) {
  const selected = state.components.find((c) => c.id === state.selectedId);

  // Every property edit is the same operation, so there is one handler for all
  // of them rather than one per field.
  const patch = (values: Partial<Component>) => {
    if (!selected) return;
    dispatch({ type: "update", id: selected.id, patch: values });
  };

  const can = (prop: Parameters<typeof canEdit>[1]) =>
    selected !== undefined && canEdit(selected.name, prop);

  return (
    <ScrollArea className="w-[320px] shrink-0 border-l">
      <div className="p-4 space-y-3">
        <h2 className="text-lg font-semibold">Properties</h2>

        <div>
          <label className="text-sm font-medium" htmlFor="window-title">
            Window Title
          </label>
          <Input
            id="window-title"
            value={state.windowTitle}
            onChange={(e) =>
              dispatch({
                type: "setWindow",
                patch: { windowTitle: e.target.value },
              })
            }
            placeholder="Window Title"
            className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
          />
        </div>

        <Separator />

        <div>
          <label className="text-sm font-medium" htmlFor="window-bg">
            Window Background
          </label>
          <Input
            id="window-bg"
            type="color"
            value={state.windowBackground}
            onChange={(e) =>
              dispatch({
                type: "setWindow",
                patch: { windowBackground: e.target.value },
              })
            }
            className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
          />
        </div>

        <Separator />

        {!selected ? (
          <p className="text-sm text-muted-foreground">
            Select a component to edit.
          </p>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Selected: {selected.name}</h3>

            <div>
              <p className="text-sm font-medium mb-1">Position</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="pos-x"
                  >
                    X
                  </label>
                  <NumberField
                    id="pos-x"
                    value={selected.x}
                    min={0}
                    max={state.canvasWidth}
                    onCommit={(x) =>
                      dispatch({ type: "move", id: selected.id, x, y: selected.y })
                    }
                    className="rounded-sm focus:ring-0 text-sm py-1.5"
                  />
                </div>
                <div className="flex-1">
                  <label
                    className="text-xs text-muted-foreground"
                    htmlFor="pos-y"
                  >
                    Y
                  </label>
                  <NumberField
                    id="pos-y"
                    value={selected.y}
                    min={0}
                    max={state.canvasHeight}
                    onCommit={(y) =>
                      dispatch({ type: "move", id: selected.id, x: selected.x, y })
                    }
                    className="rounded-sm focus:ring-0 text-sm py-1.5"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {can("text") && (
              <div>
                <label className="text-sm font-medium" htmlFor="prop-text">
                  Text
                </label>
                <Input
                  id="prop-text"
                  value={selected.text ?? ""}
                  onChange={(e) => patch({ text: e.target.value })}
                  placeholder="Enter text"
                  className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                />
              </div>
            )}

            {can("text_color") && (
              <div>
                <label className="text-sm font-medium" htmlFor="prop-text-color">
                  Text Color
                </label>
                <Input
                  id="prop-text-color"
                  type="color"
                  value={selected.text_color ?? "#000000"}
                  onChange={(e) => patch({ text_color: e.target.value })}
                  className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
                />
              </div>
            )}

            {can("bg_color") && (
              <div>
                <label className="text-sm font-medium" htmlFor="prop-bg-color">
                  Background Color
                </label>
                <div className="flex gap-2 items-center">
                  <Input
                    id="prop-bg-color"
                    type="color"
                    value={selected.bg_color ?? "#ffffff"}
                    onChange={(e) => patch({ bg_color: e.target.value })}
                    className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => patch({ bg_color: undefined })}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {can("font_family") && (
              <div>
                <label className="text-sm font-medium" htmlFor="prop-font-family">
                  Font Family
                </label>
                <Input
                  id="prop-font-family"
                  value={selected.font_family ?? "Arial"}
                  onChange={(e) => patch({ font_family: e.target.value })}
                  placeholder="Arial"
                  className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                />
              </div>
            )}

            {can("font_size") && (
              <div>
                <label className="text-sm font-medium" htmlFor="prop-font-size">
                  Font Size (px)
                </label>
                <NumberField
                  id="prop-font-size"
                  value={selected.font_size ?? 14}
                  min={8}
                  max={200}
                  onCommit={(font_size) => patch({ font_size })}
                  className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                />
              </div>
            )}

            {can("border_width") && (
              <div>
                <label className="text-sm font-medium" htmlFor="prop-border-width">
                  Border Width (px)
                </label>
                <NumberField
                  id="prop-border-width"
                  value={selected.border_width ?? 0}
                  min={0}
                  max={50}
                  onCommit={(border_width) => patch({ border_width })}
                  className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                />
              </div>
            )}

            {can("border_radius") && (
              <div>
                <label
                  className="text-sm font-medium"
                  htmlFor="prop-border-radius"
                >
                  Border Radius (px)
                </label>
                <NumberField
                  id="prop-border-radius"
                  value={selected.border_radius ?? 6}
                  min={0}
                  max={100}
                  onCommit={(border_radius) => patch({ border_radius })}
                  className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                />
              </div>
            )}

            {can("border_color") && (
              <div>
                <label className="text-sm font-medium" htmlFor="prop-border-color">
                  Border Color
                </label>
                <Input
                  id="prop-border-color"
                  type="color"
                  value={selected.border_color ?? "#3b82f6"}
                  onChange={(e) => patch({ border_color: e.target.value })}
                  className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
                />
              </div>
            )}

            {can("enable_hover") && (
              <div className="flex items-center gap-2">
                <input
                  id="prop-hover"
                  type="checkbox"
                  checked={selected.enable_hover ?? false}
                  onChange={(e) => patch({ enable_hover: e.target.checked })}
                  className="h-4 w-4"
                />
                <label className="text-sm font-medium" htmlFor="prop-hover">
                  Enable Hover
                </label>
              </div>
            )}

            {can("hover_bg_color") && selected.enable_hover && (
              <div>
                <label className="text-sm font-medium" htmlFor="prop-hover-color">
                  Hover Background Color
                </label>
                <Input
                  id="prop-hover-color"
                  type="color"
                  value={selected.hover_bg_color ?? "#2563eb"}
                  onChange={(e) => patch({ hover_bg_color: e.target.value })}
                  className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
                />
              </div>
            )}

            {(can("width") || can("height")) && (
              <>
                <Separator />
                <div>
                  <p className="text-sm font-medium mb-1">Size</p>
                  <div className="flex gap-2">
                    {can("width") && (
                      <div className="flex-1">
                        <label
                          className="text-xs text-muted-foreground"
                          htmlFor="prop-width"
                        >
                          W
                        </label>
                        <NumberField
                          id="prop-width"
                          value={selected.width ?? 140}
                          min={20}
                          max={4096}
                          onCommit={(width) => patch({ width })}
                          className="rounded-sm focus:ring-0 text-sm py-1.5"
                        />
                      </div>
                    )}
                    {can("height") && (
                      <div className="flex-1">
                        <label
                          className="text-xs text-muted-foreground"
                          htmlFor="prop-height"
                        >
                          H
                        </label>
                        <NumberField
                          id="prop-height"
                          value={selected.height ?? 28}
                          min={20}
                          max={4096}
                          onCommit={(height) => patch({ height })}
                          className="rounded-sm focus:ring-0 text-sm py-1.5"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            <Button
              variant="outline"
              className="w-full"
              onClick={() => dispatch({ type: "remove", id: selected.id })}
            >
              <Trash className="mr-2 h-4 w-4" /> Delete Component
            </Button>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
