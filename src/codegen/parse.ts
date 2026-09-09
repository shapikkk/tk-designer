import { v4 as uuidv4 } from "uuid";
import type { Component, ComponentProps, FrameworkDoc } from "@/types";
import type {
  FrameworkId,
  PropSpec,
  PropValue,
  WidgetDef,
} from "@/frameworks/types";
import { FRAMEWORKS, FRAMEWORK_IDS, getFramework } from "@/frameworks";
import { ParseError, tokenize, type Token } from "@/codegen/lexer";
import { emptyDoc } from "@/state/editorReducer";

export { ParseError };

interface Ref {
  ref: string;
  args?: CallArgs;
}

type PyValue = string | number | boolean | null | PyValue[] | Ref;

interface CallArgs {
  positional: PyValue[];
  kwargs: Map<string, PyValue>;
  line: number;
}

interface Assignment {
  ctor: string;
  args: CallArgs;
}

export interface ParseResult {
  framework: FrameworkId;
  doc: FrameworkDoc;
  warnings: string[];
}

const lastSegment = (dotted: string) => dotted.split(".").pop() as string;

const isRef = (value: PyValue): value is Ref =>
  typeof value === "object" && value !== null && !Array.isArray(value);

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

  if (token.kind === "op" && token.value === "-") {
    const [inner, next] = readValue(tokens, start + 1);
    return [typeof inner === "number" ? -inner : inner, next];
  }

  if (token.kind === "name") {
    if (token.value === "True") return [true, start + 1];
    if (token.value === "False") return [false, start + 1];
    if (token.value === "None") return [null, start + 1];
    const [name, next] = readDotted(tokens, start);
    if (tokens[next]?.kind === "op" && tokens[next].value === "(") {
      const [args, after] = readCallArgs(tokens, next);
      return [{ ref: name, args }, after];
    }
    return [{ ref: name }, next];
  }

  if (token.kind === "op" && (token.value === "(" || token.value === "[")) {
    const closer = token.value === "(" ? ")" : "]";
    const items: PyValue[] = [];
    let i = start + 1;
    while (tokens[i] && !(tokens[i].kind === "op" && tokens[i].value === closer)) {
      if (tokens[i].kind === "op" && tokens[i].value === ",") {
        i++;
        continue;
      }
      const [item, next] = readValue(tokens, i);
      items.push(item);
      i = next;
    }
    if (!tokens[i]) {
      throw new ParseError("Unclosed bracket.", token.line);
    }
    return [items, i + 1];
  }

  throw new ParseError(`Unexpected ${token.kind} "${token.value}".`, token.line);
}

function readCallArgs(tokens: Token[], open: number): [CallArgs, number] {
  const line = tokens[open].line;
  const args: CallArgs = { positional: [], kwargs: new Map(), line };
  let i = open + 1;

  while (tokens[i] && !(tokens[i].kind === "op" && tokens[i].value === ")")) {
    if (tokens[i].kind === "op" && tokens[i].value === ",") {
      i++;
      continue;
    }

    if (
      tokens[i].kind === "name" &&
      tokens[i + 1]?.kind === "op" &&
      tokens[i + 1].value === "=" &&
      !(tokens[i + 2]?.kind === "op" && tokens[i + 2].value === "=")
    ) {
      const key = tokens[i].value;
      const [value, next] = readValue(tokens, i + 2);
      args.kwargs.set(key, value);
      i = next;
      continue;
    }

    try {
      const [value, next] = readValue(tokens, i);
      args.positional.push(value);
      i = next;
    } catch {
      i++;
    }
  }

  if (!tokens[i]) {
    throw new ParseError("Unclosed call: the file ends mid-statement.", line);
  }
  return [args, i + 1];
}

const asString = (value: PyValue | undefined): string | undefined =>
  typeof value === "string" ? value : undefined;

const asNumber = (value: PyValue | undefined): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const asBool = (value: PyValue | undefined): boolean | undefined =>
  typeof value === "boolean" ? value : undefined;

function parsePropValue(
  spec: PropSpec,
  raw: PyValue | undefined
): PropValue | undefined {
  if (raw === undefined || raw === null) return undefined;

  switch (spec.type) {
    case "text": {
      if (spec.enumPrefix && isRef(raw)) {
        return lastSegment(raw.ref).toLowerCase();
      }
      return asString(raw);
    }
    case "color": {
      const value = asString(raw);
      if (value === undefined) return undefined;
      if (spec.transparentValue && value === spec.transparentValue) {
        return undefined;
      }
      return value;
    }
    case "number":
      return asNumber(raw);
    case "bool":
      return asBool(raw);
    case "select": {
      if (isRef(raw)) {
        const code = raw.ref;
        const match = spec.options?.find(
          (option) =>
            option.code === code || lastSegment(code).toLowerCase() === option.value
        );
        return match?.value;
      }
      const value = asString(raw);
      return spec.options?.find((option) => option.value === value)?.value;
    }
    case "list": {
      if (!Array.isArray(raw)) return undefined;
      const items: string[] = [];
      for (const entry of raw) {
        if (typeof entry === "string") {
          items.push(entry);
          continue;
        }
        if (isRef(entry) && entry.args) {
          const first =
            asString(entry.args.positional[0]) ??
            asString(entry.args.kwargs.get("text")) ??
            asString(entry.args.kwargs.get("key"));
          if (first !== undefined) items.push(first);
        }
      }
      return items;
    }
  }
}

function readFont(widget: WidgetDef, value: PyValue | undefined): ComponentProps {
  const props: ComponentProps = {};
  if (!widget.font || !Array.isArray(value)) return props;
  const { familyKey, sizeKey, weightKey } = widget.font;

  const family = asString(value[0]);
  if (familyKey && family !== undefined) props[familyKey] = family;
  const size = asNumber(value[1]);
  if (sizeKey && size !== undefined) props[sizeKey] = size;
  const weight = asString(value[2]);
  if (weightKey) props[weightKey] = weight ?? "normal";

  return props;
}

interface Statements {
  assignments: Map<string, Assignment>;
  assignmentOrder: string[];
  placements: { varName: string; x: number; y: number }[];
  attributes: { target: string; value: PyValue }[];
  calls: { receiver: string; method: string; args: CallArgs }[];
  roots: Map<string, string>;
}

function collect(tokens: Token[]): Statements {
  const out: Statements = {
    assignments: new Map(),
    assignmentOrder: [],
    placements: [],
    attributes: [],
    calls: [],
    roots: new Map(),
  };

  let i = 0;
  while (i < tokens.length) {
    if (tokens[i].kind !== "name") {
      i++;
      continue;
    }

    const [target, afterTarget] = readDotted(tokens, i);
    const next = tokens[afterTarget];

    if (next?.kind === "op" && next.value === "=") {
      if (
        tokens[afterTarget + 1]?.kind === "name" &&
        !["True", "False", "None"].includes(tokens[afterTarget + 1].value)
      ) {
        const [ctor, afterCtor] = readDotted(tokens, afterTarget + 1);
        if (tokens[afterCtor]?.kind === "op" && tokens[afterCtor].value === "(") {
          const [args, after] = readCallArgs(tokens, afterCtor);
          const ctorName = lastSegment(ctor);
          if (ctorName === "CTk" || ctorName === "Tk") {
            out.roots.set(target, ctorName);
          } else if (!target.includes(".")) {
            out.assignments.set(target, { ctor, args });
            out.assignmentOrder.push(target);
          }
          i = after;
          continue;
        }
      }

      if (target.includes(".")) {
        try {
          const [value, after] = readValue(tokens, afterTarget + 1);
          out.attributes.push({ target, value });
          i = after;
          continue;
        } catch {
          i = afterTarget + 1;
          continue;
        }
      }

      i = afterTarget + 1;
      continue;
    }

    if (target.includes(".") && next?.kind === "op" && next.value === "(") {
      const [args, after] = readCallArgs(tokens, afterTarget);
      const method = lastSegment(target);
      const receiver = target.slice(0, -(method.length + 1));

      if (method === "place") {
        const x = asNumber(args.kwargs.get("x"));
        const y = asNumber(args.kwargs.get("y"));
        if (x !== undefined && y !== undefined) {
          out.placements.push({ varName: receiver, x, y });
        }
      }
      out.calls.push({ receiver, method, args });
      i = after;
      continue;
    }

    i = afterTarget;
  }

  return out;
}

const importedModules = (source: string): Set<string> => {
  const modules = new Set<string>();
  const pattern = /^[^\S\r\n]*(?:import|from)[^\S\r\n]+([A-Za-z_][\w.]*)/gm;
  for (const match of source.matchAll(pattern)) {
    modules.add(match[1].split(".")[0]);
  }
  return modules;
};

function detectFramework(
  statements: Statements,
  modules: Set<string>
): FrameworkId {
  if (modules.has("flet")) return "flet";
  if (modules.has("customtkinter")) return "customtkinter";

  const ctors = [...statements.assignments.values()].map((assignment) =>
    lastSegment(assignment.ctor)
  );

  let best: FrameworkId = "tkinter";
  let bestScore = 0;
  for (const id of FRAMEWORK_IDS) {
    const known = new Set(
      FRAMEWORKS[id].widgets.map((widget) => lastSegment(widget.ctor))
    );
    const score = ctors.filter((ctor) => known.has(ctor)).length;
    if (score > bestScore) {
      best = id;
      bestScore = score;
    }
  }

  if (bestScore === 0 && modules.has("tkinter")) return "tkinter";
  return best;
}

function buildComponent(
  widget: WidgetDef,
  args: CallArgs,
  x: number,
  y: number
): Component {
  const props: ComponentProps = {};

  for (const spec of widget.props) {
    if (spec.virtual || !spec.kwarg) continue;
    const parsed = parsePropValue(spec, args.kwargs.get(spec.kwarg));
    if (parsed !== undefined) props[spec.key] = parsed;
  }

  if (widget.font) {
    Object.assign(props, readFont(widget, args.kwargs.get(widget.font.kwarg)));
  }

  return { id: uuidv4(), kind: widget.key, x, y, props };
}

function readListboxItems(
  widget: WidgetDef,
  varName: string,
  statements: Statements
): string[] | undefined {
  const spec = widget.props.find((entry) => entry.type === "list" && entry.virtual);
  if (!spec) return undefined;
  const items: string[] = [];
  for (const call of statements.calls) {
    if (call.receiver !== varName || call.method !== "insert") continue;
    for (const value of call.args.positional) {
      const text = asString(value);
      if (text !== undefined) items.push(text);
    }
  }
  return items.length > 0 ? items : undefined;
}

function windowFromTk(
  statements: Statements,
  framework: FrameworkId,
  doc: FrameworkDoc
): void {
  const rootVar = [...statements.roots.keys()][0] ?? null;
  const backgroundKwarg = framework === "customtkinter" ? "fg_color" : "bg";

  for (const call of statements.calls) {
    if (rootVar !== null && call.receiver !== rootVar) continue;
    if (call.method === "title") {
      const title = asString(call.args.positional[0]);
      if (title !== undefined) doc.windowTitle = title;
    } else if (call.method === "geometry") {
      const geometry = asString(call.args.positional[0]) ?? "";
      const match = /^(\d+)\s*x\s*(\d+)/.exec(geometry);
      if (match) {
        doc.canvasWidth = Number(match[1]);
        doc.canvasHeight = Number(match[2]);
      }
    } else if (call.method === "configure") {
      const background =
        asString(call.args.kwargs.get(backgroundKwarg)) ??
        asString(call.args.kwargs.get("bg")) ??
        asString(call.args.kwargs.get("fg_color"));
      if (background !== undefined && background !== "transparent") {
        doc.windowBackground = background;
      }
    }
  }
}

function windowFromFlet(statements: Statements, doc: FrameworkDoc): void {
  for (const { target, value } of statements.attributes) {
    const attribute = target.split(".").slice(1).join(".");
    if (attribute === "title") {
      const title = asString(value);
      if (title !== undefined) doc.windowTitle = title;
    } else if (attribute === "bgcolor") {
      const background = asString(value);
      if (background !== undefined) doc.windowBackground = background;
    } else if (attribute === "window.width" || attribute === "window_width") {
      const width = asNumber(value);
      if (width !== undefined) doc.canvasWidth = width;
    } else if (attribute === "window.height" || attribute === "window_height") {
      const height = asNumber(value);
      if (height !== undefined) doc.canvasHeight = height;
    }
  }
}

export function parsePythonCode(source: string): ParseResult {
  const tokens = tokenize(source);
  const statements = collect(tokens);
  const framework = detectFramework(statements, importedModules(source));
  const definition = getFramework(framework);
  const doc = emptyDoc(framework);
  const warnings: string[] = [];

  const byCtor = new Map<string, WidgetDef>(
    definition.widgets.map((widget) => [lastSegment(widget.ctor), widget])
  );

  const positioned: { varName: string; x: number; y: number }[] = [];
  if (framework === "flet") {
    const offsets = new Map<string, { x: number; y: number }>();
    for (const { target, value } of statements.attributes) {
      const [receiver, attribute] = [
        target.slice(0, target.lastIndexOf(".")),
        lastSegment(target),
      ];
      if (attribute !== "left" && attribute !== "top") continue;
      const number = asNumber(value);
      if (number === undefined) continue;
      const current = offsets.get(receiver) ?? { x: 0, y: 0 };
      offsets.set(receiver, {
        x: attribute === "left" ? number : current.x,
        y: attribute === "top" ? number : current.y,
      });
    }

    for (const varName of statements.assignmentOrder) {
      const assignment = statements.assignments.get(varName);
      if (!assignment) continue;
      const left = asNumber(assignment.args.kwargs.get("left"));
      const top = asNumber(assignment.args.kwargs.get("top"));
      const fallback = offsets.get(varName);
      const placed = left !== undefined || top !== undefined || fallback;
      if (!placed && !byCtor.has(lastSegment(assignment.ctor))) continue;
      positioned.push({
        varName,
        x: left ?? fallback?.x ?? 0,
        y: top ?? fallback?.y ?? 0,
      });
    }
  } else {
    positioned.push(...statements.placements);
  }

  const seen = new Set<string>();
  for (const { varName, x, y } of positioned) {
    if (seen.has(varName)) continue;
    const assignment = statements.assignments.get(varName);
    if (!assignment) continue;
    seen.add(varName);

    const widget = byCtor.get(lastSegment(assignment.ctor));
    if (!widget) {
      warnings.push(
        `Skipped "${varName}": ${assignment.ctor} is not a ${definition.label} widget this editor knows.`
      );
      continue;
    }

    const component = buildComponent(widget, assignment.args, x, y);
    const items = readListboxItems(widget, varName, statements);
    if (items) {
      const spec = widget.props.find(
        (entry) => entry.type === "list" && entry.virtual
      );
      if (spec) component.props[spec.key] = items;
    }
    doc.components.push(component);
  }

  if (framework === "flet") {
    windowFromFlet(statements, doc);
  } else {
    windowFromTk(statements, framework, doc);
  }

  if (doc.components.length === 0 && statements.assignments.size > 0) {
    warnings.push(
      "No positioned widgets were found. Widgets need place(x=, y=) or left/top values."
    );
  }

  return { framework, doc, warnings };
}
