import type { FrameworkId, PropValue } from "@/frameworks/types";

export type { FrameworkId, PropValue };

export type ComponentProps = Record<string, PropValue | undefined>;

export interface Component {
  id: string;
  kind: string;
  x: number;
  y: number;
  props: ComponentProps;
}

export interface FrameworkDoc {
  components: Component[];
  selectedId: string | null;
  windowTitle: string;
  windowBackground: string;
  canvasWidth: number;
  canvasHeight: number;
}

export interface EditorState {
  framework: FrameworkId;
  docs: Record<FrameworkId, FrameworkDoc>;
}

export const activeDoc = (state: EditorState): FrameworkDoc =>
  state.docs[state.framework];
