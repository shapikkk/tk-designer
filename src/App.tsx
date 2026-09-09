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
  Grid3x3,
  LayoutPanelLeft,
  Search,
  Trash,
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
import { generateCode } from "@/codegen/generate";
import { parsePythonCode } from "@/codegen/parse";
import { editorReducer, initialEditorState } from "@/state/editorReducer";
import { loadPersisted, persist } from "@/state/persist";
import { FRAMEWORK_IDS, getFramework, widgetsByCategory } from "@/frameworks";
import type { FrameworkId } from "@/frameworks/types";
import { activeDoc } from "@/types";
import { cn } from "@/lib/utils";

const FILE_NAME: Record<FrameworkId, string> = {
  tkinter: "tkinter-app",
  customtkinter: "customtkinter-app",
  flet: "flet-app",
};

function App() {
  const [state, dispatch] = useReducer(
    editorReducer,
    initialEditorState,
    (fallback) => loadPersisted() ?? fallback
  );
  const [fileName, setFileName] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [showGrid, setShowGrid] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const doc = activeDoc(state);
  const framework = getFramework(state.framework);
  const pythonCode = useMemo(() => generateCode(state), [state]);
  const effectiveFileName = fileName || FILE_NAME[state.framework];

  useEffect(() => {
    const timer = setTimeout(() => persist(state), 300);
    return () => clearTimeout(timer);
  }, [state]);

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
        (event.key === "d" || event.key === "D") &&
        (event.ctrlKey || event.metaKey) &&
        doc.selectedId
      ) {
        event.preventDefault();
        dispatch({ type: "duplicate", id: doc.selectedId });
      } else if (
        (event.key === "Delete" || event.key === "Backspace") &&
        doc.selectedId
      ) {
        event.preventDefault();
        dispatch({ type: "remove", id: doc.selectedId });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doc.selectedId]);

  const handleDrop = useCallback(
    (kind: string, x: number, y: number) => dispatch({ type: "add", kind, x, y }),
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

  const palette = useMemo(() => {
    const query = search.trim().toLowerCase();
    return widgetsByCategory(state.framework)
      .map((group) => ({
        ...group,
        widgets: group.widgets.filter(
          (widget) =>
            query === "" ||
            widget.label.toLowerCase().includes(query) ||
            widget.ctor.toLowerCase().includes(query)
        ),
      }))
      .filter((group) => group.widgets.length > 0);
  }, [state.framework, search]);

  const downloadPython = (name: string) => {
    const safe = name.trim().replace(/\.py$/i, "") || FILE_NAME[state.framework];
    const blob = new Blob([pythonCode], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safe + ".py";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Saved ${safe}.py`);
  };

  const handleSavePortfolio = () => {
    downloadPython(effectiveFileName);
    setIsSaveDialogOpen(false);
  };

  const handleOpenFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    try {
      const { framework: detected, doc: loaded, warnings } = parsePythonCode(
        await file.text()
      );
      dispatch({ type: "load", framework: detected, doc: loaded });
      setFileName(file.name.replace(/\.py$/i, ""));
      toast.success(
        `Loaded ${loaded.components.length} widget(s) as ${
          getFramework(detected).label
        }`
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
    const pre = newWindow.document.createElement("pre");
    pre.textContent = pythonCode;
    pre.style.cssText =
      "white-space:pre-wrap;word-wrap:break-word;font-family:ui-monospace,monospace";
    newWindow.document.title = `${framework.label} code`;
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

            <div
              className="flex items-center gap-0.5 rounded-md bg-muted p-0.5"
              role="tablist"
              aria-label="Target library"
            >
              {FRAMEWORK_IDS.map((id) => {
                const def = getFramework(id);
                const isActive = state.framework === id;
                const count = state.docs[id].components.length;
                return (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={isActive}
                    title={def.tagline}
                    onClick={() => dispatch({ type: "setFramework", framework: id })}
                    className={cn(
                      "flex h-7 items-center gap-1.5 rounded px-2.5 text-xs",
                      "transition-colors duration-150",
                      isActive
                        ? "bg-background font-medium shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className="size-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: def.accent }}
                    />
                    {def.label}
                    {count > 0 && (
                      <span className="rounded bg-muted-foreground/15 px-1 text-[10px] tabular-nums">
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

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
                title="Open a .py file — the library is detected from its imports"
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
                    <DialogTitle>Save {framework.label} project</DialogTitle>
                    <DialogDescription>
                      Downloads a runnable {framework.module} file. Load it back
                      here any time to keep editing.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-2 py-2">
                    <Label htmlFor="file-name">File name</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="file-name"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder={FILE_NAME[state.framework]}
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
            <aside className="scroll-slim flex w-60 shrink-0 flex-col justify-between overflow-y-auto border-r bg-background">
              <div className="p-3">
                <div className="relative pb-2">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                    strokeWidth={1.75}
                  />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={`Search ${framework.widgets.length} widgets`}
                    className="h-8 pl-8 text-xs"
                  />
                </div>

                {palette.map((group) => (
                  <div key={group.category} className="pb-1">
                    <h2 className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.category}
                    </h2>
                    <div className="space-y-0.5">
                      {group.widgets.map((widget) => (
                        <Widget key={widget.key} widget={widget} />
                      ))}
                    </div>
                  </div>
                ))}

                {palette.length === 0 && (
                  <p className="px-2.5 py-6 text-center text-xs text-muted-foreground">
                    No widget matches “{search}”.
                  </p>
                )}
              </div>

              <footer className="space-y-1 p-4 text-[11px] leading-relaxed text-muted-foreground">
                <a
                  href={framework.docsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-foreground"
                >
                  {framework.label} docs
                  <ExternalLink className="size-3" strokeWidth={1.75} />
                </a>
                <p>Runs entirely in your browser.</p>
              </footer>
            </aside>

            <main className="min-w-0 flex-1 overflow-hidden">
              <TabsContent
                value="visual"
                className="scroll-slim h-full overflow-auto p-8 data-[state=active]:animate-in data-[state=active]:fade-in-0"
              >
                <div className="flex min-h-full min-w-fit flex-col items-center gap-4">
                  <Dropzone
                    framework={state.framework}
                    width={doc.canvasWidth}
                    height={doc.canvasHeight}
                    components={doc.components}
                    windowBackground={doc.windowBackground}
                    selectedComponent={doc.selectedId}
                    onDrop={handleDrop}
                    updateComponentPosition={handleMove}
                    setSelectedComponent={handleSelect}
                    showGrid={showGrid}
                  />
                  <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2 shadow-sm">
                    <span className="text-xs text-muted-foreground">Window</span>
                    <NumberField
                      aria-label="Window width in pixels"
                      value={doc.canvasWidth}
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
                      value={doc.canvasHeight}
                      min={200}
                      max={4096}
                      onCommit={(canvasHeight) =>
                        dispatch({ type: "setWindow", patch: { canvasHeight } })
                      }
                      className="h-7 w-20 text-xs"
                    />
                    <div className="mx-1 h-5 w-px bg-border" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className={cn("h-7 gap-1.5 px-2 text-xs", !showGrid && "text-muted-foreground")}
                      onClick={() => setShowGrid((value) => !value)}
                      title="Toggle the alignment grid"
                    >
                      <Grid3x3 className="size-3.5" strokeWidth={1.75} />
                      Grid
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1.5 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => dispatch({ type: "clear" })}
                      disabled={doc.components.length === 0}
                      title="Remove every widget from this canvas"
                    >
                      <Trash className="size-3.5" strokeWidth={1.75} />
                      Clear
                    </Button>
                    <span className="ml-1 text-xs text-muted-foreground">
                      {doc.components.length} widget
                      {doc.components.length === 1 ? "" : "s"}
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
                      {effectiveFileName}.py
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
                        onClick={() => downloadPython(effectiveFileName)}
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
        <CustomDragLayer framework={state.framework} surface={doc.windowBackground} />
        <Toaster />
      </DndProvider>
    </ThemeProvider>
  );
}

export default App;
