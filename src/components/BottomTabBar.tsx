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
              className={cn("relative flex flex-1 flex-col items-center gap-0.5 py-3 text-[10px] font-bold transition-all active:scale-95", isActive ? "text-accent" : "text-muted-foreground")}>
              <tab.icon className={cn("h-6 w-6 mb-0.5", isActive && "stroke-[2.5]")} />
              <span className="uppercase tracking-tighter">{tab.label}</span>
              {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-6 rounded-b-full bg-accent shadow-[0_0_10px_rgba(249,115,22,0.5)]" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
