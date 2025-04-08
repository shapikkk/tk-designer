import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Dropzone from "@/components/Dropzone";
import Widget from "@/components/Widget";
import PropertiesPanel from "@/components/PropertiesPanel";
import CustomDragLayer from "@/components/CustomDragLayer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useCallback } from "react";
import { generateTkinterCode } from "@/generateTkinterCode";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button"; // Додаємо Button із shadcn

function App() {
  const widgets = [
    "Labels",
    "Button",
    "CheckBox",
    "RadioButton",
    "Entry",
    "ListBox",
    "Message",
  ];

  const [dropzoneSize, setDropzoneSize] = useState({
    width: "100%" as string | number,
    height: "700px" as string | number,
  });
  const [windowTitle, setWindowTitle] = useState("My App");
  const [components, setComponents] = useState<
    { id: string; name: string; x: number; y: number }[]
  >([]);
  const [pythonCode, setPythonCode] = useState("");

  const handleDrop = useCallback((widgetName: string, x: number, y: number) => {
    const newComponent = { id: uuidv4(), name: widgetName, x, y };
    setComponents((prev) => {
      const newComponents = [...prev, newComponent];
      setPythonCode(
        generateTkinterCode(
          newComponents,
          windowTitle,
          dropzoneSize.width,
          dropzoneSize.height
        )
      );
      return newComponents;
    });
  }, [windowTitle, dropzoneSize]);

  const updateComponentPosition = useCallback((id: string, x: number, y: number) => {
    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === id ? { ...comp, x, y } : comp
      );
      setPythonCode(
        generateTkinterCode(
          updatedComponents,
          windowTitle,
          dropzoneSize.width,
          dropzoneSize.height
        )
      );
      return updatedComponents;
    });
  }, [windowTitle, dropzoneSize]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDropzoneSize((prev) => {
      const newSize = {
        ...prev,
        width: value ? `${value}px` : "100%",
      };
      setPythonCode(
        generateTkinterCode(
          components,
          windowTitle,
          newSize.width,
          newSize.height
        )
      );
      return newSize;
    });
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDropzoneSize((prev) => {
      const newSize = {
        ...prev,
        height: value ? `${value}px` : "700px",
      };
      setPythonCode(
        generateTkinterCode(
          components,
          windowTitle,
          newSize.width,
          newSize.height
        )
      );
      return newSize;
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value || "My App";
    setWindowTitle(newTitle);
    setPythonCode(
      generateTkinterCode(components, newTitle, dropzoneSize.width, dropzoneSize.height)
    );
  };

  // Функція для копіювання коду в буфер обміну
  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonCode).then(() => {
      alert("Code copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy code: ", err);
    });
  };

  // Функція для показу сирцевого коду (поки виводимо в консоль)
  const handleRawCode = () => {
    console.log("Raw code:\n", pythonCode);
    // У майбутньому можна відкрити нове вікно або вкладку
  };

  // Функція для завантаження коду як файлу
  const handleDownloadCode = () => {
    const blob = new Blob([pythonCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "app.py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex min-h-screen">
        <div className="w-60 p-4 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold mb-3">Core Widgets</h2>
            <div className="space-y-1.5">
              {widgets.map((widget) => (
                <Widget key={widget} name={widget} />
              ))}
            </div>
          </div>
          <div className="text-xs mt-4">
            <p>Contact us</p>
            <p>Copyright © 2025 tk-designer.com</p>
          </div>
        </div>

        <div className="flex flex-1">
          <div className="flex-[2] p-3">
            <Tabs defaultValue="visual" className="w-full">
              <TabsList className="mb-3 flex gap-3">
                <TabsTrigger
                  value="visual"
                  className="px-3 py-1 rounded-none text-sm"
                >
                  <img src="/assets/eyecode.svg" alt="eye" />
                  Visual
                </TabsTrigger>
                <TabsTrigger
                  value="python"
                  className="px-3 py-1 rounded-none text-sm"
                >
                  <img src="/assets/sellector.svg" alt="selector" />
                  Python
                </TabsTrigger>
                <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                  <ModeToggle />
                </ThemeProvider>
              </TabsList>
              <TabsContent value="visual">
                <Dropzone
                  onDrop={handleDrop}
                  width={dropzoneSize.width}
                  height={dropzoneSize.height}
                  components={components}
                  updateComponentPosition={updateComponentPosition}
                />
                <div className="mt-3 flex gap-2">
                  <Input
                    type="number"
                    placeholder="Width (px)"
                    onChange={handleWidthChange}
                    className="rounded-sm focus:ring-0 text-sm py-1.5"
                  />
                  <Input
                    type="number"
                    placeholder="Height (px)"
                    onChange={handleHeightChange}
                    className="rounded-sm focus:ring-0 text-sm py-1.5"
                  />
                </div>
              </TabsContent>
              <TabsContent value="python">
                <div className="relative">
                  {/* Buttons */}
                  <div className="absolute top-2 right-2 flex gap-2 zindex-10">
                    <Button variant="outline" size="sm" onClick={handleRawCode}>
                      Raw
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleCopyCode}>
                      Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDownloadCode}>
                      Download raw file
                    </Button>
                  </div>
                  <ScrollArea className="w-full h-[700px] rounded-sm border">
                    <div
                      className="p-2 font-mono text-sm"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {pythonCode || "# Python code will appear here"}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <PropertiesPanel onTitleChange={handleTitleChange} />
        </div>
      </div>
      <CustomDragLayer />
    </DndProvider>
  );
}

export default App;