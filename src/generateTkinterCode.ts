export const generateTkinterCode = (
  components: { id: string; name: string; x: number; y: number }[],
  windowTitle: string,
  width: string | number,
  height: string | number
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
  code += "\n";

  components.forEach((comp, index) => {
    const widgetId = `${comp.name.toLowerCase()}_${index}`;
    switch (comp.name) {
      case "Button":
        code += `${widgetId} = ctk.CTkButton(\n`;
        code += `    master=root,\n`;
        code += `    text="Button ${index}",\n`;
        code += `    fg_color="#3b82f6",  # Primary color from shadcn\n`;
        code += `    text_color="#ffffff",  # White text\n`;
        code += `    hover_color="#2563eb",  # Slightly darker on hover\n`;
        code += `    corner_radius=6\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "Labels":
        code += `${widgetId} = ctk.CTkLabel(\n`;
        code += `    master=root,\n`;
        code += `    text="Label ${index}",\n`;
        code += `    text_color="#000000"  # Foreground color\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "Entry":
        code += `${widgetId} = ctk.CTkEntry(\n`;
        code += `    master=root,\n`;
        code += `    fg_color="#ffffff",  # White background\n`;
        code += `    text_color="#000000",  # Black text\n`;
        code += `    border_color="#d1d5db",  # Border color (gray)\n`;
        code += `    corner_radius=6,\n`;
        code += `    width=150\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "CheckBox":
        code += `${widgetId} = ctk.CTkCheckBox(\n`;
        code += `    master=root,\n`;
        code += `    text="CheckBox ${index}",\n`;
        code += `    text_color="#000000",  # Foreground color\n`;
        code += `    fg_color="#3b82f6",  # Checkmark color\n`;
        code += `    border_color="#d1d5db"  # Border color\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "RadioButton":
        code += `${widgetId} = ctk.CTkRadioButton(\n`;
        code += `    master=root,\n`;
        code += `    text="RadioButton ${index}",\n`;
        code += `    text_color="#000000",  # Foreground color\n`;
        code += `    fg_color="#3b82f6",  # Radio button color\n`;
        code += `    border_color="#d1d5db"  # Border color\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      case "ListBox":
        code += `${widgetId} = tk.Listbox(\n`;
        code += `    root,\n`;
        code += `    height=5,\n`;
        code += `    width=15,\n`;
        code += `    bg="#ffffff",  # White background\n`;
        code += `    fg="#000000",  # Black text\n`;
        code += `    highlightthickness=1,\n`;
        code += `    highlightcolor="#d1d5db",  # Border color\n`;
        code += `    highlightbackground="#d1d5db"\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        code += `${widgetId}.insert(tk.END, "Item 1", "Item 2", "Item 3")\n`;
        break;
      case "Message":
        code += `${widgetId} = ctk.CTkLabel(\n`;
        code += `    master=root,\n`;
        code += `    text="Message ${index}",\n`;
        code += `    text_color="#000000"  # Foreground color\n`;
        code += `)\n`;
        code += `${widgetId}.place(x=${comp.x}, y=${comp.y})\n`;
        break;
      default:
        break;
    }
    code += "\n";
  });

  code += "root.mainloop()\n";

  return code;
};