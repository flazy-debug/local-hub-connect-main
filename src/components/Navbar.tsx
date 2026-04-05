import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Store, User, LogOut, LayoutDashboard, Shield, 
  CreditCard, Search, HelpCircle, ArrowRight 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Shop } from "@/lib/types";
import { shops as mockShops } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, isSeller, isAdmin, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/tous-les-produits?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <nav className="sticky top-0 z-[50] glass-morphism transition-all duration-300">
      <div className="container flex h-16 items-center justify-between md:h-20 gap-8">
        <Link to="/" className="flex items-center gap-3 shrink-0 group transition-transform hover:scale-[1.02]">
          <div className="flex h-10 w-10 items-center justify-center rounded-3xl bg-primary shadow-[0_8px_24px_rgba(109,40,217,0.25)] md:h-12 md:w-12">
            <Store className="h-5 w-5 text-primary-foreground md:h-6 w-6" />
          </div>
          <span className="font-logo text-xl font-black text-primary md:text-2xl tracking-tight">
            Epure<span className="text-secondary">market</span>
          </span>
        </Link>

        {/* Global Search Bar - Hidden on mobile, shown on desktop */}
        <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xl relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Rechercher sur Epuremarket..." 
            className="w-full h-12 rounded-3xl bg-slate-100/50 border-none pl-12 text-sm font-medium focus-visible:ring-primary/10 shadow-none transition-all focus:bg-white/80"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-2 md:gap-6 shrink-0">
          <div className="hidden items-center gap-8 xl:flex mr-4">
            <Link to="/tous-les-produits" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-primary">Produits</Link>
            
            <Link to="/boutiques" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-primary">Boutiques</Link>

            <Link to="/aide" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 transition-colors hover:text-primary flex items-center gap-2">
               <HelpCircle className="h-3.5 w-3.5" /> Support
            </Link>
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-11 w-11 rounded-3xl hover:bg-slate-100 transition-all border-none">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                    {profile?.display_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 rounded-[2rem] border-none shadow-[0_24px_48px_rgba(20,27,43,0.1)] p-3 glass-morphism mt-2">
                <div className="px-4 py-4">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Profil personnel</p>
                  <p className="text-sm font-black text-primary truncate">{profile?.display_name || user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-slate-100/50 mx-2" />
                <div className="p-1 space-y-1">
                  <DropdownMenuItem asChild className="rounded-2xl py-3 px-4 focus:bg-primary/5 cursor-pointer">
                    <Link to="/profil" className="flex items-center gap-4 font-bold text-slate-600"><User className="h-4.5 w-4.5" /> Mon Profil</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="rounded-2xl py-3 px-4 focus:bg-primary/5 cursor-pointer">
                    <Link to="/suivi" className="flex items-center gap-4 font-bold text-slate-600"><CreditCard className="h-4.5 w-4.5" /> Commandes</Link>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem asChild className="rounded-2xl py-3 px-4 focus:bg-accent/5 cursor-pointer">
                      <Link to="/admin-portal" className="flex items-center gap-4 font-bold text-accent"><Shield className="h-4.5 w-4.5" /> Administration</Link>
                    </DropdownMenuItem>
                  )}
                  {isSeller && (
                    <DropdownMenuItem asChild className="rounded-2xl py-3 px-4 bg-primary/5 text-primary focus:bg-primary/10 cursor-pointer">
                      <Link to="/dashboard" className="flex items-center gap-4 font-black"><LayoutDashboard className="h-4.5 w-4.5" /> Dashboard Business</Link>
                    </DropdownMenuItem>
                  )}
                </div>
                <DropdownMenuSeparator className="bg-slate-100/50 mx-2" />
                <div className="p-1">
                  <DropdownMenuItem onClick={() => signOut()} className="rounded-2xl py-3 px-4 text-destructive font-black cursor-pointer focus:bg-destructive/5">
                    <LogOut className="h-4.5 w-4.5 mr-4" /> Quitter
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-3">
               <Link to="/auth" className="hidden sm:block">
                 <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-primary">Connexion</Button>
               </Link>
               <Link to="/auth?type=vendeur">
                 <Button className="bg-primary hover:bg-primary/90 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.15em] h-11 px-8 shadow-[0_12px_24px_rgba(109,40,217,0.25)] transition-all hover:translate-y-[-2px]">
                   Vendre
                 </Button>
               </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
