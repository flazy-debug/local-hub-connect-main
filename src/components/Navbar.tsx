import { Link } from "react-router-dom";
import { Store, User, LogOut, LayoutDashboard, Shield, CreditCard } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Navbar() {
  const { user, isSeller, isAdmin, signOut, profile } = useAuth();

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-lg">
      <div className="container flex h-14 items-center justify-between md:h-16">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary md:h-9 md:w-9">
            <Store className="h-4 w-4 text-primary-foreground md:h-5 md:w-5" />
          </div>
          <span className="font-display text-lg font-bold text-foreground md:text-xl">
            Voiket<span className="text-accent">Market</span>
          </span>
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <Link to="/catalogue" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Catalogue</Link>
          <Link to="/boutiques" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Boutiques</Link>
          <Link to="/suivi" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Mes Commandes</Link>
          <Link to="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Tarifs</Link>
          {!isSeller && !isAdmin && (
            <Link to="/devenir-vendeur" className="text-sm font-medium text-accent transition-colors hover:text-accent/80">Devenir Vendeur</Link>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <User className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm font-medium">
                  {profile?.display_name || user.email}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profil" className="flex items-center gap-2"><User className="h-4 w-4" /> Mon Profil</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/suivi" className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Mes Commandes</Link>
                </DropdownMenuItem>
                {isSeller && (
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="flex items-center gap-2"><LayoutDashboard className="h-4 w-4" /> Dashboard</Link>
                  </DropdownMenuItem>
                )}
                {!isSeller && !isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/devenir-vendeur" className="flex items-center gap-2"><Store className="h-4 w-4" /> Devenir Vendeur</Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 text-warning font-semibold"><Shield className="h-4 w-4" /> Panneau d'admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" /> Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="outline" size="sm" className="h-9 text-xs md:text-sm">Connexion</Button>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
