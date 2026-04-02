import { Link } from "react-router-dom";
import { Shop } from "@/lib/types";
import { MapPin, Package, Users } from "lucide-react";
import VerificationBadge from "@/components/VerificationBadge";

export default function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link to={`/boutique/${shop.id}`} className="group">
      <div className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
        <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
          <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="font-display font-semibold text-foreground">{shop.name}</h3>
            <VerificationBadge status={shop.verificationStatus} />
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">{shop.description}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{shop.neighborhood}</span>
            <span className="flex items-center gap-1"><Package className="h-3 w-3" />{shop.productCount} produits</span>
            {(shop.followerCount ?? 0) > 0 && (
              <span className="flex items-center gap-1"><Users className="h-3 w-3" />{shop.followerCount} abonnés</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
