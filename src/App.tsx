import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { toast } from "sonner";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileCode2,
  FolderOpen,
  LayoutPanelLeft,
} from "lucide-react";

import { ThemeProvider } from "@/components/theme-provider";
import { ModeToggle } from "@/components/mode-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // The Python code is derived, never stored: it cannot drift from the state.
  const pythonCode = useMemo(() => generateTkinterCode(state), [state]);

  useEffect(() => {
    const timer = setTimeout(() => persist(state), 300);
    return () => clearTimeout(timer);
  }, [state]);

  // Canvas keyboard shortcuts, ignored while the user is typing in a field.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName))
      ) {
        return;
      }
      if (event.key === "Escape") {
        dispatch({ type: "select", id: null });
      } else if (
        (event.key === "Delete" || event.key === "Backspace") &&
        state.selectedId
      ) {
        event.preventDefault();
        dispatch({ type: "remove", id: state.selectedId });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.selectedId]);

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
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
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
      "white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,monospace";
    newWindow.document.title = "Raw Python Code";
    newWindow.document.body.style.cssText =
      "background:#0e0f13;color:#e6e8ee;padding:24px;margin:0";
    newWindow.document.body.appendChild(pre);
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DndProvider backend={HTML5Backend}>
        <Tabs
          defaultValue="visual"
          className="flex h-screen flex-col gap-0 bg-workspace"
        >
          <header className="flex h-12 shrink-0 items-center gap-3 border-b bg-background px-3">
            <div className="flex items-center gap-2 pr-1">
              <LayoutPanelLeft
                className="size-[18px] text-primary"
                strokeWidth={1.75}
              />
              <span className="text-sm font-semibold tracking-tight">
                Tk Designer
              </span>
            </div>

            <div className="h-5 w-px bg-border" />

            <TabsList className="h-8 gap-0.5 bg-muted p-0.5">
              <TabsTrigger value="visual" className="h-7 gap-1.5 px-2.5 text-xs">
                <Eye className="size-3.5" strokeWidth={1.75} />
                Visual
              </TabsTrigger>
              <TabsTrigger value="python" className="h-7 gap-1.5 px-2.5 text-xs">
                <FileCode2 className="size-3.5" strokeWidth={1.75} />
                Python
              </TabsTrigger>
            </TabsList>

            <div className="ml-auto flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5"
                title="Open a .py file saved from this editor"
                onClick={() => fileInputRef.current?.click()}
              >
                <FolderOpen className="size-4" strokeWidth={1.75} />
                Load
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,text/x-python"
                className="hidden"
                onChange={handleOpenFile}
              />

              <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    className="gap-1.5"
                    title="Download this project as a Python file"
                  >
                    <Download className="size-4" strokeWidth={1.75} />
                    Save
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[420px]">
                  <DialogHeader>
                    <DialogTitle>Save portfolio</DialogTitle>
                    <DialogDescription>
                      Downloads a runnable CustomTkinter file. Load it back here
                      any time to keep editing.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 py-2">
                    <Label htmlFor="file-name">File name</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="file-name"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="my-portfolio"
                        onKeyDown={(e) =>
                          e.key === "Enter" && handleSavePortfolio()
                        }
                      />
                      <span className="text-sm text-muted-foreground">.py</span>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSavePortfolio} className="gap-1.5">
                      <Download className="size-4" strokeWidth={1.75} />
                      Download
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <div className="mx-0.5 h-5 w-px bg-border" />
              <ModeToggle />
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            <aside className="scroll-slim flex w-56 shrink-0 flex-col justify-between overflow-y-auto border-r bg-background">
              <div className="p-3">
                <h2 className="px-2.5 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Widgets
                </h2>
                <div className="space-y-0.5">
                  {WIDGET_KINDS.map((widget) => (
                    <Widget key={widget} name={widget} />
                  ))}
                </div>
              </div>
              <footer className="p-4 text-[11px] leading-relaxed text-muted-foreground">
                <p>Runs entirely in your browser.</p>
                <p>Copyright © 2025</p>
              </footer>
            </aside>

            <main className="min-w-0 flex-1 overflow-hidden">
              <TabsContent
                value="visual"
                className="scroll-slim h-full overflow-auto p-8 data-[state=active]:animate-in data-[state=active]:fade-in-0"
              >
                <div className="flex min-h-full min-w-fit flex-col items-center gap-4">
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
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-sm">
                    <span className="text-xs text-muted-foreground">Window</span>
                    <NumberField
                      aria-label="Window width in pixels"
                      value={state.canvasWidth}
                      min={200}
                      max={4096}
                      onCommit={(canvasWidth) =>
                        dispatch({ type: "setWindow", patch: { canvasWidth } })
                      }
                      className="h-7 w-20 text-xs"
                    />
                    <span className="text-xs text-muted-foreground">×</span>
                    <NumberField
                      aria-label="Window height in pixels"
                      value={state.canvasHeight}
                      min={200}
                      max={4096}
                      onCommit={(canvasHeight) =>
                        dispatch({ type: "setWindow", patch: { canvasHeight } })
                      }
                      className="h-7 w-20 text-xs"
                    />
                    <span className="ml-1 text-xs text-muted-foreground">
                      {state.components.length} widget
                      {state.components.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="python"
                className="scroll-slim relative h-full overflow-hidden p-8 data-[state=active]:animate-in data-[state=active]:fade-in-0"
              >
                <div className="relative h-full overflow-hidden rounded-lg border bg-background shadow-sm">
                  <div className="flex h-10 items-center justify-between border-b px-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {fileName || "portfolio"}.py
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleRawCode}
                      >
                        <ExternalLink className="size-3.5" strokeWidth={1.75} />
                        Raw
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={handleCopyCode}
                      >
                        {copied ? (
                          <Check
                            className="size-3.5 text-primary"
                            strokeWidth={2}
                          />
                        ) : (
                          <Copy className="size-3.5" strokeWidth={1.75} />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => downloadPython(fileName)}
                      >
                        <Download className="size-3.5" strokeWidth={1.75} />
                        Download
                      </Button>
                    </div>
                  </div>
                  <pre className="scroll-slim h-[calc(100%-2.5rem)] overflow-auto p-4 font-mono text-[13px] leading-relaxed">
                    {pythonCode}
                  </pre>
                </div>
              </TabsContent>
            </main>

            <PropertiesPanel state={state} dispatch={dispatch} />
          </div>
        </Tabs>
        <CustomDragLayer />
        <Toaster />
      </DndProvider>
    </ThemeProvider>
  );
}

export default App;
