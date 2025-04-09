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
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "sonner";
import { Copy } from "lucide-react";

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
  const [windowBackground, setWindowBackground] = useState("#ffffff");
  const [components, setComponents] = useState<
    { id: string; name: string; x: number; y: number; text?: string }[]
  >([]);
  const [pythonCode, setPythonCode] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const handleDrop = useCallback((widgetName: string, x: number, y: number) => {
    const initialText = {
      Button: "Button",
      Labels: "Label",
      CheckBox: "CheckBox",
      RadioButton: "RadioButton",
      Message: "Message",
      Entry: "",
      ListBox: "",
    }[widgetName];

    const newComponent = { 
      id: uuidv4(), 
      name: widgetName, 
      x, 
      y, 
      text: initialText
    };
    setComponents((prev) => {
      const newComponents = [...prev, newComponent];
      setPythonCode(
        generateTkinterCode(
          newComponents,
          windowTitle,
          dropzoneSize.width,
          dropzoneSize.height,
          windowBackground
        )
      );
      return newComponents;
    });
  }, [windowTitle, dropzoneSize, windowBackground]);

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
          dropzoneSize.height,
          windowBackground
        )
      );
      return updatedComponents;
    });
  }, [windowTitle, dropzoneSize, windowBackground]);

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
          newSize.height,
          windowBackground
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
          newSize.height,
          windowBackground
        )
      );
      return newSize;
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value || "My App";
    setWindowTitle(newTitle);
    setPythonCode(
      generateTkinterCode(components, newTitle, dropzoneSize.width, dropzoneSize.height, windowBackground)
    );
  };

  const handleWindowBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setWindowBackground(newColor);
    setPythonCode(
      generateTkinterCode(components, windowTitle, dropzoneSize.width, dropzoneSize.height, newColor)
    );
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonCode).then(() => {
      toast.success("Code copied to clipboard!", {
        icon: <Copy className="h-4 w-4" />,
      });
    }).catch((err) => {
      console.error("Failed to copy code: ", err);
      toast.error("Failed to copy code");
    });
  };

  const handleRawCode = () => {
    const newWindow = window.open("", "_blank");
    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Raw Python Code</title>
            <style>
              body {
                background-color: #1a1a1a;
                color: #ffffff;
                font-family: monospace;
                padding: 20px;
              }
              pre {
                white-space: pre-wrap;
                word-wrap: break-word;
              }
            </style>
          </head>
          <body>
            <pre>${pythonCode || "# Python code will appear here"}</pre>
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      toast.error("Failed to open new tab. Please allow popups.");
    }
  };

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
    toast.success("File downloaded successfully!");
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
                  selectedComponent={selectedComponent}
                  setSelectedComponent={setSelectedComponent}
                  windowBackground={windowBackground}
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
                  <ScrollArea className="w-full h-[700px] rounded-sm border">
                    <div
                      className="p-2 font-mono text-sm"
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {pythonCode || "# Python code will appear here"}
                    </div>
                  </ScrollArea>
                  <div className="absolute top-2 right-2 flex gap-2 z-10">
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
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <PropertiesPanel
            onTitleChange={handleTitleChange}
            components={components}
            selectedComponent={selectedComponent}
            setComponents={setComponents}
            setPythonCode={setPythonCode}
            windowTitle={windowTitle}
            dropzoneSize={dropzoneSize}
            windowBackground={windowBackground}
            setWindowBackground={setWindowBackground}
          />
        </div>
      </div>
      <CustomDragLayer />
      <Toaster />
    </DndProvider>
  );
}

export default App;