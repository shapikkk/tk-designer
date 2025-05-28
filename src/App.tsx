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
import { useState, useCallback, useEffect, useRef } from "react";
import { generateTkinterCode } from "@/generateTkinterCode";
import { v4 as uuidv4 } from "uuid";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";
import { toast } from "sonner";
import { Copy } from "lucide-react";
import { BrowserRouter as Router, Route, Routes, Link } from "react-router-dom";
import SignUp from "./components/signupForm";
import { LoginForm } from "./components/login-form";
import { NavUser } from "./components/NavUser";
import { PortfolioSidebar } from "./components/PortfolioSideBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

function App() {
  const widgets = [
    "Labels",
    "Button",
    "CheckBox",
    "RadioButton",
    "Entry",
    "ListBox",
  ];

  const [dropzoneSize, setDropzoneSize] = useState({
    width: "100%" as string | number,
    height: "700px" as string | number,
  });
  const [computedWidth, setComputedWidth] = useState<number>(0);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  const [windowTitle, setWindowTitle] = useState("My App");
  const [windowBackground, setWindowBackground] = useState("#ffffff");
  const [components, setComponents] = useState<
    {
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
    }[]
  >([]);
  const [pythonCode, setPythonCode] = useState("");
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [portfolios, setPortfolios] = useState<{ _id: string; name: string; createdAt: string }[]>([]);
  const [portfolioName, setPortfolioName] = useState("");
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5170/api/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            setUser({
              name: data.user.name,
              email: data.user.email,
              avatar: "https://avatars.githubusercontent.com/u/124599?v=4",
            });
            fetchPortfolios(token);
          }
        })
        .catch(() => {
          localStorage.removeItem("token");
          setUser(null);
        });
    }
  }, []);

  useEffect(() => {
    const updateComputedWidth = () => {
      if (dropzoneRef.current) {
        const rect = dropzoneRef.current.getBoundingClientRect();
        setComputedWidth(rect.width);
      }
    };

    updateComputedWidth();
    window.addEventListener("resize", updateComputedWidth);
    return () => window.removeEventListener("resize", updateComputedWidth);
  }, [dropzoneSize.width]);

  const handleDrop = useCallback((widgetName: string, x: number, y: number) => {
    const initialText = {
      Button: "Button",
      Labels: "Label",
      CheckBox: "CheckBox",
      RadioButton: "RadioButton",
      Entry: "",
      ListBox: "",
    }[widgetName];

    const initialSizes = widgetName === "Button" ? { width: 140, height: 28 } : {};
    const initialTextColor = ["Button", "Labels", "CheckBox", "RadioButton"].includes(widgetName) ? "#000000" : undefined;
    const initialButtonProps = widgetName === "Button" ? {
      bg_color: "#3b82f6",
      border_width: 0,
      border_radius: 6,
      border_color: "#3b82f6",
      font_size: 14,
      enable_hover: true,
      hover_bg_color: "#2563eb",
    } : {};
    const initialCheckBoxProps = widgetName === "CheckBox" ? {
      text_color: "#000000",
      bg_color: undefined,
    } : {};
    const initialRadioButtonProps = widgetName === "RadioButton" ? {
      text_color: "#000000",
      bg_color: undefined,
    } : {};
    const initialLabelsProps = widgetName === "Labels" ? {
      text_color: "#000000",
      bg_color: undefined,
      font_size: 14,
      font_family: "Arial",
    } : {};

    const newComponent = {
      id: uuidv4(),
      name: widgetName,
      x,
      y,
      text: initialText,
      ...initialSizes,
      ...initialButtonProps,
      ...initialCheckBoxProps,
      ...initialRadioButtonProps,
      ...initialLabelsProps,
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

  const fetchPortfolios = async (token: string) => {
    try {
      const response = await fetch("http://localhost:5170/api/portfolio", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error fetching portfolios");
      }

      setPortfolios(
        data.portfolios.map((p: any) => ({
          _id: p._id,
          name: p.name,
          createdAt: p.createdAt,
        }))
      );
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleSavePortfolio = async () => {
    if (!user) {
      toast.error("Please log in to save your portfolio");
      return;
    }

    if (!portfolioName) {
      toast.error("Please enter a portfolio name");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token available");
      }
      const response = await fetch("http://localhost:5170/api/portfolio", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: portfolioName,
          components,
          windowTitle,
          windowBackground,
          dropzoneSize,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error saving portfolio");
      }

      toast.success("Portfolio saved successfully!");
      setIsSaveDialogOpen(false);
      setPortfolioName("");
      fetchPortfolios(token);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleLoadPortfolio = (portfolio: { _id: string; name: string; createdAt: string }) => {
    if (!user) {
      toast.error("Please log in to load your portfolio");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token available");
      }
      fetch(`http://localhost:5170/api/portfolio/${portfolio._id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (!data.portfolio) {
            throw new Error("Portfolio not found");
          }

          setComponents(data.portfolio.components);
          setWindowTitle(data.portfolio.windowTitle);
          setWindowBackground(data.portfolio.windowBackground);
          setDropzoneSize(data.portfolio.dropzoneSize);
          setPythonCode(
            generateTkinterCode(
              data.portfolio.components,
              data.portfolio.windowTitle,
              data.portfolio.dropzoneSize.width,
              data.portfolio.dropzoneSize.height,
              data.portfolio.windowBackground
            )
          );

          toast.success(`Portfolio "${portfolio.name}" loaded successfully!`);
        })
        .catch((error) => {
          toast.error((error as Error).message);
        });
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (!user) {
      toast.error("Please log in to delete a portfolio");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token available");
      }
      const response = await fetch(`http://localhost:5170/api/portfolio/${portfolioId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Error deleting portfolio");
      }

      toast.success("Portfolio deleted successfully!");
      fetchPortfolios(token);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <Router>
        <DndProvider backend={HTML5Backend}>
          <Routes>
            <Route
              path="/"
              element={
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
                    <div className="mt-4">
                      {user ? (
                        <div className="mb-3">
                          <NavUser user={user} />
                        </div>
                      ) : (
                        <Link to="/signin">
                          <Button variant="outline" className="w-full mb-3">
                            Login
                          </Button>
                        </Link>
                      )}
                      <div className="text-xs">
                        <p>Contact us</p>
                        <p>Copyright © 2025 tk-designer.com</p>
                      </div>
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
                          <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Save Portfolio
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                              <DialogHeader>
                                <DialogTitle>Save Portfolio</DialogTitle>
                                <DialogDescription>
                                  Enter a name for your portfolio to save it.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="name" className="text-right">
                                    Name
                                  </Label>
                                  <Input
                                    id="name"
                                    value={portfolioName}
                                    onChange={(e) => setPortfolioName(e.target.value)}
                                    className="col-span-3"
                                    placeholder="My Portfolio"
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button type="button" onClick={handleSavePortfolio}>
                                  Save
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          <PortfolioSidebar
                            portfolios={portfolios}
                            onSelectPortfolio={handleLoadPortfolio}
                            onDeletePortfolio={handleDeletePortfolio}
                          />
                          <ModeToggle />
                        </TabsList>
                        <TabsContent value="visual">
                          <div ref={dropzoneRef}>
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
                          </div>
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
              }
            />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/signin" element={<LoginForm />} />
          </Routes>
          <CustomDragLayer />
          <Toaster />
        </DndProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;