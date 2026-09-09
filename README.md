# Tk Designer

A visual builder for **Tkinter**, **CustomTkinter** and **Flet** interfaces. Pick
a library, drag its widgets onto a canvas, edit their properties, and export the
result as a runnable Python file — then load that same file back to keep editing.

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

The tests cover the lexer, the parser and the `editor → .py → editor` round trip
for every widget of all three libraries. They are the safety net for the
hand-written Python subset parser: every escaping rule and every value that the
file format has to carry is asserted, so a regression in the generator shows up
as a failing round trip rather than as a corrupted project someone loads a week
later.

## Three libraries, three documents

The library picker in the header switches between Tkinter, CustomTkinter and
Flet. Each keeps **its own canvas**, so switching back and forth never costs you
work, and each offers only the widgets and properties that actually exist in
that library:

| Library | Widgets | Positioning | Sizes |
| --- | --- | --- | --- |
| Tkinter | `tk.Label`, `tk.Button`, `tk.Entry`, `tk.Checkbutton`, `tk.Radiobutton`, `tk.Listbox`, `tk.Text`, `tk.Scale`, `tk.Spinbox`, `tk.Frame`, `tk.Canvas`, `tk.LabelFrame` | `.place(x=, y=)` | text widgets in characters/lines, containers in pixels |
| CustomTkinter | `CTkLabel`, `CTkButton`, `CTkEntry`, `CTkCheckBox`, `CTkRadioButton`, `CTkSwitch`, `CTkSlider`, `CTkProgressBar`, `CTkComboBox`, `CTkOptionMenu`, `CTkSegmentedButton`, `CTkTextbox`, `CTkFrame` | `.place(x=, y=)` | pixels |
| Flet | `Text`, `ProgressBar`, `Image`, `ElevatedButton`, `FilledButton`, `OutlinedButton`, `TextButton`, `IconButton`, `TextField`, `Checkbox`, `Radio`, `Switch`, `Slider`, `Dropdown`, `Container` | `left=` / `top=` inside an `ft.Stack` | pixels |

Properties are per-library too: Tkinter offers `relief` and `borderwidth`,
CustomTkinter offers `corner_radius` and `hover_color`, Flet offers `opacity`,
`tooltip` and enum values written the idiomatic way (`ft.FontWeight.BOLD`).

## How saving and loading work

`Save` generates a script for the current library and hands it to the browser as
a download. `Load` reads a `.py` file back into the canvas and **switches to the
library the file is written in**, detected from its imports and constructors.

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
    height=32,
    font=("Arial", 14),
    command=on_button_click,
)
button_1.place(x=120, y=80)
```

```python
button_1 = ft.ElevatedButton(
    text="Continue",
    color="#052e16",
    bgcolor="#22c55e",
    width=180,
    on_click=on_button_click,
    left=40,
    top=180,
)
```

**Loading never executes the file.** It is tokenised (`src/codegen/lexer.ts`) and
pattern-matched (`src/codegen/parse.ts`) — no `eval`, no `Function`, no remote
call. Statements outside the recognised subset are ignored, so a file you have
added your own code to still loads; anything skipped is reported in a toast.

Because the generator and the parser both read one widget catalogue
(`src/frameworks/`), a project survives the round-trip `editor → .py → editor`
with its widgets, order, positions, sizes, text, colours and fonts intact.
Widget ids are internal and are regenerated on load.

## Layout

```
src/
  types.ts              Component, FrameworkDoc and EditorState — one document per library
  frameworks/
    types.ts            PropSpec and WidgetDef — what a widget and a property are
    props.ts            builders for the property specs
    tkinter.ts          the three catalogues: widgets, properties, defaults,
    customtkinter.ts    palette icon, constructor and preview mapping
    flet.ts
    index.ts            registry and lookup helpers
  state/
    editorReducer.ts    every state change, including coordinate clamping
    persist.ts          localStorage autosave, validated on read
  codegen/
    python.ts           Python literal escaping
    generate.ts         EditorState -> Python (one emitter per library)
    lexer.ts            Python literal tokeniser
    parse.ts            Python -> EditorState, including library detection
  components/           canvas, palette, properties panel, shadcn/ui primitives
```

The Python code is derived from state with `useMemo`, never stored beside it, so
the two cannot drift apart.

## Stack

React 19 · TypeScript · Vite · Tailwind v4 · shadcn/ui (Radix) · react-dnd ·
lucide-react
