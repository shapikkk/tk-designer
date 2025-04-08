import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PropertiesPanelProps {
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ onTitleChange }) => {
  return (
    <div className="w-72 p-3 space-y-3">
      <Card className="p-2 space-y-1.5 rounded-sm shadow-none">
        <h3 className="font-semibold text-sm">Size</h3>
        <div className="grid grid-cols-2 gap-1.5">
          <Input
            placeholder="Width"
            className="rounded-sm focus:ring-0 text-sm py-0.5"
          />
          <Input
            placeholder="Height"
            className="rounded-sm focus:ring-0 text-sm py-0.5"
          />
          <Input
            placeholder="Top"
            className="rounded-sm focus:ring-0 text-sm py-0.5"
          />
          <Input
            placeholder="Left"
            className="rounded-sm focus:ring-0 text-sm py-0.5"
          />
          <Input
            placeholder="ID"
            className="col-span-2 rounded-sm focus:ring-0 text-sm py-0.5"
          />
        </div>
      </Card>

      <Card className="p-2 space-y-1.5 rounded-sm shadow-none">
        <h3 className="font-semibold text-sm">Windows Title</h3>
        <Input
          placeholder="Title"
          onChange={onTitleChange}
          className="rounded-sm focus:ring-0 text-sm py-0.5"
        />
      </Card>

      <Card className="p-2 space-y-1.5 rounded-sm shadow-none">
        <h3 className="font-semibold text-sm">Content</h3>
        <div className="grid grid-cols-2 gap-1.5">
          <Button className="text-sm py-0.5 rounded-sm">Active background</Button>
          <Button className="text-sm py-0.5 rounded-sm">Active foreground</Button>
        </div>
        <div>
          <label className="block mb-0.5 text-sm font-medium">Anchor</label>
          <Select>
            <SelectTrigger className="w-full text-sm py-0.5 rounded-sm">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
          </Select>
        </div>
        <Input
          placeholder="Background color"
          className="rounded-sm focus:ring-0 text-sm py-0.5"
        />
        <Input
          placeholder="Bitmap"
          className="rounded-sm focus:ring-0 text-sm py-0.5"
        />
        <Input
          placeholder="Border"
          className="rounded-sm focus:ring-0 text-sm py-0.5"
        />
        <Input
          placeholder="Compound (not support)"
          className="rounded-sm focus:ring-0 text-sm py-0.5"
        />
      </Card>
    </div>
  );
};

export default PropertiesPanel;