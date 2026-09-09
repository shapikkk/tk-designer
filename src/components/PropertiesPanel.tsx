import type { Dispatch, ReactNode } from "react";
import { Copy, MousePointer2, Trash2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NumberField } from "@/components/NumberField";
import { cn } from "@/lib/utils";
import type { ComponentProps, EditorState } from "@/types";
import type { PropGroup, PropSpec, PropValue } from "@/frameworks/types";
import { getFramework, getWidget } from "@/frameworks";
import { activeDoc } from "@/types";
import type { EditorAction } from "@/state/editorReducer";

const GROUP_ORDER: PropGroup[] = [
  "Content",
  "Text",
  "Appearance",
  "Layout",
  "Behavior",
];

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

function Row({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr] items-center gap-2">
      <label
        htmlFor={htmlFor}
        className="truncate text-xs text-muted-foreground"
        title={hint ?? label}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function Toggle({
  id,
  checked,
  onChange,
}: {
  id: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "bg-primary" : "bg-muted-foreground/30"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 size-4 rounded-full bg-background shadow-sm",
          "transition-transform duration-150",
          checked ? "translate-x-[1.125rem]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function ColorField({
  id,
  value,
  clearable,
  onChange,
  onClear,
}: {
  id: string;
  value: string | undefined;
  clearable?: boolean;
  onChange: (value: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Input
        id={id}
        type="color"
        value={asHex(value, "#ffffff")}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 w-10 shrink-0 p-1"
      />
      <Input
        value={value ?? ""}
        placeholder="none"
        onChange={(e) => onChange(e.target.value)}
        className="h-8 min-w-0 flex-1 font-mono text-[11px]"
      />
      {clearable && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 shrink-0 px-1.5 text-[11px]"
          onClick={onClear}
          disabled={value === undefined}
          title="Clear this colour"
        >
          ✕
        </Button>
      )}
    </div>
  );
}

function PropField({
  spec,
  value,
  onChange,
}: {
  spec: PropSpec;
  value: PropValue | undefined;
  onChange: (value: PropValue | undefined) => void;
}) {
  const id = `prop-${spec.key}`;
  const label = spec.unit ? `${spec.label} (${spec.unit})` : spec.label;

  switch (spec.type) {
    case "text":
      return (
        <Row label={label} htmlFor={id} hint={spec.kwarg || spec.key}>
          <Input
            id={id}
            value={typeof value === "string" ? value : ""}
            placeholder={spec.placeholder ?? ""}
            onChange={(e) =>
              onChange(e.target.value === "" ? undefined : e.target.value)
            }
            className="h-8 text-sm"
          />
        </Row>
      );

    case "number":
      return (
        <Row label={label} htmlFor={id} hint={spec.kwarg || spec.key}>
          <NumberField
            id={id}
            value={typeof value === "number" ? value : undefined}
            min={spec.min}
            max={spec.max}
            allowFraction={
              spec.min !== undefined &&
              spec.max !== undefined &&
              spec.max - spec.min <= 1
            }
            placeholder="default"
            onCommit={(next) => onChange(next)}
            onClear={() => onChange(undefined)}
            className="h-8 text-sm"
          />
        </Row>
      );

    case "color":
      return (
        <Row label={label} htmlFor={id} hint={spec.kwarg || spec.key}>
          <ColorField
            id={id}
            value={typeof value === "string" ? value : undefined}
            clearable={spec.clearable}
            onChange={(next) => onChange(next)}
            onClear={() => onChange(undefined)}
          />
        </Row>
      );

    case "bool":
      return (
        <Row label={label} htmlFor={id} hint={spec.kwarg || spec.key}>
          <Toggle
            id={id}
            checked={value === true}
            onChange={(next) => onChange(next)}
          />
        </Row>
      );

    case "select":
      return (
        <Row label={label} htmlFor={id} hint={spec.kwarg || spec.key}>
          <select
            id={id}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
            className={cn(
              "h-8 w-full rounded-md border border-input bg-transparent px-2",
              "text-sm shadow-xs outline-none transition-[color,box-shadow]",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            )}
          >
            {spec.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Row>
      );

    case "list":
      return (
        <Row label={label} htmlFor={id} hint="One value per line">
          <textarea
            id={id}
            rows={Math.min(6, Math.max(2, (Array.isArray(value) ? value : []).length))}
            value={Array.isArray(value) ? value.join("\n") : ""}
            onChange={(e) =>
              onChange(
                e.target.value
                  .split("\n")
                  .map((item) => item.trim())
                  .filter((item) => item.length > 0)
              )
            }
            className={cn(
              "w-full rounded-md border border-input bg-transparent px-2 py-1.5",
              "text-sm shadow-xs outline-none transition-[color,box-shadow]",
              "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            )}
          />
        </Row>
      );
  }
}

interface PropertiesPanelProps {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
}

export default function PropertiesPanel({
  state,
  dispatch,
}: PropertiesPanelProps) {
  const doc = activeDoc(state);
  const framework = getFramework(state.framework);
  const selected = doc.components.find((c) => c.id === doc.selectedId);
  const widget = selected ? getWidget(state.framework, selected.kind) : null;

  const patch = (values: ComponentProps) => {
    if (!selected) return;
    dispatch({ type: "update", id: selected.id, patch: values });
  };

  const groups = widget
    ? GROUP_ORDER.map((group) => ({
        group,
        specs: widget.props.filter((spec) => spec.group === group),
      })).filter((entry) => entry.specs.length > 0)
    : [];

  return (
    <aside className="scroll-slim flex w-[320px] shrink-0 flex-col overflow-y-auto border-l bg-background">
      <Section title={`${framework.label} window`}>
        <Row label="Title" htmlFor="window-title">
          <Input
            id="window-title"
            value={doc.windowTitle}
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
        <Row label="Background" htmlFor="window-bg">
          <ColorField
            id="window-bg"
            value={doc.windowBackground}
            onChange={(windowBackground) =>
              dispatch({ type: "setWindow", patch: { windowBackground } })
            }
            onClear={() =>
              dispatch({
                type: "setWindow",
                patch: {
                  windowBackground: framework.defaultWindow.background,
                },
              })
            }
          />
        </Row>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2">
            <label htmlFor="win-w" className="w-3 text-xs text-muted-foreground">
              W
            </label>
            <NumberField
              id="win-w"
              value={doc.canvasWidth}
              min={200}
              max={4096}
              onCommit={(canvasWidth) =>
                dispatch({ type: "setWindow", patch: { canvasWidth } })
              }
              className="h-8 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="win-h" className="w-3 text-xs text-muted-foreground">
              H
            </label>
            <NumberField
              id="win-h"
              value={doc.canvasHeight}
              min={200}
              max={4096}
              onCommit={(canvasHeight) =>
                dispatch({ type: "setWindow", patch: { canvasHeight } })
              }
              className="h-8 text-sm"
            />
          </div>
        </div>
      </Section>

      {!selected || !widget ? (
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
            <widget.icon
              className="size-4 shrink-0 text-primary"
              strokeWidth={1.75}
            />
            <span className="text-sm font-medium">{widget.label}</span>
            <code className="ml-auto truncate font-mono text-[10px] text-muted-foreground">
              {widget.ctor}
            </code>
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
                  max={doc.canvasWidth}
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
                  max={doc.canvasHeight}
                  onCommit={(y) =>
                    dispatch({ type: "move", id: selected.id, x: selected.x, y })
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </Section>

          {groups.map(({ group, specs }) => (
            <Section key={group} title={group}>
              {specs.map((spec) => (
                <PropField
                  key={spec.key}
                  spec={spec}
                  value={selected.props[spec.key]}
                  onChange={(value) => patch({ [spec.key]: value })}
                />
              ))}
            </Section>
          ))}

          <div className="space-y-1.5 p-4">
            <Button
              variant="ghost"
              className="w-full gap-2"
              onClick={() => dispatch({ type: "duplicate", id: selected.id })}
            >
              <Copy className="size-4" strokeWidth={1.75} />
              Duplicate
              <kbd className="ml-auto rounded border px-1.5 text-[10px] text-muted-foreground">
                Ctrl D
              </kbd>
            </Button>
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
