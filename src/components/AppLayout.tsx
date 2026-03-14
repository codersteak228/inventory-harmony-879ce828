import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlobalSearch } from "@/components/GlobalSearch";
import {
  LayoutDashboard,
  Package,
  Truck,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Warehouse as WarehouseIcon,
  MapPin,
  FileText,
  Users,
  LogOut,
  Menu,
  Search,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const navSections = [
  {
    label: "Main",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/products", icon: Package, label: "Products" },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/receipts", icon: ArrowDownToLine, label: "Receipts" },
      { to: "/delivery-orders", icon: ArrowUpFromLine, label: "Delivery Orders" },
      { to: "/internal-transfers", icon: ArrowLeftRight, label: "Internal Transfers" },
      { to: "/stock-ledger", icon: FileText, label: "Stock Ledger" },
    ],
  },
  {
    label: "Configuration",
    items: [
      { to: "/warehouses", icon: WarehouseIcon, label: "Warehouses" },
      { to: "/locations", icon: MapPin, label: "Locations" },
    ],
  },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-sidebar transition-all duration-200",
          sidebarOpen ? "w-60" : "w-0 overflow-hidden"
        )}
      >
        <div className="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
          <Package className="h-6 w-6 text-sidebar-primary" />
          <span className="font-semibold tracking-tight text-sidebar-foreground">CoreInventory</span>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {navSections.map((section) => (
            <Collapsible key={section.label} defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
                {section.label}
                <ChevronDown className="h-3 w-3" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                {section.items.map((item) => {
                  const active = location.pathname === item.to;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                        active
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </CollapsibleContent>
            </Collapsible>
          ))}

          {user?.role === "admin" && (
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground">
                Admin
                <ChevronDown className="h-3 w-3" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Link
                  to="/pending-users"
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm transition-colors",
                    location.pathname === "/pending-users"
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Users className="h-4 w-4" />
                  Pending Users
                </Link>
              </CollapsibleContent>
            </Collapsible>
          )}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-sidebar-accent text-xs font-medium text-sidebar-accent-foreground">
              {user?.loginId?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">{user?.loginId}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={logout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex h-14 items-center gap-4 border-b border-border px-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            className="relative h-9 w-full max-w-sm justify-start text-sm text-muted-foreground"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="mr-2 h-4 w-4" />
            Search products, SKU, receipts...
            <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
              ⌘K
            </kbd>
          </Button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>

      <GlobalSearch />
    </div>
  );
}
