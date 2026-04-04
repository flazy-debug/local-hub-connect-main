import { Store, Phone, Mail, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t bg-primary text-primary-foreground">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent">
                <Store className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="font-display text-lg font-bold text-white">
                Epure<span className="text-white underline underline-offset-4 decoration-accent">market</span>
              </span>
            </Link>
            <p className="mt-3 text-sm opacity-80">
              La marketplace locale qui connecte boutiques, artisans et particuliers à votre quartier.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold">Marketplace</h4>
            <ul className="mt-3 space-y-2 text-sm opacity-80">
              <li><Link to="/tous-les-produits" className="hover:opacity-100">Tous les produits</Link></li>
              <li><Link to="/boutiques" className="hover:opacity-100">Boutiques</Link></li>
              <li><Link to="/tous-les-produits?condition=occasion" className="hover:opacity-100">Occasion</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold">Vendeurs</h4>
            <ul className="mt-3 space-y-2 text-sm opacity-80">
              <li><Link to="/vendeur" className="hover:opacity-100">Devenir Vendeur</Link></li>
              <li><Link to="/vendeur/dashboard" className="hover:opacity-100">Tableau de bord</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold">Contact</h4>
            <ul className="mt-3 space-y-2 text-sm opacity-80">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Présence Internationale</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +228 90 XX XX XX</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> contact@epuremarket.com</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-primary-foreground/20 pt-6 text-center text-sm opacity-60">
            &copy; {new Date().getFullYear()} Epuremarket. Une plateforme de Epure Group. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
