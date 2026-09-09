import { describe, expect, it } from "vitest";
import { ParseError, parsePythonCode } from "@/codegen/parse";
import { MAX_SOURCE_BYTES } from "@/codegen/lexer";

const parse = (source: string) => parsePythonCode(source);
const first = (source: string) => parse(source).doc.components[0];

describe("files that cannot be loaded", () => {
  it("reports the line of an unterminated string", () => {
    expect(() => parse('root = tk.Tk()\nroot.title("oops\n')).toThrow(ParseError);
    expect(() => parse('root = tk.Tk()\nroot.title("oops\n')).toThrow(/Line 2/);
  });

  it("reports a truncated call rather than silently dropping it", () => {
    expect(() =>
      parse('import tkinter as tk\nbutton_1 = tk.Button(master=root, text="hi"')
    ).toThrow(/Unclosed call/);
  });

  it("refuses a file too large to be worth tokenising", () => {
    expect(() => parse("#".repeat(MAX_SOURCE_BYTES + 1))).toThrow(/too large/);
  });
});

describe("framework detection", () => {
  it("reads a plain tkinter file", () => {
    const result = parse(`import tkinter as tk

root = tk.Tk()
root.title("Plain")
label_1 = tk.Label(master=root, text="Hello", fg="#222222")
label_1.place(x=10, y=20)
root.mainloop()
`);
    expect(result.framework).toBe("tkinter");
    expect(result.doc.components[0].kind).toBe("Label");
    expect(result.doc.windowTitle).toBe("Plain");
  });

  it("prefers customtkinter when both modules are imported", () => {
    const result = parse(`import tkinter as tk
import customtkinter as ctk

root = ctk.CTk()
button_1 = ctk.CTkButton(master=root, text="Go")
button_1.place(x=5, y=5)
`);
    expect(result.framework).toBe("customtkinter");
    expect(result.doc.components[0].kind).toBe("CTkButton");
  });

  it("reads a flet file", () => {
    const result = parse(`import flet as ft


def main(page: ft.Page):
    page.title = "Flet app"
    page.bgcolor = "#fafafa"
    page.window.width = 480
    page.window.height = 320

    text_1 = ft.Text(
        value="Hello",
        size=20,
        left=30,
        top=40,
    )

    page.add(ft.Stack(controls=[text_1]))


if __name__ == "__main__":
    ft.run(main)
`);
    expect(result.framework).toBe("flet");
    expect(result.doc.windowTitle).toBe("Flet app");
    expect(result.doc.windowBackground).toBe("#fafafa");
    expect(result.doc.canvasWidth).toBe(480);
    expect(result.doc.canvasHeight).toBe(320);
    expect(result.doc.components).toHaveLength(1);
    expect(result.doc.components[0]).toMatchObject({
      kind: "Text",
      x: 30,
      y: 40,
    });
    expect(result.doc.components[0].props.value).toBe("Hello");
  });

  it("falls back to the constructors when imports are unusual", () => {
    const result = parse(`from customtkinter import *

root = CTk()
switch_1 = CTkSwitch(master=root, text="Wifi")
switch_1.place(x=0, y=0)
`);
    expect(result.framework).toBe("customtkinter");
    expect(result.doc.components[0].kind).toBe("CTkSwitch");
  });

  it("reads flet positions written as attributes", () => {
    const result = parse(`import flet as ft

def main(page):
    button_1 = ft.ElevatedButton(text="Send")
    button_1.left = 60
    button_1.top = 90
    page.add(ft.Stack(controls=[button_1]))
`);
    expect(result.doc.components[0]).toMatchObject({ x: 60, y: 90 });
  });
});

describe("files we did not write", () => {
  it("loads a file the user has added their own code to", () => {
    const result = parse(`import tkinter as tk
from datetime import datetime

# a helper of my own
def stamp():
    return datetime.now().isoformat()

root = tk.Tk()
root.geometry("640x480")
root.configure(bg="#0b0b0b")

entry_1 = tk.Entry(master=root, width=25, bg="#ffffff")
entry_1.place(x=12, y=14)
entry_1.insert(0, stamp())

root.bind("<Escape>", lambda event: root.destroy())
root.mainloop()
`);
    expect(result.warnings).toEqual([]);
    expect(result.doc.canvasWidth).toBe(640);
    expect(result.doc.canvasHeight).toBe(480);
    expect(result.doc.windowBackground).toBe("#0b0b0b");
    expect(result.doc.components[0].props.width).toBe(25);
  });

  it("keeps what it understands and says what it skipped", () => {
    const result = parse(`import tkinter as tk
from tkinter import ttk

root = tk.Tk()
tree_1 = ttk.Treeview(master=root)
tree_1.place(x=0, y=0)
label_1 = tk.Label(master=root, text="Kept")
label_1.place(x=10, y=10)
`);
    expect(result.doc.components).toHaveLength(1);
    expect(result.doc.components[0].props.text).toBe("Kept");
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Treeview");
  });

  it("ignores a widget placed with a layout manager it does not model", () => {
    const result = parse(`import tkinter as tk

root = tk.Tk()
label_1 = tk.Label(master=root, text="packed")
label_1.pack()
`);
    expect(result.doc.components).toEqual([]);
    expect(result.warnings[0]).toContain("place(x=, y=)");
  });

  it("falls back to defaults when the window is never configured", () => {
    const result = parse(`import tkinter as tk

root = tk.Tk()
label_1 = tk.Label(master=root, text="bare")
label_1.place(x=0, y=0)
`);
    expect(result.doc.windowTitle).toBe("My App");
    expect(result.doc.canvasWidth).toBe(900);
    expect(result.doc.canvasHeight).toBe(600);
  });
});

describe("value handling", () => {
  const tk = (call: string, extra = "") => `import tkinter as tk
root = tk.Tk()
widget_1 = ${call}
widget_1.place(x=0, y=0)
${extra}`;

  it("reads negative and fractional place coordinates", () => {
    const result = parse(`import tkinter as tk
root = tk.Tk()
label_1 = tk.Label(master=root, text="x")
label_1.place(x=-40, y=12.5)
`);
    expect(result.doc.components[0]).toMatchObject({ x: -40, y: 12.5 });
  });

  it("treats a transparent customtkinter colour as an absent one", () => {
    const result = parse(`import customtkinter as ctk
root = ctk.CTk()
label_1 = ctk.CTkLabel(master=root, text="t", fg_color="transparent")
label_1.place(x=0, y=0)
`);
    expect(result.doc.components[0].props.fg_color).toBeUndefined();
  });

  it("keeps a named colour rather than discarding it", () => {
    expect(first(tk('tk.Label(master=root, text="n", bg="lightblue")')).props.bg).toBe(
      "lightblue"
    );
  });

  it("ignores kwargs whose type does not match the property", () => {
    const component = first(tk('tk.Label(master=root, text=42, borderwidth="thick")'));
    expect(component.props.text).toBeUndefined();
    expect(component.props.borderwidth).toBeUndefined();
  });

  it("reads the font family, size and weight from the tuple", () => {
    const component = first(
      tk('tk.Label(master=root, text="f", font=("Courier", 18, "bold"))')
    );
    expect(component.props.font_family).toBe("Courier");
    expect(component.props.font_size).toBe(18);
    expect(component.props.font_weight).toBe("bold");
  });

  it("defaults the weight when the tuple carries only family and size", () => {
    const component = first(tk('tk.Label(master=root, text="f", font=("Arial", 12))'));
    expect(component.props.font_weight).toBe("normal");
  });

  it("only accepts select values the widget actually offers", () => {
    const component = first(
      tk('tk.Label(master=root, text="s", relief="wobbly", justify="right")')
    );
    expect(component.props.relief).toBeUndefined();
    expect(component.props.justify).toBe("right");
  });

  it("reads a flet enum written as an attribute", () => {
    const result = parse(`import flet as ft
def main(page):
    text_1 = ft.Text(value="e", weight=ft.FontWeight.BOLD, left=0, top=0)
    page.add(ft.Stack(controls=[text_1]))
`);
    expect(result.doc.components[0].props.weight).toBe("bold");
  });

  it("reads customtkinter values as a list", () => {
    const result = parse(`import customtkinter as ctk
root = ctk.CTk()
combobox_1 = ctk.CTkComboBox(master=root, values=["A", "B"])
combobox_1.place(x=0, y=0)
`);
    expect(result.doc.components[0].props.values).toEqual(["A", "B"]);
  });

  it("uses the first placement when a widget is placed twice", () => {
    const result = parse(`import tkinter as tk
root = tk.Tk()
label_1 = tk.Label(master=root, text="twice")
label_1.place(x=10, y=10)
label_1.place(x=99, y=99)
`);
    expect(result.doc.components).toHaveLength(1);
    expect(result.doc.components[0]).toMatchObject({ x: 10, y: 10 });
  });

  it("keeps the order the widgets were placed in", () => {
    const result = parse(`import tkinter as tk
root = tk.Tk()
a = tk.Label(master=root, text="first")
b = tk.Button(master=root, text="second")
b.place(x=0, y=0)
a.place(x=0, y=20)
`);
    expect(result.doc.components.map((c) => c.props.text)).toEqual([
      "second",
      "first",
    ]);
  });
});

describe("flet controls the editor does not model", () => {
  it("warns about a positioned control it cannot place", () => {
    const result = parsePythonCode(`import flet as ft

def main(page):
    text_1 = ft.Text(value="kept", left=0, top=0)
    card_1 = ft.Card(left=100, top=100)
    page.add(ft.Stack(controls=[text_1, card_1]))
`);
    expect(result.doc.components).toHaveLength(1);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toContain("Card");
  });

  it("stays quiet about ordinary assignments that are not controls", () => {
    const result = parsePythonCode(`import flet as ft
from datetime import datetime

def main(page):
    started = datetime.now()
    text_1 = ft.Text(value="kept", left=0, top=0)
    page.add(ft.Stack(controls=[text_1]))
`);
    expect(result.warnings).toEqual([]);
  });
});
