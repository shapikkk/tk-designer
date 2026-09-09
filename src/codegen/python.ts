export const pyString = (value: string): string =>
  '"' +
  value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t") +
  '"';

export const pyNumber = (value: number): string =>
  Number.isFinite(value) ? String(value) : "0";

export const pyBool = (value: boolean): string => (value ? "True" : "False");
