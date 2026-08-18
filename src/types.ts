export type WidgetKind =
  | "Labels"
  | "Button"
  | "CheckBox"
  | "RadioButton"
  | "Entry"
  | "ListBox";

/** A single widget placed on the canvas. Field names match the CustomTkinter
 *  kwargs they are emitted as, so the generator and parser can stay mechanical. */
export interface Component {
  id: string;
  name: WidgetKind;
  x: number;
  y: number;
  text?: string;
  width?: number;
  height?: number;
  text_color?: string;
  /** undefined means "transparent" — inherit the window background. */
  bg_color?: string;
  border_width?: number;
  border_radius?: number;
  border_color?: string;
  font_size?: number;
  enable_hover?: boolean;
  hover_bg_color?: string;
  font_family?: string;
}

/** The whole editor document. This is the single source of truth: the Python
 *  code is derived from it, never stored alongside it. */
export interface EditorState {
  components: Component[];
  selectedId: string | null;
  windowTitle: string;
  windowBackground: string;
  canvasWidth: number;
  canvasHeight: number;
}
