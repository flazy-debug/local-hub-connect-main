import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", icon: Home, label: "Accueil" },
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/dashboard?tab=orders", icon: ShoppingBag, label: "Ventes" },
  { path: "/profil", icon: User, label: "Profil", authPath: "/auth" },
];

export default function BottomTabBar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-lg md:hidden safe-bottom">
      <div className="flex items-stretch justify-around">
        {tabs.map((tab) => {
          const href = tab.authPath && !user ? tab.authPath : tab.path;
          const isActive = tab.path === "/" ? location.pathname === "/" : location.pathname.startsWith(tab.path);
          return (
            <Link key={tab.path} to={href}
              className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors", isActive ? "text-accent" : "text-muted-foreground")}>
              <tab.icon className={cn("h-6 w-6", isActive && "stroke-[2.5]")} />
              <span>{tab.label}</span>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-accent" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
