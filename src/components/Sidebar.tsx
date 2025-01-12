import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ClipboardList, LayoutDashboard, Users, FileText } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Procesos",
    icon: ClipboardList,
    href: "/dashboard/processes",
  },
  {
    title: "Clientes",
    icon: Users,
    href: "/dashboard/clients",
  },
  {
    title: "Formatos",
    icon: FileText,
    href: "/dashboard/formats",
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <div className="pb-12 min-h-screen">
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Link to={item.href} key={item.href}>
                <Button
                  variant={location.pathname === item.href ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    location.pathname === item.href && "bg-muted"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.title}
                </Button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
