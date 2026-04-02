import { Link } from "react-router-dom";
import { Product } from "@/lib/types";
import { formatCFA } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, ShoppingBag } from "lucide-react";
import VerificationBadge from "@/components/VerificationBadge";
import WishlistButton from "@/components/WishlistButton";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link to={`/produit/${product.id}`} className="group">
      <div className={`overflow-hidden rounded-xl border bg-card transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${product.isBoosted ? "ring-1 ring-accent/30 shadow-md shadow-accent/5" : ""}`}>
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3 flex gap-2">
            <Badge variant={product.condition === "neuf" ? "default" : "secondary"} className={product.condition === "neuf" ? "bg-success text-success-foreground" : ""}>
              {product.condition === "neuf" ? "Neuf" : "Occasion"}
            </Badge>
            {product.isBoosted && (
              <Badge className="bg-accent text-accent-foreground border-none animate-pulse">🔥 Boosté</Badge>
            )}
          </div>
          {/* Wishlist + pickup badges */}
          <div className="absolute right-3 top-3">
            <WishlistButton productId={product.id} size="sm" />
          </div>
          {product.pickupAvailable && (
            <div className="absolute bottom-3 right-3">
              <Badge variant="outline" className="border-card bg-card/90 text-foreground backdrop-blur-sm">
                <ShoppingBag className="mr-1 h-3 w-3" /> Pick-up
              </Badge>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="font-display font-semibold leading-tight text-foreground line-clamp-2">
            {product.name}
          </h3>

          <div className="mt-2 flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              <span className="text-xs font-medium">{product.rating}</span>
            </div>
            <span className="text-xs text-muted-foreground">({product.reviewCount} avis)</span>
          </div>

          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {product.neighborhood}
          </div>

          {/* Price with promo */}
          <div className="mt-3 flex items-center gap-2">
            {(product as any).promoPrice ? (
              <>
                <p className="font-display text-lg font-bold text-accent">{formatCFA((product as any).promoPrice)}</p>
                <p className="text-sm text-muted-foreground line-through">{formatCFA(product.price)}</p>
              </>
            ) : (
              <p className="font-display text-lg font-bold text-accent">{formatCFA(product.price)}</p>
            )}
          </div>

          {/* Seller info - hidden for commission sellers */}
          {product.sellerSubscription && product.sellerSubscription !== "STANDARD" ? (
            <div className="mt-2 flex items-center gap-1 border-t pt-2 text-xs text-muted-foreground">
              <span>Vendu par :</span>
              <Link
                to={`/boutique/${product.sellerId}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-foreground hover:text-accent hover:underline"
              >
                {product.sellerName}
              </Link>
              <VerificationBadge status={product.sellerVerification} size="sm" />
              <span>•</span>
              <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{product.neighborhood}</span>
            </div>
          ) : (
            <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{product.neighborhood}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
