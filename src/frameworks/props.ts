import type { PropSpec, PropValue, SelectOption } from "@/frameworks/types";

type Extra = Partial<Omit<PropSpec, "key" | "kwarg" | "label" | "type">>;

export const options = (...values: string[]): SelectOption[] =>
  values.map((value) => ({
    value,
    label: value.charAt(0).toUpperCase() + value.slice(1).replace(/_/g, " "),
  }));

export const coded = (
  entries: [value: string, label: string, code: string][]
): SelectOption[] =>
  entries.map(([value, label, code]) => ({ value, label, code }));

export const pText = (
  key: string,
  kwarg: string,
  label: string,
  extra: Extra = {}
): PropSpec => ({
  key,
  kwarg,
  label,
  type: "text",
  group: "Content",
  ...extra,
});

export const pColor = (
  key: string,
  kwarg: string,
  label: string,
  extra: Extra = {}
): PropSpec => ({
  key,
  kwarg,
  label,
  type: "color",
  group: "Appearance",
  clearable: true,
  ...extra,
});

export const pNumber = (
  key: string,
  kwarg: string,
  label: string,
  extra: Extra = {}
): PropSpec => ({
  key,
  kwarg,
  label,
  type: "number",
  group: "Layout",
  min: 0,
  max: 4096,
  ...extra,
});

export const pBool = (
  key: string,
  kwarg: string,
  label: string,
  extra: Extra = {}
): PropSpec => ({
  key,
  kwarg,
  label,
  type: "bool",
  group: "Behavior",
  ...extra,
});

export const pSelect = (
  key: string,
  kwarg: string,
  label: string,
  choices: SelectOption[],
  extra: Extra = {}
): PropSpec => ({
  key,
  kwarg,
  label,
  type: "select",
  group: "Appearance",
  options: choices,
  ...extra,
});

export const pList = (
  key: string,
  kwarg: string,
  label: string,
  extra: Extra = {}
): PropSpec => ({
  key,
  kwarg,
  label,
  type: "list",
  group: "Content",
  ...extra,
});

export const defaultsOf = (specs: PropSpec[]): Record<string, PropValue> => {
  const values: Record<string, PropValue> = {};
  for (const spec of specs) {
    if (spec.default !== undefined) values[spec.key] = spec.default;
  }
  return values;
};
