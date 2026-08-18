import { v4 as uuidv4 } from "uuid";
import type { Component, EditorState, WidgetKind } from "@/types";
import { CODEGEN, CTOR_TO_KIND, TRANSPARENT } from "@/codegen/schema";
import {
  ParseError,
  tokenize,
  type Token,
} from "@/codegen/lexer";
import {
  DEFAULT_CANVAS_HEIGHT,
  DEFAULT_CANVAS_WIDTH,
  initialEditorState,
} from "@/state/editorReducer";

export { ParseError };

/** A bare identifier such as `root` or `on_button_click`. */
interface Ref {
  ref: string;
}
type PyValue = string | number | boolean | null | PyValue[] | Ref;

export interface ParseResult {
  state: EditorState;
  /** Non-fatal notes: widgets skipped, values ignored. Worth showing the user. */
  warnings: string[];
}

interface CallArgs {
  positional: PyValue[];
  kwargs: Map<string, PyValue>;
  line: number;
}

interface Assignment {
  ctor: string;
  args: CallArgs;
}

const lastSegment = (dotted: string) => dotted.split(".").pop() as string;

/** Reads `name` or `name.name.name`, returning the dotted text. */
function readDotted(tokens: Token[], start: number): [string, number] {
  let i = start;
  let name = tokens[i].value;
  i++;
  while (
    tokens[i]?.kind === "op" &&
    tokens[i].value === "." &&
    tokens[i + 1]?.kind === "name"
  ) {
    name += "." + tokens[i + 1].value;
    i += 2;
  }
  return [name, i];
}

function readValue(tokens: Token[], start: number): [PyValue, number] {
  const token = tokens[start];
  if (!token) throw new ParseError("Unexpected end of file.", 1);

  if (token.kind === "string") return [token.value, start + 1];
  if (token.kind === "number") return [Number(token.value), start + 1];

  if (token.kind === "name") {
    if (token.value === "True") return [true, start + 1];
    if (token.value === "False") return [false, start + 1];
    if (token.value === "None") return [null, start + 1];
    const [name, next] = readDotted(tokens, start);
    // A call used as a value; we do not model it, keep it as an opaque ref.
    if (tokens[next]?.kind === "op" && tokens[next].value === "(") {
      const after = readCallArgs(tokens, next);
      return [{ ref: name }, after[1]];
    }
    return [{ ref: name }, next];
  }

  if (token.kind === "op" && (token.value === "(" || token.value === "[")) {
    const closer = token.value === "(" ? ")" : "]";
    const items: PyValue[] = [];
    let i = start + 1;
    while (tokens[i] && !(tokens[i].kind === "op" && tokens[i].value === closer)) {
      const [value, next] = readValue(tokens, i);
      items.push(value);
      i = next;
      if (tokens[i]?.kind === "op" && tokens[i].value === ",") i++;
    }
    if (!tokens[i]) {
      throw new ParseError(`Unclosed "${token.value}".`, token.line);
    }
    return [items, i + 1];
  }

  if (token.kind === "op" && token.value === "-" && tokens[start + 1]?.kind === "number") {
    return [-Number(tokens[start + 1].value), start + 2];
  }

  throw new ParseError(`Unexpected "${token.value}".`, token.line);
}

/** `start` points at the opening parenthesis. */
function readCallArgs(tokens: Token[], start: number): [CallArgs, number] {
  const args: CallArgs = {
    positional: [],
    kwargs: new Map(),
    line: tokens[start].line,
  };
  let i = start + 1;

  while (tokens[i] && !(tokens[i].kind === "op" && tokens[i].value === ")")) {
    // keyword argument: NAME = value (but not NAME == value, which we do not emit)
    if (
      tokens[i].kind === "name" &&
      tokens[i + 1]?.kind === "op" &&
      tokens[i + 1].value === "="
    ) {
      const key = tokens[i].value;
      const [value, next] = readValue(tokens, i + 2);
      args.kwargs.set(key, value);
      i = next;
    } else {
      const [value, next] = readValue(tokens, i);
      args.positional.push(value);
      i = next;
    }
    if (tokens[i]?.kind === "op" && tokens[i].value === ",") i++;
  }

  if (!tokens[i]) {
    throw new ParseError("Unclosed argument list.", args.line);
  }
  return [args, i + 1];
}

const asString = (v: PyValue | undefined): string | undefined =>
  typeof v === "string" ? v : undefined;

const asColor = (v: PyValue | undefined): string | undefined => {
  const text = asString(v);
  if (text === undefined || text === TRANSPARENT || text === "") return undefined;
  return text;
};

const asNumber = (v: PyValue | undefined): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? Math.round(v) : undefined;

const asBool = (v: PyValue | undefined): boolean | undefined =>
  typeof v === "boolean" ? v : undefined;

/** Turns a generated `.py` file back into editor state.
 *
 *  The file is read statically — tokenised and pattern-matched — and is never
 *  executed. Statements outside the recognised subset are ignored, so a file
 *  the user has added code to still loads, minus that code. */
export function parseTkinterCode(source: string): ParseResult {
  const tokens = tokenize(source);
  const warnings: string[] = [];

  const assignments = new Map<string, Assignment>();
  const placements: { varName: string; x: number; y: number }[] = [];
  let rootVar: string | null = null;
  let windowTitle: string | undefined;
  let windowBackground: string | undefined;
  let canvasWidth: number | undefined;
  let canvasHeight: number | undefined;

  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].kind !== "name") {
      i++;
      continue;
    }

    const [target, afterTarget] = readDotted(tokens, i);

    // <name> = <ctor>(...)
    if (
      tokens[afterTarget]?.kind === "op" &&
      tokens[afterTarget].value === "=" &&
      tokens[afterTarget + 1]?.kind === "name"
    ) {
      const [ctor, afterCtor] = readDotted(tokens, afterTarget + 1);
      if (tokens[afterCtor]?.kind === "op" && tokens[afterCtor].value === "(") {
        const [args, next] = readCallArgs(tokens, afterCtor);
        if (lastSegment(ctor) === "CTk" || lastSegment(ctor) === "Tk") {
          rootVar = target;
        } else {
          assignments.set(target, { ctor, args });
        }
        i = next;
        continue;
      }
      i = afterTarget + 1;
      continue;
    }

    // <receiver>.<method>(...)
    if (
      target.includes(".") &&
      tokens[afterTarget]?.kind === "op" &&
      tokens[afterTarget].value === "("
    ) {
      const [args, next] = readCallArgs(tokens, afterTarget);
      const method = lastSegment(target);
      const receiver = target.slice(0, -(method.length + 1));

      if (method === "place") {
        const x = asNumber(args.kwargs.get("x"));
        const y = asNumber(args.kwargs.get("y"));
        if (x !== undefined && y !== undefined) {
          placements.push({ varName: receiver, x, y });
        }
      } else if (rootVar === null || receiver === rootVar) {
        if (method === "title") {
          windowTitle = asString(args.positional[0]) ?? windowTitle;
        } else if (method === "geometry") {
          const geometry = asString(args.positional[0]) ?? "";
          const match = /^(\d+)\s*x\s*(\d+)/.exec(geometry);
          if (match) {
            canvasWidth = Number(match[1]);
            canvasHeight = Number(match[2]);
          }
        } else if (method === "configure") {
          windowBackground =
            asColor(args.kwargs.get("fg_color")) ?? windowBackground;
        }
      }
      i = next;
      continue;
    }

    i = afterTarget;
  }

  // Order comes from the .place() calls, which is the order the editor wrote them.
  const components: Component[] = [];
  const seen = new Set<string>();

  for (const { varName, x, y } of placements) {
    const assignment = assignments.get(varName);
    if (!assignment) continue;
    if (seen.has(varName)) continue;
    seen.add(varName);

    const kind = CTOR_TO_KIND[lastSegment(assignment.ctor)] as
      | WidgetKind
      | undefined;
    if (!kind) {
      warnings.push(`Skipped "${varName}": ${assignment.ctor} is not supported.`);
      continue;
    }

    const spec = CODEGEN[kind];
    const kwargs = assignment.args.kwargs;
    // Collected loosely because the target property is only known at runtime,
    // then narrowed once when the component is assembled.
    const props: Record<string, unknown> = {};

    for (const field of spec.fields) {
      const raw = kwargs.get(field.kwarg);
      if (raw === undefined) continue;
      switch (field.type) {
        case "text": {
          const value = asString(raw);
          if (value !== undefined) props[field.prop] = value;
          break;
        }
        case "color":
          // Deliberately stores undefined for "transparent": the absence of a
          // colour is itself the value the editor round-trips.
          props[field.prop] = asColor(raw);
          break;
        case "number": {
          const value = asNumber(raw);
          if (value !== undefined) props[field.prop] = value;
          break;
        }
        case "bool": {
          const value = asBool(raw);
          if (value !== undefined) props[field.prop] = value;
          break;
        }
      }
    }

    if (spec.font) {
      const font = kwargs.get("font");
      if (Array.isArray(font)) {
        const size = asNumber(font[1]);
        if (size !== undefined) props.font_size = size;
        if (spec.font.familyProp) {
          const family = asString(font[0]);
          if (family !== undefined) props.font_family = family;
        }
      }
    }

    components.push({
      ...(props as Omit<Component, "id" | "name" | "x" | "y">),
      id: uuidv4(),
      name: kind,
      x,
      y,
    });
  }

  const skipped = [...assignments.keys()].filter((name) => !seen.has(name));
  for (const name of skipped) {
    const kind = CTOR_TO_KIND[lastSegment(assignments.get(name)!.ctor)];
    if (kind) {
      warnings.push(`Skipped "${name}": it is never given a .place(x=, y=).`);
    }
  }

  if (components.length === 0 && windowTitle === undefined) {
    throw new ParseError(
      "No Tkinter widgets found. Is this a file saved from this editor?",
      1
    );
  }

  const state: EditorState = {
    components,
    selectedId: null,
    windowTitle: windowTitle ?? initialEditorState.windowTitle,
    windowBackground: windowBackground ?? initialEditorState.windowBackground,
    canvasWidth: canvasWidth ?? DEFAULT_CANVAS_WIDTH,
    canvasHeight: canvasHeight ?? DEFAULT_CANVAS_HEIGHT,
  };

  return { state, warnings };
}
