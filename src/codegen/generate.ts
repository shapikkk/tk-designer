import type { Component, EditorState, FrameworkDoc } from "@/types";
import type { FrameworkId, PropSpec, WidgetDef } from "@/frameworks/types";
import { getWidget } from "@/frameworks";
import { pyString } from "@/codegen/python";

export { pyString };

const enumLiteral = (prefix: string, value: string) =>
  `${prefix}.${value.toUpperCase()}`;

const listLiteral = (values: string[], itemCtor?: string): string => {
  const items = values.map((item) =>
    itemCtor ? `${itemCtor}(${pyString(item)})` : pyString(item)
  );
  return `[${items.join(", ")}]`;
};

function propLiteral(spec: PropSpec, value: unknown): string | undefined {
  switch (spec.type) {
    case "text": {
      if (typeof value !== "string" || value === "") return undefined;
      return spec.enumPrefix
        ? enumLiteral(spec.enumPrefix, value)
        : pyString(value);
    }
    case "color":
      return typeof value === "string" && value ? pyString(value) : undefined;
    case "number":
      return typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : undefined;
    case "bool":
      return typeof value === "boolean" ? (value ? "True" : "False") : undefined;
    case "select": {
      if (typeof value !== "string") return undefined;
      const option = spec.options?.find((entry) => entry.value === value);
      if (!option) return undefined;
      return option.code ?? pyString(option.value);
    }
    case "list":
      return Array.isArray(value)
        ? listLiteral(value, spec.itemCtor)
        : undefined;
  }
}

function fixedLiteral(value: string | number | boolean): string {
  if (typeof value === "string") {
    return value.startsWith("@") ? value.slice(1) : pyString(value);
  }
  if (typeof value === "boolean") return value ? "True" : "False";
  return String(value);
}

export function widgetKwargs(comp: Component, widget: WidgetDef): string[] {
  const kwargs: string[] = [];

  for (const spec of widget.props) {
    if (spec.virtual || !spec.kwarg) continue;
    const raw = comp.props[spec.key];
    if (raw === undefined) {
      if (spec.type === "color" && spec.transparentValue) {
        kwargs.push(`${spec.kwarg}=${pyString(spec.transparentValue)}`);
      }
      continue;
    }
    const literal = propLiteral(spec, raw);
    if (literal !== undefined) kwargs.push(`${spec.kwarg}=${literal}`);
  }

  if (widget.font) {
    const { kwarg, familyKey, sizeKey, weightKey, fallbackFamily, fallbackSize } =
      widget.font;
    const family =
      (familyKey && typeof comp.props[familyKey] === "string"
        ? (comp.props[familyKey] as string)
        : undefined) ||
      fallbackFamily ||
      "Arial";
    const size =
      sizeKey && typeof comp.props[sizeKey] === "number"
        ? (comp.props[sizeKey] as number)
        : fallbackSize ?? 12;
    const weight =
      weightKey && typeof comp.props[weightKey] === "string"
        ? (comp.props[weightKey] as string)
        : "normal";
    const parts = [pyString(family), String(size)];
    if (weight !== "normal") parts.push(pyString(weight));
    kwargs.push(`${kwarg}=(${parts.join(", ")})`);
  }

  for (const [kwarg, value] of Object.entries(widget.fixed ?? {})) {
    kwargs.push(`${kwarg}=${fixedLiteral(value)}`);
  }

  return kwargs;
}

const varNames = (doc: FrameworkDoc, framework: FrameworkId): string[] => {
  const used = new Map<string, number>();
  return doc.components.map((comp) => {
    const { varPrefix } = getWidget(framework, comp.kind);
    const next = (used.get(varPrefix) ?? 0) + 1;
    used.set(varPrefix, next);
    return `${varPrefix}_${next}`;
  });
};

const call = (
  varName: string,
  ctor: string,
  kwargs: string[],
  indent: string
): string[] => [
  `${indent}${varName} = ${ctor}(`,
  ...kwargs.map((kwarg) => `${indent}    ${kwarg},`),
  `${indent})`,
];

const hasCallback = (doc: FrameworkDoc, framework: FrameworkId) =>
  doc.components.some((comp) => {
    const widget = getWidget(framework, comp.kind);
    return Object.values(widget.fixed ?? {}).some(
      (value) => typeof value === "string" && value.startsWith("@")
    );
  });

function generateTk(doc: FrameworkDoc, framework: FrameworkId): string {
  const isCtk = framework === "customtkinter";
  const root = isCtk ? "ctk.CTk()" : "tk.Tk()";
  const backgroundKwarg = isCtk ? "fg_color" : "bg";

  const lines: string[] = isCtk
    ? ["import tkinter as tk", "import customtkinter as ctk", ""]
    : ["import tkinter as tk", ""];

  lines.push(
    `root = ${root}`,
    `root.title(${pyString(doc.windowTitle)})`,
    `root.geometry(${pyString(`${doc.canvasWidth}x${doc.canvasHeight}`)})`,
    `root.configure(${backgroundKwarg}=${pyString(doc.windowBackground)})`,
    ""
  );

  if (hasCallback(doc, framework)) {
    lines.push("", "def on_button_click():", '    print("button clicked")', "");
  }

  const names = varNames(doc, framework);
  doc.components.forEach((comp, index) => {
    const widget = getWidget(framework, comp.kind);
    const varName = names[index];
    const kwargs = ["master=root", ...widgetKwargs(comp, widget)];

    lines.push(...call(varName, widget.ctor, kwargs, ""));
    lines.push(`${varName}.place(x=${comp.x}, y=${comp.y})`);
    lines.push(...(widget.after?.(varName, comp.props) ?? []));
    lines.push("");
  });

  lines.push("root.mainloop()", "");
  return lines.join("\n");
}

function generateFlet(doc: FrameworkDoc): string {
  const framework: FrameworkId = "flet";
  const body: string[] = [
    `    page.title = ${pyString(doc.windowTitle)}`,
    `    page.bgcolor = ${pyString(doc.windowBackground)}`,
    `    page.window.width = ${doc.canvasWidth}`,
    `    page.window.height = ${doc.canvasHeight}`,
    "",
  ];

  if (hasCallback(doc, framework)) {
    body.push(
      "    def on_button_click(e):",
      '        print("button clicked")',
      ""
    );
  }

  const names = varNames(doc, framework);
  doc.components.forEach((comp, index) => {
    const widget = getWidget(framework, comp.kind);
    const varName = names[index];
    const kwargs = [
      ...widgetKwargs(comp, widget),
      `left=${comp.x}`,
      `top=${comp.y}`,
    ];
    body.push(...call(varName, widget.ctor, kwargs, "    "));
    body.push(...(widget.after?.(varName, comp.props) ?? []));
    body.push("");
  });

  body.push(
    "    page.add(",
    "        ft.Stack(",
    `            width=${doc.canvasWidth},`,
    `            height=${doc.canvasHeight},`,
    "            controls=[",
    ...names.map((name) => `                ${name},`),
    "            ],",
    "        )",
    "    )",
    "    page.update()"
  );

  return [
    "import flet as ft",
    "",
    "",
    "def main(page: ft.Page):",
    ...body,
    "",
    "",
    'if __name__ == "__main__":',
    "    ft.run(main)",
    "",
  ].join("\n");
}

export function generateCode(state: EditorState): string {
  const doc = state.docs[state.framework];
  return state.framework === "flet"
    ? generateFlet(doc)
    : generateTk(doc, state.framework);
}
