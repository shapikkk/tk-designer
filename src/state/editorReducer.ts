import { v4 as uuidv4 } from "uuid";
import type {
  Component,
  ComponentProps,
  EditorState,
  FrameworkDoc,
} from "@/types";
import type { FrameworkId } from "@/frameworks/types";
import {
  DEFAULT_FRAMEWORK,
  FRAMEWORK_IDS,
  defaultProps,
  getFramework,
  getWidget,
} from "@/frameworks";
import type { WindowSize } from "@/lib/viewport";

const clamp = (value: number, max: number) =>
  Math.round(Math.min(Math.max(value, 0), Math.max(max, 0)));

export const emptyDoc = (
  framework: FrameworkId,
  size?: WindowSize
): FrameworkDoc => {
  const { defaultWindow } = getFramework(framework);
  return {
    components: [],
    selectedId: null,
    windowTitle: "My App",
    windowBackground: defaultWindow.background,
    canvasWidth: size?.width ?? defaultWindow.width,
    canvasHeight: size?.height ?? defaultWindow.height,
  };
};

export const emptyDocs = (
  size?: WindowSize
): Record<FrameworkId, FrameworkDoc> =>
  Object.fromEntries(
    FRAMEWORK_IDS.map((id) => [id, emptyDoc(id, size)])
  ) as Record<FrameworkId, FrameworkDoc>;

export const createInitialState = (size?: WindowSize): EditorState => ({
  framework: DEFAULT_FRAMEWORK,
  docs: emptyDocs(size),
});

export const initialEditorState: EditorState = createInitialState();

type WindowPatch = Partial<
  Pick<
    FrameworkDoc,
    "windowTitle" | "windowBackground" | "canvasWidth" | "canvasHeight"
  >
>;

export type EditorAction =
  | { type: "add"; kind: string; x: number; y: number }
  | { type: "move"; id: string; x: number; y: number }
  | { type: "update"; id: string; patch: ComponentProps }
  | { type: "duplicate"; id: string }
  | { type: "remove"; id: string }
  | { type: "select"; id: string | null }
  | { type: "setWindow"; patch: WindowPatch }
  | { type: "setFramework"; framework: FrameworkId }
  | { type: "clear" }
  | { type: "load"; framework: FrameworkId; doc: FrameworkDoc };

const withDoc = (
  state: EditorState,
  update: (doc: FrameworkDoc) => FrameworkDoc
): EditorState => ({
  ...state,
  docs: { ...state.docs, [state.framework]: update(state.docs[state.framework]) },
});

export function editorReducer(
  state: EditorState,
  action: EditorAction
): EditorState {
  switch (action.type) {
    case "setFramework":
      return state.framework === action.framework
        ? state
        : { ...state, framework: action.framework };

    case "load":
      return {
        ...state,
        framework: action.framework,
        docs: { ...state.docs, [action.framework]: action.doc },
      };

    case "clear":
      return withDoc(state, (doc) => ({
        ...doc,
        components: [],
        selectedId: null,
      }));

    case "add":
      return withDoc(state, (doc) => {
        const widget = getWidget(state.framework, action.kind);
        const component: Component = {
          id: uuidv4(),
          kind: widget.key,
          x: clamp(action.x, doc.canvasWidth),
          y: clamp(action.y, doc.canvasHeight),
          props: defaultProps(widget),
        };
        return {
          ...doc,
          components: [...doc.components, component],
          selectedId: component.id,
        };
      });

    case "move":
      return withDoc(state, (doc) => ({
        ...doc,
        components: doc.components.map((c) =>
          c.id === action.id
            ? {
                ...c,
                x: clamp(action.x, doc.canvasWidth),
                y: clamp(action.y, doc.canvasHeight),
              }
            : c
        ),
      }));

    case "update":
      return withDoc(state, (doc) => ({
        ...doc,
        components: doc.components.map((c) => {
          if (c.id !== action.id) return c;
          const props: ComponentProps = { ...c.props };
          for (const [key, value] of Object.entries(action.patch)) {
            if (value === undefined) {
              delete props[key];
            } else {
              props[key] = value;
            }
          }
          return { ...c, props };
        }),
      }));

    case "duplicate":
      return withDoc(state, (doc) => {
        const source = doc.components.find((c) => c.id === action.id);
        if (!source) return doc;
        const copy: Component = {
          ...source,
          id: uuidv4(),
          x: clamp(source.x + 20, doc.canvasWidth),
          y: clamp(source.y + 20, doc.canvasHeight),
          props: { ...source.props },
        };
        return {
          ...doc,
          components: [...doc.components, copy],
          selectedId: copy.id,
        };
      });

    case "remove":
      return withDoc(state, (doc) => ({
        ...doc,
        components: doc.components.filter((c) => c.id !== action.id),
        selectedId: doc.selectedId === action.id ? null : doc.selectedId,
      }));

    case "select":
      return withDoc(state, (doc) => ({ ...doc, selectedId: action.id }));

    case "setWindow":
      return withDoc(state, (doc) => ({ ...doc, ...action.patch }));

    default:
      return state;
  }
}
