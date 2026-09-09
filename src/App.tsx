import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useRef,
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
  PanelLeft,
  PanelRight,
  Scan,
  Search,
  Trash,
  ZoomIn,
  ZoomOut,
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

import Dropzone, { GRID_SIZE } from "@/components/Dropzone";
import Widget from "@/components/Widget";
import PropertiesPanel from "@/components/PropertiesPanel";
import CustomDragLayer from "@/components/CustomDragLayer";
import { NumberField } from "@/components/NumberField";
import { generateCode } from "@/codegen/generate";
import { parsePythonCode } from "@/codegen/parse";
import { createInitialState, editorReducer } from "@/state/editorReducer";
import { loadPersisted, persist } from "@/state/persist";
import { FRAMEWORK_IDS, getFramework, widgetsByCategory } from "@/frameworks";
import type { FrameworkId } from "@/frameworks/types";
import { activeDoc } from "@/types";
import { viewportWindowSize } from "@/lib/viewport";
import { cn } from "@/lib/utils";

const FILE_NAME: Record<FrameworkId, string> = {
  tkinter: "tkinter-app",
  customtkinter: "customtkinter-app",
  flet: "flet-app",
};

const ZOOM_STEPS = [0.25, 0.4, 0.5, 0.65, 0.8, 1, 1.25, 1.5, 2];
const COMPACT_QUERY = "(max-width: 1023px)";

function useCompactLayout() {
  const [isCompact, setIsCompact] = useState(
    () =>
      typeof window !== "undefined" && window.matchMedia(COMPACT_QUERY).matches
  );

  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const onChange = (event: MediaQueryListEvent) => setIsCompact(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return isCompact;
}

function useElementSize() {
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ width, height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);

  return { ref: setElement, size };
}

function App() {
  const [state, dispatch] = useReducer(
    editorReducer,
    null,
    () => loadPersisted() ?? createInitialState(viewportWindowSize())
  );
  const [fileName, setFileName] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [showGrid, setShowGrid] = useState(true);
  const [zoom, setZoom] = useState<number | "fit">("fit");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [propertiesOpen, setPropertiesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCompact = useCompactLayout();
  const { ref: canvasAreaRef, size: canvasArea } = useElementSize();

  const doc = activeDoc(state);
  const framework = getFramework(state.framework);
  const pythonCode = useMemo(() => generateCode(state), [state]);
  const effectiveFileName = fileName || FILE_NAME[state.framework];

  const fitScale = useMemo(() => {
    if (!canvasArea.width || !canvasArea.height) return 1;
    return Math.min(
      1,
      canvasArea.width / doc.canvasWidth,
      (canvasArea.height - 96) / doc.canvasHeight
    );
  }, [canvasArea, doc.canvasWidth, doc.canvasHeight]);

  const scale = zoom === "fit" ? Math.max(0.2, fitScale) : zoom;

  useEffect(() => {
    const timer = setTimeout(() => persist(state), 300);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    setPaletteOpen(false);
    setPropertiesOpen(false);
  }, [isCompact]);

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

      const selected = doc.components.find((c) => c.id === doc.selectedId);

      if (event.key === "Escape") {
        setPaletteOpen(false);
        setPropertiesOpen(false);
        dispatch({ type: "select", id: null });
        return;
      }

      if (!selected) return;

      if (
        (event.key === "d" || event.key === "D") &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        dispatch({ type: "duplicate", id: selected.id });
      } else if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        dispatch({ type: "remove", id: selected.id });
      } else if (event.key.startsWith("Arrow")) {
        const step = event.shiftKey ? 1 : GRID_SIZE;
        const dx =
          (event.key === "ArrowRight" ? step : 0) -
          (event.key === "ArrowLeft" ? step : 0);
        const dy =
          (event.key === "ArrowDown" ? step : 0) -
          (event.key === "ArrowUp" ? step : 0);
        if (dx === 0 && dy === 0) return;
        event.preventDefault();
        dispatch({
          type: "move",
          id: selected.id,
          x: selected.x + dx,
          y: selected.y + dy,
        });
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [doc]);

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

  const handleAddFromPalette = (kind: string) => {
    const cascade = (doc.components.length % 6) * GRID_SIZE;
    dispatch({
      type: "add",
      kind,
      x: Math.round((doc.canvasWidth / 2 - 80 + cascade) / GRID_SIZE) * GRID_SIZE,
      y: Math.round((doc.canvasHeight / 3 + cascade) / GRID_SIZE) * GRID_SIZE,
    });
    if (isCompact) setPaletteOpen(false);
  };

  const stepZoom = (direction: 1 | -1) => {
    const next =
      direction > 0
        ? ZOOM_STEPS.find((step) => step > scale + 0.001)
        : [...ZOOM_STEPS].reverse().find((step) => step < scale - 0.001);
    setZoom(next ?? scale);
  };

  const fitWindowToScreen = () => {
    const size = viewportWindowSize();
    dispatch({
      type: "setWindow",
      patch: { canvasWidth: size.width, canvasHeight: size.height },
    });
    toast.success(`Window resized to ${size.width}×${size.height}`);
  };

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
      const {
        framework: detected,
        doc: loaded,
        warnings,
      } = parsePythonCode(await file.text());
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

  const drawerOpen = paletteOpen || propertiesOpen;

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <DndProvider backend={HTML5Backend}>
        <Tabs
          defaultValue="visual"
          className="flex h-dvh flex-col gap-0 bg-workspace"
        >
          <header
            className={cn(
              "flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1.5",
              "border-b bg-background px-2 py-2",
              "sm:px-3 lg:h-12 lg:flex-nowrap lg:gap-3 lg:py-0"
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              className="size-8 shrink-0 p-0 lg:hidden"
              onClick={() => {
                setPropertiesOpen(false);
                setPaletteOpen((open) => !open);
              }}
              aria-label="Toggle widget palette"
              aria-expanded={paletteOpen}
            >
              <PanelLeft className="size-4" strokeWidth={1.75} />
            </Button>

            <div className="hidden items-center gap-2 pr-1 sm:flex">
              <LayoutPanelLeft
                className="size-[18px] text-primary"
                strokeWidth={1.75}
              />
              <span className="text-sm font-semibold tracking-tight">
                Tk Designer
              </span>
            </div>

            <div className="hidden h-5 w-px bg-border lg:block" />

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
                    onClick={() =>
                      dispatch({ type: "setFramework", framework: id })
                    }
                    className={cn(
                      "flex h-7 items-center gap-1.5 rounded px-2 text-xs sm:px-2.5",
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
                    <span className="hidden md:inline">{def.label}</span>
                    <span className="md:hidden">{def.shortLabel}</span>
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
              <TabsTrigger value="visual" className="h-7 gap-1.5 px-2 text-xs">
                <Eye className="size-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Visual</span>
              </TabsTrigger>
              <TabsTrigger value="python" className="h-7 gap-1.5 px-2 text-xs">
                <FileCode2 className="size-3.5" strokeWidth={1.75} />
                <span className="hidden sm:inline">Python</span>
              </TabsTrigger>
            </TabsList>

            <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 px-2 sm:px-3"
                title="Open a .py file — the library is detected from its imports"
                onClick={() => fileInputRef.current?.click()}
              >
                <FolderOpen className="size-4" strokeWidth={1.75} />
                <span className="hidden sm:inline">Load</span>
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
                    className="gap-1.5 px-2 sm:px-3"
                    title="Download this project as a Python file"
                  >
                    <Download className="size-4" strokeWidth={1.75} />
                    <span className="hidden sm:inline">Save</span>
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

              <Button
                variant="ghost"
                size="sm"
                className="size-8 shrink-0 p-0 lg:hidden"
                onClick={() => {
                  setPaletteOpen(false);
                  setPropertiesOpen((open) => !open);
                }}
                aria-label="Toggle properties panel"
                aria-expanded={propertiesOpen}
              >
                <PanelRight className="size-4" strokeWidth={1.75} />
              </Button>

              <div className="mx-0.5 hidden h-5 w-px bg-border sm:block" />
              <ModeToggle />
            </div>
          </header>

          <div className="relative flex min-h-0 flex-1 overflow-hidden">
            <aside
              className={cn(
                "scroll-slim absolute inset-y-0 left-0 z-40 flex w-64 flex-col",
                "justify-between overflow-y-auto border-r bg-background shadow-xl",
                "transition-transform duration-200 ease-out",
                "lg:static lg:z-auto lg:w-60 lg:shrink-0 lg:translate-x-0 lg:shadow-none",
                paletteOpen ? "translate-x-0" : "-translate-x-full"
              )}
              aria-label="Widget palette"
            >
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
                        <Widget
                          key={widget.key}
                          widget={widget}
                          onAdd={handleAddFromPalette}
                        />
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
                <p>Drag a widget onto the canvas, or tap to place it.</p>
              </footer>
            </aside>

            <main className="min-w-0 flex-1 overflow-hidden">
              <TabsContent
                value="visual"
                className="h-full data-[state=active]:animate-in data-[state=active]:fade-in-0"
              >
                <div
                  ref={canvasAreaRef}
                  className="scroll-slim h-full overflow-auto p-3 sm:p-6 lg:p-8"
                >
                  <div className="flex min-h-full min-w-fit flex-col items-center gap-4">
                    <div
                      className="shrink-0 overflow-hidden"
                      style={{
                        width: doc.canvasWidth * scale,
                        height: doc.canvasHeight * scale,
                      }}
                    >
                      <div
                        style={{
                          width: doc.canvasWidth,
                          height: doc.canvasHeight,
                          transform: `scale(${scale})`,
                          transformOrigin: "top left",
                        }}
                      >
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
                          scale={scale}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 rounded-lg border bg-background px-3 py-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Window
                        </span>
                        <NumberField
                          aria-label="Window width in pixels"
                          value={doc.canvasWidth}
                          min={200}
                          max={4096}
                          onCommit={(canvasWidth) =>
                            dispatch({
                              type: "setWindow",
                              patch: { canvasWidth },
                            })
                          }
                          className="h-7 w-16 text-xs sm:w-20"
                        />
                        <span className="text-xs text-muted-foreground">×</span>
                        <NumberField
                          aria-label="Window height in pixels"
                          value={doc.canvasHeight}
                          min={200}
                          max={4096}
                          onCommit={(canvasHeight) =>
                            dispatch({
                              type: "setWindow",
                              patch: { canvasHeight },
                            })
                          }
                          className="h-7 w-16 text-xs sm:w-20"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 px-2 text-xs"
                          onClick={fitWindowToScreen}
                          title="Size the window to this screen"
                        >
                          <Scan className="size-3.5" strokeWidth={1.75} />
                          Auto
                        </Button>
                      </div>

                      <div className="hidden h-5 w-px bg-border sm:block" />

                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0"
                          onClick={() => stepZoom(-1)}
                          disabled={scale <= ZOOM_STEPS[0]}
                          aria-label="Zoom out"
                        >
                          <ZoomOut className="size-3.5" strokeWidth={1.75} />
                        </Button>
                        <button
                          onClick={() => setZoom(1)}
                          className="min-w-11 rounded px-1 text-xs tabular-nums text-muted-foreground hover:text-foreground"
                          title="Reset to 100%"
                        >
                          {Math.round(scale * 100)}%
                        </button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-7 p-0"
                          onClick={() => stepZoom(1)}
                          disabled={scale >= ZOOM_STEPS[ZOOM_STEPS.length - 1]}
                          aria-label="Zoom in"
                        >
                          <ZoomIn className="size-3.5" strokeWidth={1.75} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 px-2 text-xs",
                            zoom !== "fit" && "text-muted-foreground"
                          )}
                          onClick={() => setZoom("fit")}
                          title="Scale the canvas to fit the view"
                        >
                          Fit
                        </Button>
                      </div>

                      <div className="hidden h-5 w-px bg-border sm:block" />

                      <div className="flex items-center gap-0.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-7 gap-1.5 px-2 text-xs",
                            !showGrid && "text-muted-foreground"
                          )}
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
                        <span className="px-1 text-xs text-muted-foreground">
                          {doc.components.length} widget
                          {doc.components.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent
                value="python"
                className="relative h-full overflow-hidden p-3 sm:p-6 lg:p-8 data-[state=active]:animate-in data-[state=active]:fade-in-0"
              >
                <div className="relative h-full overflow-hidden rounded-lg border bg-background shadow-sm">
                  <div className="flex h-10 items-center justify-between gap-2 border-b px-2 sm:px-3">
                    <span className="truncate font-mono text-xs text-muted-foreground">
                      {effectiveFileName}.py
                    </span>
                    <div className="flex shrink-0 gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 px-2"
                        onClick={handleRawCode}
                      >
                        <ExternalLink className="size-3.5" strokeWidth={1.75} />
                        <span className="hidden sm:inline">Raw</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 px-2"
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
                        <span className="hidden sm:inline">
                          {copied ? "Copied" : "Copy"}
                        </span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 px-2"
                        onClick={() => downloadPython(effectiveFileName)}
                      >
                        <Download className="size-3.5" strokeWidth={1.75} />
                        <span className="hidden sm:inline">Download</span>
                      </Button>
                    </div>
                  </div>
                  <pre className="scroll-slim h-[calc(100%-2.5rem)] overflow-auto p-3 font-mono text-xs leading-relaxed sm:p-4 sm:text-[13px]">
                    {pythonCode}
                  </pre>
                </div>
              </TabsContent>
            </main>

            <PropertiesPanel
              state={state}
              dispatch={dispatch}
              onClose={() => setPropertiesOpen(false)}
              className={cn(
                "absolute inset-y-0 right-0 z-40 w-[88vw] max-w-[340px] shadow-xl",
                "transition-transform duration-200 ease-out",
                "lg:static lg:z-auto lg:w-[320px] lg:max-w-none lg:translate-x-0 lg:shadow-none",
                propertiesOpen ? "translate-x-0" : "translate-x-full"
              )}
            />

            {drawerOpen && (
              <div
                className="absolute inset-0 z-30 bg-black/40 lg:hidden"
                onClick={() => {
                  setPaletteOpen(false);
                  setPropertiesOpen(false);
                }}
                aria-hidden
              />
            )}
          </div>
        </Tabs>
        <CustomDragLayer
          framework={state.framework}
          surface={doc.windowBackground}
          scale={scale}
        />
        <Toaster />
      </DndProvider>
    </ThemeProvider>
  );
}

export default App;
