import { ThemeProvider } from "@/components/theme-provider"
import { ModeToggle } from "@/components/mode-toggle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { useState } from "react"

function App() {
  const widgets = [
    "Labels",
    "Button",
    "CheckBox",
    "RadioButton",
    "Entry",
    "ListBox",
    "Message",
  ]

  const [dropzoneSize, setDropzoneSize] = useState({
    width: "100%",
    height: "700px"
  })

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDropzoneSize(prev => ({
      ...prev,
      width: value ? `${value}px` : "100%"
    }))
  }

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDropzoneSize(prev => ({
      ...prev,
      height: value ? `${value}px` : "700px"
    }))
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-60 p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-3">Core Widgets</h2>
          <div className="space-y-1.5">
            {widgets.map((widget) => (
              <Button
                key={widget}
                className="w-full justify-start font-medium py-1.5 rounded-sm text-sm"
              >
                {widget}
              </Button>
            ))}
          </div>
        </div>
        <div className="text-xs mt-4">
          <p>Contact us</p>
          <p>Copyright © 2025 tk-designer.com</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1">
        {/* Visual Area */}
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
                {<ModeToggle />}
              </ThemeProvider>
            </TabsList>
            <TabsContent value="visual">
              <div 
                className="w-full rounded-sm border"
                style={{ 
                  borderColor: 'var(--border)',
                  width: dropzoneSize.width,
                  height: dropzoneSize.height,
                  transition: 'all 0.3s ease'
                }}
              >
                {/* CSS-mesh, background-image or SVG */}
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
              <div className="w-full h-[700px] rounded-sm p-2 font-mono text-sm border" style={{ borderColor: 'var(--border)' }}>
                # Python code will appear here
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Properties Panel */}
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
              className="rounded-sm focus:ring-0 text-sm py-0.5"
            />
          </Card>

          <Card className="p-2 space-y-1.5 rounded-sm shadow-none">
            <h3 className="font-semibold text-sm">Content</h3>
            <div className="grid grid-cols-2 gap-1.5">
              <Button className="text-sm py-0.5 rounded-sm">
                Active background
              </Button>
              <Button className="text-sm py-0.5 rounded-sm">
                Active foreground
              </Button>
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
      </div>
    </div>
  )
}

export default App