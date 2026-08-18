import { v4 as uuidv4 } from "uuid";
import type { Component, EditorState, WidgetKind } from "@/types";
import { WIDGETS } from "@/widgets";

export const DEFAULT_CANVAS_WIDTH = 900;
export const DEFAULT_CANVAS_HEIGHT = 600;

/** Keeps a dropped or hand-typed widget inside the window it will be placed in.
 *  Both drag and the Properties panel go through here, so there is exactly one
 *  coordinate system in the app. */
const clamp = (value: number, max: number) =>
  Math.round(Math.min(Math.max(value, 0), Math.max(max, 0)));

export const initialEditorState: EditorState = {
  components: [],
  selectedId: null,
  windowTitle: "My App",
  windowBackground: "#ffffff",
  canvasWidth: DEFAULT_CANVAS_WIDTH,
  canvasHeight: DEFAULT_CANVAS_HEIGHT,
};

type WindowPatch = Partial<
  Pick<
    EditorState,
    "windowTitle" | "windowBackground" | "canvasWidth" | "canvasHeight"
  >
>;

export type EditorAction =
  | { type: "add"; name: WidgetKind; x: number; y: number }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "update"; id: string; patch: Partial<Component> }
  | { type: "remove"; id: string }
  | { type: "select"; id: string | null }
  | { type: "setWindow"; patch: WindowPatch }
  | { type: "load"; state: EditorState };

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "add": {
      const component: Component = {
        id: uuidv4(),
        name: action.name,
        ...WIDGETS[action.name].defaults,
        x: clamp(action.x, state.canvasWidth),
        y: clamp(action.y, state.canvasHeight),
      };
      return {
        ...state,
        components: [...state.components, component],
        selectedId: component.id,
      };
    }

    case "move":
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === action.id
            ? {
                ...c,
                x: clamp(action.x, state.canvasWidth),
                y: clamp(action.y, state.canvasHeight),
              }
            : c
        ),
      };

    case "update":
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === action.id ? { ...c, ...action.patch, id: c.id } : c
        ),
      };

    case "remove":
      return {
        ...state,
        components: state.components.filter((c) => c.id !== action.id),
        selectedId: state.selectedId === action.id ? null : state.selectedId,
      };

    case "select":
      return { ...state, selectedId: action.id };

    case "setWindow":
      return { ...state, ...action.patch };

    case "load":
      return action.state;

    default:
      return state;
  }
}
