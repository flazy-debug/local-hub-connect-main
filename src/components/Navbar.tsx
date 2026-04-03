import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Store, User, LogOut, LayoutDashboard, Shield, 
  CreditCard, Search, HelpCircle 
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { user, isSeller, isAdmin, signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/catalogue?q=${encodeURIComponent(search.trim())}`);
      setSearch("");
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-xl">
      <div className="container flex h-14 items-center justify-between md:h-16 gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 md:h-10 md:w-10">
            <Store className="h-4 w-4 text-primary-foreground md:h-5 w-5" />
          </div>
          <span className="font-display text-lg font-black text-primary md:text-xl tracking-tighter">
            Voiket<span className="text-accent underline decoration-2 underline-offset-4">Market</span>
          </span>
        </Link>

        {/* Global Search Bar - Hidden on mobile, shown on desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            placeholder="Rechercher à Lomé..." 
            className="w-full h-10 rounded-full bg-slate-100 border-none pl-10 text-sm font-medium focus-visible:ring-primary shadow-inner"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        <div className="flex items-center gap-1 md:gap-4 shrink-0">
          <div className="hidden items-center gap-6 lg:flex mr-2">
            <Link to="/catalogue" className="text-xs font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary">Catalogue</Link>
            <Link to="/boutiques" className="text-xs font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary">Boutiques</Link>
            <Link to="/aide" className="text-xs font-black uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary flex items-center gap-1.5 font-bold">
               <HelpCircle className="h-3 w-3" /> Aide
            </Link>
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {profile?.display_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl border-none shadow-2xl p-2">
                <div className="px-3 py-3">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">Mon Compte</p>
                  <p className="text-sm font-bold text-primary truncate">{profile?.display_name || user.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem asChild className="rounded-xl py-2.5">
                  <Link to="/profil" className="flex items-center gap-3 font-medium cursor-pointer"><User className="h-4 w-4" /> Mon Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="rounded-xl py-2.5">
                  <Link to="/suivi" className="flex items-center gap-3 font-medium cursor-pointer"><CreditCard className="h-4 w-4" /> Mes Commandes</Link>
                </DropdownMenuItem>
                {isSeller && (
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 bg-primary/5 text-primary">
                    <Link to="/dashboard" className="flex items-center gap-3 font-bold cursor-pointer"><LayoutDashboard className="h-4 w-4" /> Dashboard Business</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild className="rounded-xl py-2.5">
                   <Link to="/aide" className="flex items-center gap-3 font-medium cursor-pointer"><HelpCircle className="h-4 w-4" /> Centre d'aide</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild className="rounded-xl py-2.5 text-warning">
                    <Link to="/admin" className="flex items-center gap-3 font-bold cursor-pointer"><Shield className="h-4 w-4" /> Administration</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-slate-100" />
                <DropdownMenuItem onClick={() => signOut()} className="rounded-xl py-2.5 text-destructive font-bold cursor-pointer">
                  <LogOut className="h-4 w-4 mr-3" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
               <Link to="/auth" className="hidden sm:block">
                 <Button variant="ghost" className="font-bold text-sm">Connexion</Button>
               </Link>
               <Link to="/auth?type=vendeur">
                 <Button className="bg-primary text-white rounded-xl font-bold h-10 px-6 shadow-lg shadow-primary/20">Vendre</Button>
               </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
