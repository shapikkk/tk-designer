# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo layout

The working directory `D:\work\tk-designer` is **not** a git repo — `frontend/` is
both the git repo and the npm project. Run every command from `frontend/`.

## Commands

```bash
cd frontend
npm install
npm run dev              # vite dev server, http://localhost:5173
npm run build            # tsc -b && vite build -> dist/
npm run lint             # eslint .
npm test                 # vitest run
npm run test:watch
npx vitest run src/codegen/parse.test.ts          # a single file
npx vitest run -t "reads a flet file"             # a single test by name
```

There is no vitest config file; vitest picks up `vite.config.ts`, which is where
the `@/` -> `src/` alias lives (also declared in `tsconfig.app.json`).

## Architecture

A client-side visual builder that targets **three** Python UI libraries —
tkinter, customtkinter and flet. No server, no API, no router; it deploys as
static files. Drag widgets onto a canvas, edit properties, export a runnable
`.py`, and load that same `.py` back.

**One document per library.** `EditorState` (`src/types.ts`) is
`{ framework, docs }`, where `docs` holds a `FrameworkDoc` for each library, so
switching libraries never discards work. `activeDoc(state)` is the accessor;
every reducer case except `setFramework`/`load` goes through the `withDoc`
helper, so actions only ever touch the active document.

**Widgets are data, not code.** `src/frameworks/{tkinter,customtkinter,flet}.ts`
each export a `FrameworkDef` whose `widgets: WidgetDef[]` carry everything the
rest of the app needs: the constructor, the variable prefix, the palette icon
and category, `props: PropSpec[]`, optional `fixed` kwargs, an optional `font`
composite, an optional `after` hook, and a `visual` map that tells
`WidgetPreview` which prop supplies the text, background, border, size and so
on. A `Component` is `{ id, kind, x, y, props }` where `props` is an open bag
keyed by `PropSpec.key`. **Adding a widget or a property means editing only the
framework file** — the palette, the properties panel, the generator, the parser
and the canvas preview all read the same definitions.

`PropSpec` fields worth knowing:
- `virtual: true` — edited in the panel but not emitted as a kwarg; consumed by
  the `font` composite or by `after` (e.g. tkinter `Listbox.items`).
- `transparentValue` — when the value is cleared, emit this literal instead of
  omitting the kwarg (CustomTkinter's `"transparent"`); the parser maps it back
  to `undefined`, so the absence *is* the value and it round-trips.
- `enumPrefix` / `SelectOption.code` — emit an identifier rather than a string
  (`ft.Icons.SAVE`, `ft.FontWeight.BOLD`); the parser matches either form.
- `itemCtor` — a list emitted as wrapped calls (`ft.dropdown.Option("A")`).

**Generation and parsing are symmetrical, per library.** `generate.ts` has one
emitter for tk/ctk (`root = tk.Tk()` / `ctk.CTk()`, widgets positioned with
`.place(x=, y=)`) and one for flet (`def main(page: ft.Page)`, controls
positioned with `left=`/`top=` kwargs inside an `ft.Stack`, `ft.run(main)`).
`parse.ts` collects statements once (assignments, method calls, attribute
assignments, `.place()` calls), detects the library from the imports with a
constructor-count fallback, then assembles components against that library's
definitions.

**Loading never executes the file.** `lexer.ts` tokenises a small Python subset
(no `eval`, no `Function`, no network) with size/token caps. Unrecognised
statements — and unparseable positional arguments such as a `lambda` — are
skipped rather than fatal, so a file the user has added their own code to still
loads; skipped widgets are reported as warnings shown in toasts. Widget ids are
internal and regenerated on load.

**State and persistence.** All mutations go through `editorReducer.ts`, the only
place coordinates are clamped — drag and the Properties panel both dispatch
through it, so there is one coordinate system. `persist.ts` autosaves to
`localStorage` (debounced 300ms) and *validates* on read rather than casting,
dropping widget kinds and prop keys the current build no longer knows.

**Layout and scale.** Below the `lg` breakpoint (1024px) the palette and the
properties panel become absolutely-positioned drawers inside the content row —
that row is `overflow-hidden` so the closed right-hand drawer cannot create a
horizontal scrollbar. `App.tsx` mirrors the breakpoint in JS (`useCompactLayout`)
only for behaviour that CSS cannot express, such as closing the palette after a
tap-to-add. HTML5 drag-and-drop does not fire on touch, so `Widget.tsx` is a
button that adds its widget on click, and the arrow keys nudge the selection.

The canvas is rendered inside a `transform: scale(...)` wrapper whose parent
reserves the scaled size. **The scale is a view concern only** — every stored
coordinate stays in real pixels — so `Dropzone` divides the pointer delta by
`scale` before snapping to the grid, and `CustomDragLayer` scales the ghost by
the same factor. If you touch one of those, keep the other in step. The default
window size for a new project comes from `src/lib/viewport.ts` (75% of the
viewport, grid-snapped and clamped); `emptyDoc` stays deterministic so the parser
fallback and the tests do not depend on a window object.

**Rendering.** `WidgetPreview.tsx` is the single widget renderer for every
library: it turns `WidgetDef.visual` plus the component's props into one of a
fixed set of shapes (`button`, `field`, `check`, `switch`, `slider`, `list`,
`box`, …). The canvas and the react-dnd drag ghost both draw through it, so they
cannot diverge. Widgets whose library sizes them in characters (`sizing:
"chars"`, i.e. most tkinter text widgets) are converted to pixels there. Text
with no explicit colour falls back to a readable one computed from the window
background (`src/lib/color.ts`).

## Tests

`src/codegen/*.test.ts` are the safety net for the hand-written parser: lexer
escaping rules, parser tolerance of foreign code, library detection, and the
`editor -> .py -> editor` round trip run over **every widget of all three
libraries** (`describe.each(FRAMEWORK_IDS)`, compared on a canonical form that
drops `id`s and undefined props). A new widget or property is covered by that
loop automatically; a regression in the generator surfaces as a failing round
trip rather than as a corrupted project a week later.

## Conventions

- shadcn/ui "new-york", Tailwind v4 (config lives in `src/index.css` via
  `@theme`, there is no `tailwind.config.js`). Colors are oklch CSS variables
  with a light/dark pair; `--workspace` is the recessed field the canvas floats
  on and `--canvas-grid` the grid line.
- lucide-react icons only, `strokeWidth={1.75}`.
- TypeScript is strict with `noUnusedLocals`/`noUnusedParameters` — `npm run
  build` fails on an unused import.
- The current owner asked for **no comments in new code**; keep explanations in
  this file and the README instead.
