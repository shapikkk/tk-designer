import type {
  Component,
  ComponentProps,
  EditorState,
  FrameworkDoc,
} from "@/types";
import type { FrameworkId, PropValue } from "@/frameworks/types";
import {
  DEFAULT_FRAMEWORK,
  FRAMEWORK_IDS,
  findWidget,
  isFrameworkId,
  propSpec,
} from "@/frameworks";
import { emptyDoc, emptyDocs } from "@/state/editorReducer";

const KEY = "tk-designer:editor";

const isPropValue = (value: unknown): value is PropValue =>
  typeof value === "string" ||
  typeof value === "number" ||
  typeof value === "boolean" ||
  (Array.isArray(value) && value.every((item) => typeof item === "string"));

function reviveProps(
  framework: FrameworkId,
  kind: string,
  raw: unknown
): ComponentProps {
  const widget = findWidget(framework, kind);
  if (!widget || !raw || typeof raw !== "object") return {};
  const props: ComponentProps = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!propSpec(widget, key)) continue;
    if (isPropValue(value)) props[key] = value;
  }
  return props;
}

function reviveDoc(framework: FrameworkId, raw: unknown): FrameworkDoc {
  const fallback = emptyDoc(framework);
  if (!raw || typeof raw !== "object") return fallback;
  const candidate = raw as Record<string, unknown>;

  const components: Component[] = [];
  if (Array.isArray(candidate.components)) {
    for (const entry of candidate.components) {
      if (!entry || typeof entry !== "object") continue;
      const c = entry as Record<string, unknown>;
      if (typeof c.id !== "string" || typeof c.kind !== "string") continue;
      if (typeof c.x !== "number" || typeof c.y !== "number") continue;
      if (!findWidget(framework, c.kind)) continue;
      components.push({
        id: c.id,
        kind: c.kind,
        x: c.x,
        y: c.y,
        props: reviveProps(framework, c.kind, c.props),
      });
    }
  }

  const num = (value: unknown, fallbackValue: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallbackValue;
  const str = (value: unknown, fallbackValue: string) =>
    typeof value === "string" ? value : fallbackValue;

  return {
    components,
    selectedId: null,
    windowTitle: str(candidate.windowTitle, fallback.windowTitle),
    windowBackground: str(
      candidate.windowBackground,
      fallback.windowBackground
    ),
    canvasWidth: num(candidate.canvasWidth, fallback.canvasWidth),
    canvasHeight: num(candidate.canvasHeight, fallback.canvasHeight),
  };
}

function reviveState(raw: unknown): EditorState | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  const docs = emptyDocs();
  const stored = (candidate.docs ?? {}) as Record<string, unknown>;

  for (const id of FRAMEWORK_IDS) {
    if (stored[id] !== undefined) docs[id] = reviveDoc(id, stored[id]);
  }

  return {
    framework: isFrameworkId(candidate.framework)
      ? candidate.framework
      : DEFAULT_FRAMEWORK,
    docs,
  };
}

export function loadPersisted(): EditorState | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? reviveState(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function persist(state: EditorState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    return;
  }
}
