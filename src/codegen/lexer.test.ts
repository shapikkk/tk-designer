import { describe, expect, it } from "vitest";
import { ParseError, tokenize } from "@/codegen/lexer";

const values = (source: string) => tokenize(source).map((t) => t.value);
const firstString = (source: string) =>
  tokenize(source).find((t) => t.kind === "string")?.value;

describe("strings", () => {
  it.each([
    ['"plain"', "plain"],
    ["'single quoted'", "single quoted"],
    ['"a\\nb"', "a\nb"],
    ['"a\\tb"', "a\tb"],
    ['"quote \\" inside"', 'quote " inside'],
    ['"back \\\\ slash"', "back \\ slash"],
    ['"\\x41"', "A"],
    ['"\\u2713"', "✓"],
    ['r"raw\\nnot a newline"', "raw\\nnot a newline"],
    ['"""triple\nquoted"""', "triple\nquoted"],
  ])("decodes %s", (source, expected) => {
    expect(firstString(source)).toBe(expected);
  });

  it("leaves an unknown escape as written rather than dropping the backslash", () => {
    expect(firstString('"\\q"')).toBe("\\q");
  });

  it("refuses a newline inside a single-quoted string", () => {
    expect(() => tokenize('"broken\n"')).toThrow(ParseError);
  });

  it("reports the line the string started on, not where parsing stopped", () => {
    let line = 0;
    try {
      tokenize('a = 1\nb = 2\nc = "unterminated');
    } catch (error) {
      line = (error as ParseError).line;
    }
    expect(line).toBe(3);
  });
});

describe("skipping", () => {
  it("drops comments entirely", () => {
    expect(values("a = 1  # b = 2\nc = 3")).toEqual([
      "a", "=", "1", "c", "=", "3",
    ]);
  });

  it("does not treat a # inside a string as a comment", () => {
    expect(firstString('title("#ff0000")')).toBe("#ff0000");
  });

  it("follows a backslash line continuation", () => {
    expect(values("a = \\\n1")).toEqual(["a", "=", "1"]);
  });

  it("skips operators it does not model instead of failing", () => {
    expect(values("if a > b % c: pass")).toEqual([
      "if", "a", "b", "c", ":", "pass",
    ]);
  });
});

describe("numbers and names", () => {
  it("reads underscore separators", () => {
    expect(values("x = 1_000")).toEqual(["x", "=", "1000"]);
  });

  it("reads floats", () => {
    expect(values("x = 12.5")).toEqual(["x", "=", "12.5"]);
  });

  it("keeps dotted names as separate name and operator tokens", () => {
    expect(values("ctk.CTkButton")).toEqual(["ctk", ".", "CTkButton"]);
  });

  it("tracks line numbers across the file", () => {
    const tokens = tokenize("a\n\n\nb");
    expect(tokens.map((t) => t.line)).toEqual([1, 4]);
  });
});
