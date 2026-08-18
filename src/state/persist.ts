import type { Component, EditorState } from "@/types";
import { WIDGETS } from "@/widgets";
import { initialEditorState } from "@/state/editorReducer";

const KEY = "tk-designer:editor";

const isWidgetKind = (value: unknown): value is Component["name"] =>
  typeof value === "string" && value in WIDGETS;

/** Anything in localStorage is untrusted input: it may be from an older build,
 *  hand-edited, or corrupt. Validate rather than cast. */
function reviveState(raw: unknown): EditorState | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as Record<string, unknown>;
  if (!Array.isArray(candidate.components)) return null;

  const components: Component[] = [];
  for (const entry of candidate.components) {
    if (!entry || typeof entry !== "object") continue;
    const c = entry as Record<string, unknown>;
    if (typeof c.id !== "string" || !isWidgetKind(c.name)) continue;
    if (typeof c.x !== "number" || typeof c.y !== "number") continue;
    components.push(c as unknown as Component);
  }

  const num = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  const str = (value: unknown, fallback: string) =>
    typeof value === "string" ? value : fallback;

  return {
    components,
    selectedId: null,
    windowTitle: str(candidate.windowTitle, initialEditorState.windowTitle),
    windowBackground: str(
      candidate.windowBackground,
      initialEditorState.windowBackground
    ),
    canvasWidth: num(candidate.canvasWidth, initialEditorState.canvasWidth),
    canvasHeight: num(candidate.canvasHeight, initialEditorState.canvasHeight),
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
    // Quota exceeded or storage disabled — autosave is a convenience, not a
    // guarantee, and the user still has Save Portfolio.
  }
}
