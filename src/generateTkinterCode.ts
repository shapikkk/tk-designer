interface Component {
  id: string;
  name: string;
  x: number;
  y: number;
  text?: string;
  width?: number;
  height?: number;
  text_color?: string;
  bg_color?: string;
  border_width?: number;
  border_radius?: number;
  border_color?: string;
  font_size?: number;
  enable_hover?: boolean;
  hover_bg_color?: string;
  font_family?: string;
}

export const generateTkinterCode = (
  components: Component[],
  windowTitle: string,
  width: string | number,
  height: string | number,
  windowBackground: string
): string => {
  const widthPx = typeof width === "string" && width.endsWith("px") ? parseInt(width) : 1368;
  const heightPx = typeof height === "string" && height.endsWith("px") ? parseInt(height) : 700;

  let code = "";
  code += "import tkinter as tk\n";
  code += "import customtkinter as ctk\n";
  code += "\n";
  code += "root = ctk.CTk()\n";
  code += `root.title("${windowTitle}")\n`;
  code += `root.geometry("${widthPx}x${heightPx}")\n`;
  code += `root.configure(fg_color="${windowBackground}")\n`;
  code += "\n";

  components.forEach((comp, index) => {
    const widgetId = `${comp.name.toLowerCase()}_${index}`;
    const text = comp.text || comp.name;
    switch (comp.name) {
      case "Button":
        code += `${widgetId} = ctk.CTkButton(\n`;
        code += `    master=root,\n`;
        code += `    text="${text}",\n`;
        code += `    fg_color="${comp.bg_color || "#3b82f6"}",\n`;
        code += `    text_color="${comp.text_color || "#ffffff"}",\n`;
        code += `    border_width=${comp.border_width || 0},\n`;
        code += `    corner_radius=${comp.border_radius || 6},\n`;
        code += `    border_color="${comp.border_color || "#3b82f6"}",\n`;
        code += `    width=${comp.width || 140},\n`;
        code += `    height=${comp.height || 28},\n`;
        code += `    font=("Arial", ${comp.font_size || 14}),\n`;
        if (comp.enable_hover) {
          code += `    hover_color="${comp.hover_bg_color || "#2563eb"}",\n`;
        } else {
          code += `    hover_color="${comp.bg_color || "#3b82f6"}",\n`;
        }
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "Labels":
        code += `${widgetId} = ctk.CTkLabel(\n`;
        code += `    master=root,\n`;
        code += `    text="${text}",\n`;
        code += `    text_color="${comp.text_color || "#000000"}",\n`;
        code += `    fg_color="${comp.bg_color || windowBackground}",\n`;
        code += `    font=("${comp.font_family || "Arial"}", ${comp.font_size || 14})\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "Entry":
        code += `${widgetId} = ctk.CTkEntry(\n`;
        code += `    master=root,\n`;
        code += `    fg_color="#ffffff",\n`;
        code += `    text_color="#000000",\n`;
        code += `    border_color="#d1d5db",\n`;
        code += `    corner_radius=6,\n`;
        code += `    width=150\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "CheckBox":
        code += `${widgetId} = ctk.CTkCheckBox(\n`;
        code += `    master=root,\n`;
        code += `    text="${text}",\n`;
        code += `    text_color="${comp.text_color || "#000000"}",\n`;
        code += `    fg_color="#3b82f6",\n`;
        code += `    bg_color="${comp.bg_color || windowBackground}",\n`;
        code += `    border_color="#d1d5db"\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "RadioButton":
        code += `${widgetId} = ctk.CTkRadioButton(\n`;
        code += `    master=root,\n`;
        code += `    text="${text}",\n`;
        code += `    text_color="${comp.text_color || "#000000"}",\n`;
        code += `    fg_color="#3b82f6",\n`;
        code += `    bg_color="${comp.bg_color || windowBackground}",\n`;
        code += `    border_color="#d1d5db"\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "ListBox":
        code += `${widgetId} = tk.Listbox(\n`;
        code += `    root,\n`;
        code += `    height=5,\n`;
        code += `    width=15,\n`;
        code += `    bg="#ffffff",\n`;
        code += `    fg="#000000",\n`;
        code += `    highlightthickness=1,\n`;
        code += `    highlightcolor="#d1d5db",\n`;
        code += `    highlightbackground="#d1d5db"\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        code += `${widgetId}.insert(tk.END, "Item 1", "Item 2", "Item 3")\n`;
        break;
      default:
        break;
    }
    code += "\n";
  });

  code += "root.mainloop()\n";

  return code;
};