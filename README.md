# Tk Designer

A visual builder for **Tkinter / CustomTkinter** interfaces. Drag widgets onto a
canvas, edit their properties, and export the result as a runnable Python file —
then load that same file back to keep editing.

The app is entirely client-side. There is no server, no database and no account:
everything runs in the browser, so it deploys as static files anywhere (Vercel,
Netlify, GitHub Pages, a plain bucket).

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run lint
npm test         # vitest run  (npm run test:watch to iterate)
```

The tests cover the lexer, the parser and the `editor → .py → editor` round
trip. They are the safety net for the hand-written Python subset parser: every
escaping rule and every value that the file format has to carry is asserted, so
a regression in the generator shows up as a failing round trip rather than as a
corrupted project someone loads a week later.

## How saving and loading work

`Save` generates a CustomTkinter script and hands it to the browser as a
download. `Load` reads a `.py` file back into the canvas.

The generated file is ordinary, readable Python — not JSON wearing a `.py`
extension:

```python
button_1 = ctk.CTkButton(
    master=root,
    text="Sign in",
    fg_color="#3b82f6",
    hover=True,
    hover_color="#2563eb",
    width=140,
    height=28,
    font=("Arial", 14),
    command=on_button_click,
)
button_1.place(x=120, y=80)
```

**Loading never executes the file.** It is tokenised (`src/codegen/lexer.ts`) and
pattern-matched (`src/codegen/parse.ts`) — no `eval`, no `Function`, no remote
call. Statements outside the recognised subset are ignored, so a file you have
added your own code to still loads; anything skipped is reported in a toast.

Because the generator and the parser both read one widget schema
(`src/codegen/schema.ts`), a project survives the round-trip
`editor → .py → editor` with its widgets, order, positions, sizes, text, colours
and fonts intact. Widget ids are internal and are regenerated on load.

## Layout

```
src/
  types.ts              Component and EditorState — the single source of truth
  widgets.ts            widget catalogue: defaults, palette icon, editable props
  state/
    editorReducer.ts    every state change, including coordinate clamping
    persist.ts          localStorage autosave, validated on read
  codegen/
    schema.ts           property <-> CustomTkinter kwarg mapping
    generate.ts         EditorState -> Python
    lexer.ts            Python literal tokeniser
    parse.ts            Python -> EditorState
  components/           canvas, palette, properties panel, shadcn/ui primitives
```

The Python code is derived from state with `useMemo`, never stored beside it, so
the two cannot drift apart.

## Stack

React 19 · TypeScript · Vite · Tailwind v4 · shadcn/ui (Radix) · react-dnd ·
lucide-react
