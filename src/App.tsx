import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";
import { Copy } from "lucide-react";

import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import Dropzone from "@/components/Dropzone";
import Widget from "@/components/Widget";
import PropertiesPanel from "@/components/PropertiesPanel";
import CustomDragLayer from "@/components/CustomDragLayer";
import { NumberField } from "@/components/NumberField";
import { generateTkinterCode } from "@/codegen/generate";
import { parseTkinterCode } from "@/codegen/parse";
import { editorReducer, initialEditorState } from "@/state/editorReducer";
import { loadPersisted, persist } from "@/state/persist";
import { WIDGET_KINDS } from "@/widgets";
import type { WidgetKind } from "@/types";

function App() {
  const [state, dispatch] = useReducer(
    editorReducer,
    initialEditorState,
    // Survive a page reload; the .py file remains the portable format.
    (fallback) => loadPersisted() ?? fallback
  );
  const [fileName, setFileName] = useState("my-portfolio");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The Python code is derived, never stored: it cannot drift from the state.
  const pythonCode = useMemo(() => generateTkinterCode(state), [state]);

  useEffect(() => {
    const timer = setTimeout(() => persist(state), 300);
    return () => clearTimeout(timer);
  }, [state]);

  const handleDrop = useCallback(
    (name: WidgetKind, x: number, y: number) =>
      dispatch({ type: "add", name, x, y }),
    []
  );

  const handleMove = useCallback(
    (id: string, x: number, y: number) => dispatch({ type: "move", id, x, y }),
    []
  );

  const handleSelect = useCallback(
    (id: string | null) => dispatch({ type: "select", id }),
    []
  );

  const downloadPython = (name: string) => {
    const safe = name.trim().replace(/\.py$/i, "") || "portfolio";
    const blob = new Blob([pythonCode], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safe + ".py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Saved " + safe + ".py");
  };

  const handleSavePortfolio = () => {
    downloadPython(fileName);
    setIsSaveDialogOpen(false);
  };

  const handleOpenFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset first, so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    try {
      // The file is read as text and parsed statically. It is never executed.
      const { state: loaded, warnings } = parseTkinterCode(await file.text());
      dispatch({ type: "load", state: loaded });
      setFileName(file.name.replace(/\.py$/i, ""));
      toast.success(
        `Loaded ${loaded.components.length} widget(s) from ${file.name}`
      );
      for (const warning of warnings) toast.warning(warning);
    } catch (error) {
      toast.error(`Could not load ${file.name}`, {
        description: (error as Error).message,
      });
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard
      .writeText(pythonCode)
      .then(() =>
        toast.success("Code copied to clipboard!", {
          icon: <Copy className="h-4 w-4" />,
        })
      )
      .catch(() => toast.error("Failed to copy code"));
  };

  const handleRawCode = () => {
    const newWindow = window.open("", "_blank");
    if (!newWindow) {
      toast.error("Failed to open new tab. Please allow popups.");
      return;
    }
    // Written as text, never as markup, so widget text cannot inject HTML.
    const pre = newWindow.document.createElement("pre");
    pre.textContent = pythonCode;
    pre.style.cssText =
      "white-space:pre-wrap;word-wrap:break-word;font-family:monospace";
    newWindow.document.title = "Raw Python Code";
    newWindow.document.body.style.cssText =
      "background:#1a1a1a;color:#fff;padding:20px";
    newWindow.document.body.appendChild(pre);
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DndProvider backend={HTML5Backend}>
        <div className="flex min-h-screen">
          <div className="w-60 p-4 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-3">Core Widgets</h2>
              <div className="space-y-1.5">
                {WIDGET_KINDS.map((widget) => (
                  <Widget key={widget} name={widget} />
                ))}
              </div>
            </div>
            <div className="mt-4 text-xs">
              <p>Contact us</p>
              <p>Copyright © 2025</p>
              <p>customtk-builder.pp.ua</p>
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
                    <img src="/assets/eyecode.svg" alt="" />
                    Visual
                  </TabsTrigger>
                  <TabsTrigger
                    value="python"
                    className="px-3 py-1 rounded-none text-sm"
                  >
                    <img src="/assets/sellector.svg" alt="" />
                    Python
                  </TabsTrigger>
                  <Dialog
                    open={isSaveDialogOpen}
                    onOpenChange={setIsSaveDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        Save Portfolio
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Save Portfolio</DialogTitle>
                        <DialogDescription>
                          Your project is saved as a Python file you can open
                          again later.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-4 items-center gap-4 py-4">
                        <Label htmlFor="file-name" className="text-right">
                          File name
                        </Label>
                        <Input
                          id="file-name"
                          value={fileName}
                          onChange={(e) => setFileName(e.target.value)}
                          className="col-span-3"
                          placeholder="my-portfolio"
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" onClick={handleSavePortfolio}>
                          Download .py
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Load Portfolio
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".py,text/x-python"
                    className="hidden"
                    onChange={handleOpenFile}
                  />
                  <ModeToggle />
                </TabsList>

                <TabsContent value="visual">
                  <Dropzone
                    width={state.canvasWidth}
                    height={state.canvasHeight}
                    components={state.components}
                    windowBackground={state.windowBackground}
                    selectedComponent={state.selectedId}
                    onDrop={handleDrop}
                    updateComponentPosition={handleMove}
                    setSelectedComponent={handleSelect}
                  />
                  <div className="mt-3 flex gap-2">
                    <NumberField
                      aria-label="Window width in pixels"
                      value={state.canvasWidth}
                      min={200}
                      max={4096}
                      onCommit={(canvasWidth) =>
                        dispatch({ type: "setWindow", patch: { canvasWidth } })
                      }
                      className="rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                    <NumberField
                      aria-label="Window height in pixels"
                      value={state.canvasHeight}
                      min={200}
                      max={4096}
                      onCommit={(canvasHeight) =>
                        dispatch({ type: "setWindow", patch: { canvasHeight } })
                      }
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
                        {pythonCode}
                      </div>
                    </ScrollArea>
                    <div className="absolute top-2 right-2 flex gap-2 z-10">
                      <Button variant="outline" size="sm" onClick={handleRawCode}>
                        Raw
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleCopyCode}>
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadPython(fileName)}
                      >
                        Download raw file
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <PropertiesPanel state={state} dispatch={dispatch} />
          </div>
        </div>
        <CustomDragLayer />
        <Toaster />
      </DndProvider>
    </ThemeProvider>
  );
}

export default App;
