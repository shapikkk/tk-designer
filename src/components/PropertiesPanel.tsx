import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateTkinterCode } from "@/generateTkinterCode";
import { Trash } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PropertiesPanelProps {
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  components: { id: string; name: string; x: number; y: number; text?: string; width?: number; height?: number; text_color?: string; bg_color?: string; border_width?: number; border_radius?: number; border_color?: string; font_size?: number; enable_hover?: boolean; hover_bg_color?: string; font_family?: string }[];
  selectedComponent: string | null;
  setComponents: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; x: number; y: number; text?: string; width?: number; height?: number; text_color?: string; bg_color?: string; border_width?: number; border_radius?: number; border_color?: string; font_size?: number; enable_hover?: boolean; hover_bg_color?: string; font_family?: string }[]>
  >;
  setPythonCode: React.Dispatch<React.SetStateAction<string>>;
  windowTitle: string;
  dropzoneSize: { width: string | number; height: string | number };
  windowBackground: string;
  setWindowBackground: React.Dispatch<React.SetStateAction<string>>;
}

export default function PropertiesPanel({
  onTitleChange,
  components,
  selectedComponent,
  setComponents,
  setPythonCode,
  windowTitle,
  dropzoneSize,
  windowBackground,
  setWindowBackground,
}: PropertiesPanelProps) {
  const selectedComp = components.find((comp) => comp.id === selectedComponent);

  const handleDelete = () => {
    if (!selectedComponent) {
      toast.error("Please select a component to delete.");
      return;
    }

    setComponents((prev) => {
      const updatedComponents = prev.filter((comp) => comp.id !== selectedComponent);
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
    toast.success("Component deleted successfully!");
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newText = e.target.value;
    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, text: newText } : comp
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
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newWidth = parseInt(e.target.value);
    if (isNaN(newWidth) || newWidth < 50) {
      toast.error("Width must be at least 50px.");
      return;
    }

    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, width: newWidth } : comp
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
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newHeight = parseInt(e.target.value);
    if (isNaN(newHeight) || newHeight < 20) {
      toast.error("Height must be at least 20px.");
      return;
    }

    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, height: newHeight } : comp
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
  };

  const handleTextColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newColor = e.target.value;
    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, text_color: newColor } : comp
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
  };

  const handleBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newColor = e.target.value || undefined;
    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, bg_color: newColor } : comp
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
  };

  const handleClearBgColor = () => {
    if (!selectedComponent) return;

    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, bg_color: undefined } : comp
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
  };

  const handleBorderWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newWidth = parseInt(e.target.value);
    if (isNaN(newWidth) || newWidth < 0) {
      toast.error("Border width must be at least 0px.");
      return;
    }

    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, border_width: newWidth } : comp
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
  };

  const handleBorderRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newRadius = parseInt(e.target.value);
    if (isNaN(newRadius) || newRadius < 0) {
      toast.error("Border radius must be at least 0px.");
      return;
    }

    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, border_radius: newRadius } : comp
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
  };

  const handleBorderColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newColor = e.target.value;
    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, border_color: newColor } : comp
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
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newSize = parseInt(e.target.value);
    if (isNaN(newSize) || newSize < 8) {
      toast.error("Font size must be at least 8px.");
      return;
    }

    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, font_size: newSize } : comp
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
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newFamily = e.target.value;
    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, font_family: newFamily } : comp
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
  };

  const handleEnableHoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newValue = e.target.checked;
    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, enable_hover: newValue } : comp
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
  };

  const handleHoverBgColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedComponent) return;

    const newColor = e.target.value;
    setComponents((prev) => {
      const updatedComponents = prev.map((comp) =>
        comp.id === selectedComponent ? { ...comp, hover_bg_color: newColor } : comp
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
  };

  const canChangeText = (name: string) => {
    return ["Button", "Labels", "CheckBox", "RadioButton"].includes(name);
  };

  const canChangeSize = (name: string) => {
    return name === "Button";
  };

  const canChangeTextColor = (name: string) => {
    return canChangeText(name);
  };

  const canChangeButtonStyles = (name: string) => {
    return name === "Button";
  };

  const canChangeCheckBoxStyles = (name: string) => {
    return name === "CheckBox" || name === "RadioButton";
  };

  const canChangeLabelStyles = (name: string) => {
    return name === "Labels";
  };

  return (
    <ScrollArea className="h-[900px] w-[350px] rounded-md border p-4 mt-6">
      <div className="w-64 p-4 border-l">
        <h2 className="text-lg font-semibold mb-3">Properties</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Window Title</label>
            <Input
              onChange={onTitleChange}
              placeholder="Window Title"
              className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
            />
          </div>
          <Separator />
          <div>
            <label className="text-sm font-medium">Window Background</label>
            <Input
              type="color"
              value={windowBackground}
              onChange={(e) => setWindowBackground(e.target.value)}
              className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
            />
          </div>
          <Separator />
          {selectedComp ? (
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Selected: {selectedComp.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Position: ({selectedComp.x}, {selectedComp.y})
                </p>
                <Separator className="mt-2"/>
              </div>
              {canChangeText(selectedComp.name) && (
                <div>
                  <label className="text-sm font-medium">Text</label>
                  <Input
                    value={selectedComp.text || ""}
                    onChange={handleTextChange}
                    placeholder="Enter text"
                    className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                  />
                </div>
              )}
              {canChangeTextColor(selectedComp.name) && (
                <div>
                  <label className="text-sm font-medium">Text Color</label>
                  <Input
                    type="color"
                    value={selectedComp.text_color || "#000000"}
                    onChange={handleTextColorChange}
                    className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                  />
                  <Separator className="mt-3"/>
                </div>
              )}
              {canChangeCheckBoxStyles(selectedComp.name) && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Background Color</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={selectedComp.bg_color || ""}
                        onChange={handleBgColorChange}
                        className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearBgColor}
                      >
                        Clear
                      </Button>
                    </div>
                    <Separator className="mt-3"/>
                  </div>
                </div>
              )}
              {canChangeLabelStyles(selectedComp.name) && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Background Color</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={selectedComp.bg_color || ""}
                        onChange={handleBgColorChange}
                        className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearBgColor}
                      >
                        Clear
                      </Button>
                    </div>
                    <Separator className="mt-3"/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Font Family</label>
                    <Input
                      value={selectedComp.font_family || "Arial"}
                      onChange={handleFontFamilyChange}
                      placeholder="Enter font family"
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Font Size (px)</label>
                    <Input
                      type="number"
                      value={selectedComp.font_size || 14}
                      onChange={handleFontSizeChange}
                      placeholder="Enter font size"
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                  </div>
                  <Separator />
                </div>
              )}
              {canChangeButtonStyles(selectedComp.name) && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Background Color</label>
                    <div className="flex gap-2 items-center">
                      <Input
                        type="color"
                        value={selectedComp.bg_color || "#3b82f6"}
                        onChange={handleBgColorChange}
                        className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleClearBgColor}
                      >
                        Clear
                      </Button>
                    </div>
                    <Separator className="mt-3"/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Border Width (px)</label>
                    <Input
                      type="number"
                      value={selectedComp.border_width || 0}
                      onChange={handleBorderWidthChange}
                      placeholder="Enter border width"
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Border Radius (px)</label>
                    <Input
                      type="number"
                      value={selectedComp.border_radius || 6}
                      onChange={handleBorderRadiusChange}
                      placeholder="Enter border radius"
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Border Color</label>
                    <Input
                      type="color"
                      value={selectedComp.border_color || "#3b82f6"}
                      onChange={handleBorderColorChange}
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                    <Separator className="mt-3"/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Font Size (px)</label>
                    <Input
                      type="number"
                      value={selectedComp.font_size || 14}
                      onChange={handleFontSizeChange}
                      placeholder="Enter font size"
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                    <Separator className="mt-3"/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Enable Hover</label>
                    <Input
                      type="checkbox"
                      checked={selectedComp.enable_hover || false}
                      onChange={handleEnableHoverChange}
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-7 h-7"
                    />
                    <Separator className="mt-3"/>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Hover Background Color</label>
                    <Input
                      type="color"
                      value={selectedComp.hover_bg_color || "#2563eb"}
                      onChange={handleHoverBgColorChange}
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                    <Separator className="mt-3"/>
                  </div>
                </div>
              )}
              {canChangeSize(selectedComp.name) && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Width (px)</label>
                    <Input
                      type="number"
                      value={selectedComp.width || 140}
                      onChange={handleWidthChange}
                      placeholder="Enter width"
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Height (px)</label>
                    <Input
                      type="number"
                      value={selectedComp.height || 28}
                      onChange={handleHeightChange}
                      placeholder="Enter height"
                      className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5"
                    />
                  </div>
                  <Separator />
                </div>
              )}
              <Button
                variant="outline"
                className="w-full bg-background text-foreground hover:bg-muted active:bg-muted"
                onClick={handleDelete}
              >
                <Trash className="mr-2 h-4 w-4" /> Delete Component
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a component to edit.</p>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}