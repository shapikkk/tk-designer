import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { generateTkinterCode } from "@/generateTkinterCode";
import { Trash } from "lucide-react";

interface PropertiesPanelProps {
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  components: { id: string; name: string; x: number; y: number; text?: string }[];
  selectedComponent: string | null;
  setComponents: React.Dispatch<
    React.SetStateAction<{ id: string; name: string; x: number; y: number; text?: string }[]>
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

  const canChangeText = (name: string) => {
    return ["Button", "Labels", "CheckBox", "RadioButton", "Message"].includes(name);
  };

  return (
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
        <div>
          <label className="text-sm font-medium">Window Background</label>
          <Input
            type="color"
            value={windowBackground}
            onChange={(e) => setWindowBackground(e.target.value)}
            className="mt-1 rounded-sm focus:ring-0 text-sm py-1.5 w-full"
          />
        </div>

        {selectedComp ? (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">Selected: {selectedComp.name}</h3>
              <p className="text-xs text-muted-foreground">
                Position: ({selectedComp.x}, {selectedComp.y})
              </p>
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
  );
}