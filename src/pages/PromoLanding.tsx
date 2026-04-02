import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, MapPin, Truck, Store, Star, Shield, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCFA } from "@/lib/mock-data";
import { useCart } from "@/lib/cart-store";
import { useToast } from "@/hooks/use-toast";
import PageTransition from "@/components/PageTransition";
import type { Product } from "@/lib/types";

export default function PromoLanding() {
  const { id } = useParams<{ id: string }>();
  const [params] = useSearchParams();
  const [product, setProduct] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();
  const { toast } = useToast();
  const headline = params.get("h") || "";
  const cta = params.get("cta") || "Commander maintenant";
  const promoPrice = params.get("promo") ? Number(params.get("promo")) : null;

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (data) {
        setProduct(data);
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", data.seller_id)
          .maybeSingle();
        setSeller(profile);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Produit introuvable</p>
        <Button asChild variant="outline"><Link to="/">Retour à l'accueil</Link></Button>
      </div>
    );
  }

  const image = product.images?.[0] || "/placeholder.svg";
  const displayPrice = promoPrice ?? product.price;

  const handleAdd = () => {
    const p: Product = {
      id: product.id,
      name: product.name,
      description: product.description || "",
      price: displayPrice,
      images: product.images || ["/placeholder.svg"],
      category: product.category,
      condition: product.condition || "neuf",
      stock: product.stock,
      sellerId: product.seller_id,
      sellerName: seller?.shop_name || seller?.display_name || "Vendeur",
      sellerType: "boutique",
      neighborhood: product.neighborhood,
      rating: 0,
      reviewCount: 0,
      pickupAvailable: product.pickup_available,
      deliveryAvailable: product.delivery_available,
      pickupAddress: product.pickup_address,
    };
    addItem(p, product.delivery_available ? "delivery" : "pickup");
    toast({ title: "Ajouté au panier 🛒" });
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-accent/5 to-background">
        {/* Hero */}
        <div className="container max-w-2xl py-6">
          <Link to="/" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Accueil
          </Link>

          {headline && (
            <motion.h1
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 text-center font-display text-2xl font-bold leading-tight md:text-3xl"
            >
              {headline}
            </motion.h1>
          )}

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-2xl border bg-card shadow-lg"
          >
            {/* Image */}
            <div className="aspect-square w-full overflow-hidden bg-muted">
              <img src={image} alt={product.name} className="h-full w-full object-cover" />
            </div>

            <div className="space-y-4 p-5 md:p-6">
              {!headline && (
                <h1 className="font-display text-xl font-bold md:text-2xl">{product.name}</h1>
              )}

              {/* Price */}
              <div className="flex items-baseline gap-3">
                <span className="font-display text-3xl font-bold text-accent">{formatCFA(displayPrice)}</span>
                {promoPrice && promoPrice < product.price && (
                  <span className="text-lg text-muted-foreground line-through">{formatCFA(product.price)}</span>
                )}
                {promoPrice && promoPrice < product.price && (
                  <Badge variant="destructive" className="text-xs">
                    -{Math.round((1 - promoPrice / product.price) * 100)}%
                  </Badge>
                )}
              </div>

              <p className="text-muted-foreground">{product.description}</p>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-3 text-sm">
                <div className="flex items-center gap-1 text-success">
                  <Shield className="h-4 w-4" /> Paiement sécurisé
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" /> {product.neighborhood}
                </div>
                {product.delivery_available && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Truck className="h-4 w-4" /> Livraison dispo
                  </div>
                )}
                {product.pickup_available && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Store className="h-4 w-4" /> Retrait possible
                  </div>
                )}
              </div>

              {/* Seller */}
              {seller && (
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-sm font-medium">
                    Vendu par <span className="text-accent">{seller.shop_name || seller.display_name}</span>
                  </p>
                </div>
              )}

              {/* CTA */}
              <Button
                onClick={handleAdd}
                size="lg"
                className="h-14 w-full bg-accent text-lg font-semibold text-accent-foreground hover:bg-accent/90"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {cta}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Stock disponible : {product.stock} • Condition : {product.condition === "neuf" ? "Neuf" : "Occasion"}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
