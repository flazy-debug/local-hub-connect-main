import { Link, useLocation } from "react-router-dom";
import { Home, LayoutDashboard, ShoppingBag, User } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-4 text-[10px] font-black transition-all active:scale-95 font-sans", 
                isActive ? "text-primary" : "text-slate-400"
              )}>
              <tab.icon className={cn("h-6 w-6 mb-1", isActive ? "stroke-[2.5]" : "opacity-50")} />
              <span className={cn("uppercase tracking-[0.1em] font-black", isActive ? "opacity-100" : "opacity-40")}>
                {tab.label}
              </span>
              {isActive && (
                <motion.span 
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-1.5 w-10 rounded-b-2xl bg-primary shadow-[0_4px_12px_rgba(109,40,217,0.4)]" 
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
