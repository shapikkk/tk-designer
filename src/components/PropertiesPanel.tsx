import type { Dispatch, ReactNode } from "react";
import { MousePointer2, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/NumberField";
import { cn } from "@/lib/utils";
import type { Component, EditorState } from "@/types";
import { WIDGETS, canEdit } from "@/widgets";
import type { EditorAction } from "@/state/editorReducer";

interface PropertiesPanelProps {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
}

/** `input[type=color]` silently falls back to black for anything that is not a
 *  six-digit hex value, and files loaded from disk may carry a named colour. */
const asHex = (value: string | undefined, fallback: string) =>
  value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b px-4 py-3.5 last:border-b-0">
      <h3 className="pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2.5">{children}</div>
    </section>
  );
}

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[5.5rem_1fr] items-center gap-2">
      <label
        htmlFor={htmlFor}
        className="truncate text-xs text-muted-foreground"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ColorRow({
  label,
  id,
  value,
  fallback,
  onChange,
  onClear,
}: {
  label: string;
  id: string;
  value: string | undefined;
  fallback: string;
  onChange: (value: string) => void;
  onClear?: () => void;
}) {
  return (
    <Row label={label} htmlFor={id}>
      <div className="flex items-center gap-1.5">
        <Input
          id={id}
          type="color"
          value={asHex(value, fallback)}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-full min-w-0"
        />
        <span className="w-[4.5rem] shrink-0 font-mono text-[11px] text-muted-foreground">
          {value ?? "none"}
        </span>
        {onClear && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs"
            onClick={onClear}
            title="Use the window background instead"
            disabled={value === undefined}
          >
            Clear
          </Button>
        )}
      </div>
    </Row>
  );
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

  const SelectedIcon = selected ? WIDGETS[selected.name].icon : null;

  return (
    <aside className="scroll-slim flex w-[300px] shrink-0 flex-col overflow-y-auto border-l bg-background">
      <Section title="Window">
        <Row label="Title" htmlFor="window-title">
          <Input
            id="window-title"
            value={state.windowTitle}
            onChange={(e) =>
              dispatch({
                type: "setWindow",
                patch: { windowTitle: e.target.value },
              })
            }
            placeholder="My App"
            className="h-8 text-sm"
          />
        </Row>
        <ColorRow
          label="Background"
          id="window-bg"
          value={state.windowBackground}
          fallback="#ffffff"
          onChange={(windowBackground) =>
            dispatch({ type: "setWindow", patch: { windowBackground } })
          }
        />
      </Section>

      {!selected || !SelectedIcon ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <MousePointer2
            className="size-5 text-muted-foreground/60"
            strokeWidth={1.75}
          />
          <p className="text-xs text-muted-foreground">
            Select a widget on the canvas to edit its properties.
          </p>
        </div>
      ) : (
        <div className="animate-in fade-in-0 duration-150">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <SelectedIcon
              className="size-4 shrink-0 text-primary"
              strokeWidth={1.75}
            />
            <span className="text-sm font-medium">
              {WIDGETS[selected.name].label}
            </span>
          </div>

          <Section title="Position">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="pos-x"
                  className="w-3 text-xs text-muted-foreground"
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
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label
                  htmlFor="pos-y"
                  className="w-3 text-xs text-muted-foreground"
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
                  className="h-8 text-sm"
                />
              </div>
            </div>

            {(can("width") || can("height")) && (
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="prop-width"
                    className="w-3 text-xs text-muted-foreground"
                  >
                    W
                  </label>
                  <NumberField
                    id="prop-width"
                    value={selected.width ?? 140}
                    min={20}
                    max={4096}
                    onCommit={(width) => patch({ width })}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="prop-height"
                    className="w-3 text-xs text-muted-foreground"
                  >
                    H
                  </label>
                  <NumberField
                    id="prop-height"
                    value={selected.height ?? 28}
                    min={20}
                    max={4096}
                    onCommit={(height) => patch({ height })}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </Section>

          {(can("text") || can("font_family") || can("font_size")) && (
            <Section title="Content">
              {can("text") && (
                <Row label="Text" htmlFor="prop-text">
                  <Input
                    id="prop-text"
                    value={selected.text ?? ""}
                    onChange={(e) => patch({ text: e.target.value })}
                    placeholder="Enter text"
                    className="h-8 text-sm"
                  />
                </Row>
              )}
              {can("font_family") && (
                <Row label="Font" htmlFor="prop-font-family">
                  <Input
                    id="prop-font-family"
                    value={selected.font_family ?? "Arial"}
                    onChange={(e) => patch({ font_family: e.target.value })}
                    placeholder="Arial"
                    className="h-8 text-sm"
                  />
                </Row>
              )}
              {can("font_size") && (
                <Row label="Size" htmlFor="prop-font-size">
                  <NumberField
                    id="prop-font-size"
                    value={selected.font_size ?? 14}
                    min={8}
                    max={200}
                    onCommit={(font_size) => patch({ font_size })}
                    className="h-8 text-sm"
                  />
                </Row>
              )}
            </Section>
          )}

          <Section title="Appearance">
            {can("text_color") && (
              <ColorRow
                label="Text"
                id="prop-text-color"
                value={selected.text_color}
                fallback="#000000"
                onChange={(text_color) => patch({ text_color })}
              />
            )}
            {can("bg_color") && (
              <ColorRow
                label="Background"
                id="prop-bg-color"
                value={selected.bg_color}
                fallback="#ffffff"
                onChange={(bg_color) => patch({ bg_color })}
                onClear={() => patch({ bg_color: undefined })}
              />
            )}
            {can("border_width") && (
              <Row label="Border" htmlFor="prop-border-width">
                <NumberField
                  id="prop-border-width"
                  value={selected.border_width ?? 0}
                  min={0}
                  max={50}
                  onCommit={(border_width) => patch({ border_width })}
                  className="h-8 text-sm"
                />
              </Row>
            )}
            {can("border_color") && (selected.border_width ?? 0) > 0 && (
              <ColorRow
                label="Border color"
                id="prop-border-color"
                value={selected.border_color}
                fallback="#3b82f6"
                onChange={(border_color) => patch({ border_color })}
              />
            )}
            {can("border_radius") && (
              <Row label="Radius" htmlFor="prop-border-radius">
                <NumberField
                  id="prop-border-radius"
                  value={selected.border_radius ?? 6}
                  min={0}
                  max={100}
                  onCommit={(border_radius) => patch({ border_radius })}
                  className="h-8 text-sm"
                />
              </Row>
            )}
            {!can("text_color") && !can("bg_color") && !can("border_width") && (
              <p className="text-xs text-muted-foreground">
                {WIDGETS[selected.name].label} uses fixed styling.
              </p>
            )}
          </Section>

          {can("enable_hover") && (
            <Section title="Interaction">
              <div className="flex items-center justify-between gap-2">
                <label htmlFor="prop-hover" className="text-xs text-muted-foreground">
                  Hover effect
                </label>
                <button
                  id="prop-hover"
                  role="switch"
                  aria-checked={selected.enable_hover ?? false}
                  onClick={() => patch({ enable_hover: !selected.enable_hover })}
                  className={cn(
                    "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    selected.enable_hover ? "bg-primary" : "bg-muted-foreground/30"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 size-4 rounded-full bg-background shadow-sm",
                      "transition-transform duration-150",
                      selected.enable_hover
                        ? "translate-x-[1.125rem]"
                        : "translate-x-0.5"
                    )}
                  />
                </button>
              </div>
              {selected.enable_hover && (
                <div className="animate-in fade-in-0 slide-in-from-top-1 duration-150">
                  <ColorRow
                    label="Hover color"
                    id="prop-hover-color"
                    value={selected.hover_bg_color}
                    fallback="#2563eb"
                    onChange={(hover_bg_color) => patch({ hover_bg_color })}
                  />
                </div>
              )}
            </Section>
          )}

          <div className="p-4">
            <Button
              variant="ghost"
              className="w-full gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => dispatch({ type: "remove", id: selected.id })}
            >
              <Trash2 className="size-4" strokeWidth={1.75} />
              Delete widget
              <kbd className="ml-auto rounded border px-1.5 text-[10px] text-muted-foreground">
                Del
              </kbd>
            </Button>
          </div>
        </div>
      )}
    </aside>
  );
}
