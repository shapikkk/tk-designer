export type TokenKind = "name" | "number" | "string" | "op";

export interface Token {
  kind: TokenKind;
  /** For strings this is the decoded value, not the source text. */
  value: string;
  line: number;
}

export class ParseError extends Error {
  constructor(message: string, readonly line: number) {
    super(`Line ${line}: ${message}`);
    this.name = "ParseError";
  }
}

/** Guards against a pathological file locking up the tab. We only ever execute
 *  this lexer, never the Python itself, but an unbounded loop is still a hang. */
export const MAX_SOURCE_BYTES = 2_000_000;
const MAX_TOKENS = 200_000;

const OPERATOR_CHARS = new Set("()[]{},=.:*+-/");
const NAME_START = /[A-Za-z_]/;
const NAME_CHAR = /[A-Za-z0-9_]/;

const SIMPLE_ESCAPES: Record<string, string> = {
  n: "\n",
  r: "\r",
  t: "\t",
  b: "\b",
  f: "\f",
  v: "\v",
  "0": "\0",
  "\\": "\\",
  "'": "'",
  '"': '"',
};

/** Tokenises the subset of Python the generator emits: literals, names, dotted
 *  attribute access and call punctuation. Everything else (comments, blank
 *  lines, indentation, statements we do not model) is skipped rather than
 *  interpreted, so a file with extra hand-written code still parses. */
export function tokenize(source: string): Token[] {
  if (source.length > MAX_SOURCE_BYTES) {
    throw new ParseError(
      `File is too large to parse (${Math.round(source.length / 1024)} KB).`,
      1
    );
  }

  const tokens: Token[] = [];
  let i = 0;
  let line = 1;

  const push = (kind: TokenKind, value: string, atLine = line) => {
    if (tokens.length >= MAX_TOKENS) {
      throw new ParseError("File has too many tokens to parse.", atLine);
    }
    tokens.push({ kind, value, line: atLine });
  };

  while (i < source.length) {
    const ch = source[i];

    if (ch === "\n") {
      line++;
      i++;
      continue;
    }
    if (ch === " " || ch === "\t" || ch === "\r" || ch === "\f") {
      i++;
      continue;
    }
    // Line continuation
    if (ch === "\\" && source[i + 1] === "\n") {
      line++;
      i += 2;
      continue;
    }
    if (ch === "#") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }

    // String literal, with optional r/b/f/u prefix
    const prefixMatch = /^[rRbBuUfF]{0,2}(['"])/.exec(source.slice(i, i + 4));
    if (prefixMatch) {
      const startLine = line;
      const prefix = prefixMatch[0].slice(0, -1);
      const raw = /r/i.test(prefix);
      i += prefix.length;
      const quote = source[i];
      const triple =
        source[i + 1] === quote && source[i + 2] === quote ? quote.repeat(3) : "";
      const closer = triple || quote;
      i += closer.length;

      let value = "";
      for (;;) {
        if (i >= source.length) {
          throw new ParseError("Unterminated string literal.", startLine);
        }
        if (source.startsWith(closer, i)) {
          i += closer.length;
          break;
        }
        const c = source[i];
        if (c === "\n") {
          if (!triple) {
            throw new ParseError("Unterminated string literal.", startLine);
          }
          line++;
          value += c;
          i++;
          continue;
        }
        if (c === "\\" && !raw) {
          const next = source[i + 1];
          if (next === "\n") {
            line++;
            i += 2;
            continue;
          }
          if (next === "x") {
            const hex = source.slice(i + 2, i + 4);
            if (/^[0-9a-fA-F]{2}$/.test(hex)) {
              value += String.fromCharCode(parseInt(hex, 16));
              i += 4;
              continue;
            }
          }
          if (next === "u") {
            const hex = source.slice(i + 2, i + 6);
            if (/^[0-9a-fA-F]{4}$/.test(hex)) {
              value += String.fromCharCode(parseInt(hex, 16));
              i += 6;
              continue;
            }
          }
          value += SIMPLE_ESCAPES[next] ?? "\\" + next;
          i += 2;
          continue;
        }
        value += c;
        i++;
      }
      push("string", value, startLine);
      continue;
    }

    if (NAME_START.test(ch)) {
      let j = i;
      while (j < source.length && NAME_CHAR.test(source[j])) j++;
      push("name", source.slice(i, j));
      i = j;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === "." && /[0-9]/.test(source[i + 1] ?? ""))) {
      const match = /^[0-9_]*\.?[0-9_]*(?:[eE][+-]?[0-9]+)?/.exec(
        source.slice(i)
      );
      const text = (match?.[0] ?? ch).replace(/_/g, "");
      push("number", text);
      i += match?.[0].length ?? 1;
      continue;
    }

    if (OPERATOR_CHARS.has(ch)) {
      push("op", ch);
      i++;
      continue;
    }

    // Anything we do not model (>, <, %, ...) is not interesting to us; skipping
    // keeps the lexer from failing on hand-added code we never look at.
    i++;
  }

  return tokens;
}
