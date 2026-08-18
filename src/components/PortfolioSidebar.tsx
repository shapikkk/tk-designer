import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Trash2 } from "lucide-react";

interface Portfolio {
  _id: string;
  name: string;
  createdAt: string;
}

interface PortfolioSidebarProps {
  portfolios: Portfolio[];
  onSelectPortfolio: (portfolio: Portfolio) => void;
  onDeletePortfolio: (portfolioId: string) => void;
}

export function PortfolioSidebar({ portfolios, onSelectPortfolio, onDeletePortfolio }: PortfolioSidebarProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          Load Portfolio
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <SheetHeader>
          <SheetTitle>Load Portfolio</SheetTitle>
        </SheetHeader>
        <nav className="grid gap-2 py-4">
          <NavigationMenu orientation="vertical">
            <NavigationMenuList className="flex-col items-start space-x-0 space-y-1">
              {portfolios.map((portfolio) => (
                <NavigationMenuItem key={portfolio._id} className="w-full">
                  <div className="flex items-center justify-between w-full pl-4">
                    <NavigationMenuLink
                      className="flex-1 text-sm font-medium px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                      onClick={() => onSelectPortfolio(portfolio)}
                    >
                      <div>
                        <div>{portfolio.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(portfolio.createdAt)}
                        </div>
                      </div>
                    </NavigationMenuLink>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeletePortfolio(portfolio._id)}
                      className="ml-2"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </nav>
      </SheetContent>
    </Sheet>
  );
}