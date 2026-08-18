import { describe, expect, it } from "vitest";
import { ParseError, parseTkinterCode } from "@/codegen/parse";
import { MAX_SOURCE_BYTES } from "@/codegen/lexer";

const summarise = (source: string) =>
  parseTkinterCode(source).state.components.map(
    (c) => `${c.name}@(${c.x},${c.y})`
  );

describe("files that cannot be loaded", () => {
  it.each([
    ["an empty file", ""],
    ["prose", "this is not python, it is a shopping list"],
    ["binary noise", "<<< \x00\x01\x02 >>>"],
  ])("rejects %s with a readable message", (_label, source) => {
    expect(() => parseTkinterCode(source)).toThrow(ParseError);
    expect(() => parseTkinterCode(source)).toThrow(/No Tkinter widgets found/);
  });

  it("reports the line of an unterminated string", () => {
    expect(() =>
      parseTkinterCode('root = ctk.CTk()\nroot.title("oops\n')
    ).toThrow(/Line 2: Unterminated string literal/);
  });

  it("reports a truncated call rather than silently dropping it", () => {
    expect(() =>
      parseTkinterCode("root = ctk.CTk()\nb = ctk.CTkButton(master=root,\n")
    ).toThrow(/Line 2: Unclosed argument list/);
  });

  it("refuses a file too large to be worth tokenising", () => {
    expect(() => parseTkinterCode("#".repeat(MAX_SOURCE_BYTES + 1))).toThrow(
      /too large to parse/
    );
  });
});

describe("files we did not write", () => {
  it("loads a file the user has added their own code to", () => {
    const source = `import tkinter as tk
import customtkinter as ctk
import os, sys

ctk.set_appearance_mode("dark")

root = ctk.CTk()
root.title('Single quoted title')
root.geometry("800x600")
root.configure(fg_color="#222222")

def my_handler(event=None):
    for i in range(10):
        print(f"tick {i}")

b1 = ctk.CTkButton(master=root, text="Go", fg_color="#ff0000",
                   width=100, height=30, hover=True,
                   hover_color="#aa0000", corner_radius=4,
                   border_width=1, border_color="#000000",
                   text_color="#ffffff", font=("Arial", 12))
b1.place(x=10, y=20)

root.bind("<Key>", my_handler)
root.mainloop()
`;
    const { state, warnings } = parseTkinterCode(source);

    expect(state.windowTitle).toBe("Single quoted title");
    expect(state.canvasWidth).toBe(800);
    expect(state.canvasHeight).toBe(600);
    expect(state.windowBackground).toBe("#222222");
    expect(warnings).toEqual([]);
    expect(state.components).toHaveLength(1);
    expect(state.components[0]).toMatchObject({
      name: "Button",
      x: 10,
      y: 20,
      text: "Go",
      bg_color: "#ff0000",
      enable_hover: true,
      hover_bg_color: "#aa0000",
      border_width: 1,
      border_radius: 4,
      width: 100,
      height: 30,
      font_size: 12,
    });
  });

  it("handles star-import style with no module prefix", () => {
    const source = `from customtkinter import *
root = CTk()
root.title("Star")
root.geometry("300x200")
e = CTkEntry(master=root)
e.place(x=7, y=8)
`;
    expect(summarise(source)).toEqual(["Entry@(7,8)"]);
  });

  it("keeps what it understands and says what it skipped", () => {
    const source = `root = ctk.CTk()
root.title("Mixed")
root.geometry("640x480")
slider = ctk.CTkSlider(master=root)
slider.place(x=5, y=5)
orphan = ctk.CTkLabel(master=root, text="never placed")
lbl = ctk.CTkLabel(master=root, text="ok", fg_color="transparent")
lbl.place(x=1, y=2)
`;
    const { state, warnings } = parseTkinterCode(source);

    expect(summarise(source)).toEqual(["Labels@(1,2)"]);
    expect(state.components[0].text).toBe("ok");
    expect(warnings).toHaveLength(2);
    expect(warnings.join(" ")).toMatch(/CTkSlider is not supported/);
    expect(warnings.join(" ")).toMatch(/orphan.*never given a \.place/);
  });

  it("falls back to defaults when the window is never configured", () => {
    const source = `root = ctk.CTk()
root.title("No geometry")
e = ctk.CTkEntry(master=root)
e.place(x=0, y=0)
`;
    const { state } = parseTkinterCode(source);
    expect(state.canvasWidth).toBeGreaterThan(0);
    expect(state.canvasHeight).toBeGreaterThan(0);
    expect(state.windowBackground).toBe("#ffffff");
  });

  it("ignores a widget placed with a layout manager it does not model", () => {
    const source = `root = ctk.CTk()
root.title("Packed")
root.geometry("400x300")
lbl = ctk.CTkLabel(master=root, text="packed")
lbl.pack()
`;
    const { state, warnings } = parseTkinterCode(source);
    expect(state.components).toEqual([]);
    expect(warnings.join(" ")).toMatch(/never given a \.place/);
  });
});

describe("value handling", () => {
  const withButton = (kwargs: string) => `root = ctk.CTk()
root.title("T")
root.geometry("400x300")
b = ctk.CTkButton(master=root, ${kwargs})
b.place(x=0, y=0)
`;

  it("reads negative and fractional place coordinates", () => {
    const source = `root = ctk.CTk()
root.title("T")
root.geometry("400x300")
b = ctk.CTkEntry(master=root)
b.place(x=-30, y=12.7)
`;
    expect(summarise(source)).toEqual(["Entry@(-30,13)"]);
  });

  it("treats transparent as an absent colour, not the literal string", () => {
    const { state } = parseTkinterCode(withButton('fg_color="transparent"'));
    expect(state.components[0].bg_color).toBeUndefined();
  });

  it("keeps a named colour rather than discarding it", () => {
    const { state } = parseTkinterCode(withButton('fg_color="red"'));
    expect(state.components[0].bg_color).toBe("red");
  });

  it("ignores kwargs whose type does not match the property", () => {
    const { state } = parseTkinterCode(withButton('width="wide", hover=1'));
    expect(state.components[0].width).toBeUndefined();
    expect(state.components[0].enable_hover).toBeUndefined();
  });

  it("takes the font size from the tuple and ignores an unmodelled family", () => {
    const { state } = parseTkinterCode(
      withButton('font=("Comic Sans MS", 33)')
    );
    expect(state.components[0].font_size).toBe(33);
    expect(state.components[0].font_family).toBeUndefined();
  });

  it("reads the font family for widgets that model one", () => {
    const source = `root = ctk.CTk()
root.title("T")
root.geometry("400x300")
l = ctk.CTkLabel(master=root, font=("Georgia", 19))
l.place(x=0, y=0)
`;
    const { state } = parseTkinterCode(source);
    expect(state.components[0]).toMatchObject({
      font_family: "Georgia",
      font_size: 19,
    });
  });

  it("uses the first placement when a widget is placed twice", () => {
    const source = `root = ctk.CTk()
root.title("T")
root.geometry("400x300")
e = ctk.CTkEntry(master=root)
e.place(x=1, y=1)
e.place(x=99, y=99)
`;
    expect(summarise(source)).toEqual(["Entry@(1,1)"]);
  });

  it("never returns a selection, since ids are freshly generated", () => {
    const { state } = parseTkinterCode(withButton('text="x"'));
    expect(state.selectedId).toBeNull();
  });
});
