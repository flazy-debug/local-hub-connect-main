import { Link } from "react-router-dom";
import { Search, ArrowRight, ShieldCheck, Truck, Star, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-market.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/ProductCard";
import ShopCard from "@/components/ShopCard";
import { products, shops, categories } from "@/lib/mock-data";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/lib/types";

const categoryIcons: Record<string, React.ReactNode> = {
  Shirt: <span className="text-2xl">👗</span>,
  Smartphone: <span className="text-2xl">📱</span>,
  Home: <span className="text-2xl">🏠</span>,
  Sparkles: <span className="text-2xl">✨</span>,
  UtensilsCrossed: <span className="text-2xl">🍽️</span>,
  Palette: <span className="text-2xl">🎨</span>,
};

export default function Index() {
  const [search, setSearch] = useState("");
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchBoosted = async () => {
      const { data } = await (supabase
        .from("products") as any)
        .select("*")
        .eq("is_boosted" as any, true)
        .eq("is_active", true)
        .limit(4);

      if (data && data.length > 0) {
        // Fetch seller details for these products
        const sellerIds = [...new Set(data.map((p: any) => p.seller_id))] as string[];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, shop_name, display_name, verification_status, subscription_type")
          .in("user_id", sellerIds);

        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

        const mapped: Product[] = data.map((p: any) => {
          const prof = profileMap.get(p.seller_id);
          return {
            id: p.id,
            name: p.name,
            description: p.description || "",
            price: p.price,
            images: p.images?.length > 0 ? p.images : ["/placeholder.svg"],
            category: p.category,
            condition: p.condition as "neuf" | "occasion",
            stock: p.stock,
            sellerId: p.seller_id,
            sellerName: prof?.shop_name || prof?.display_name || "Vendeur",
            sellerType: prof?.shop_name ? "boutique" : "particulier",
            neighborhood: p.neighborhood,
            rating: 0,
            reviewCount: 0,
            pickupAvailable: p.pickup_available,
            deliveryAvailable: p.delivery_available,
            sellerVerification: (prof as any)?.verification_status || "none",
            sellerSubscription: (prof as any)?.subscription_type || "STANDARD",
            isBoosted: p.is_boosted,
            promoPrice: p.promo_price || undefined,
          };
        });
        setFeaturedProducts(mapped);
      } else {
        // Fallback to first 4 products if no boosted items
        setFeaturedProducts(products.slice(0, 4) as any);
      }
    };

    fetchBoosted();
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden px-4 py-14 text-primary-foreground md:py-28">
        <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-primary/80" />
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl text-center"
          >
            <h1 className="font-display text-3xl font-bold leading-tight md:text-5xl lg:text-6xl">
              Achetez local,{" "}
              <span className="text-accent">soutenez</span> votre quartier
            </h1>
            <p className="mt-4 text-lg opacity-80 md:text-xl">
              La marketplace qui connecte les boutiques de votre quartier et les particuliers.
              Paiement Mobile Money sécurisé, retrait en boutique ou livraison.
            </p>

            <div className="mt-8 flex items-center gap-2 rounded-xl bg-card/10 p-2 backdrop-blur-sm">
              <Search className="ml-2 h-5 w-5 opacity-60" />
              <Input
                placeholder="Rechercher un produit, une boutique..."
                className="border-0 bg-transparent text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 md:w-auto" size="lg">
                Rechercher
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="border-b bg-card py-6">
        <div className="container">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: ShieldCheck, text: "Paiement Sécurisé", sub: "Mobile Money & Carte" },
              { icon: Truck, text: "Livraison & Pick-up", sub: "Retrait en boutique" },
              { icon: Star, text: "Avis Vérifiés", sub: "Après réception" },
              { icon: Smartphone, text: "Notification WhatsApp", sub: "Suivi en temps réel" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
                  <item.icon className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.text}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12">
        <div className="container">
          <h2 className="font-display text-2xl font-bold">Catégories</h2>
          <div className="mt-6 grid grid-cols-3 gap-3 md:grid-cols-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalogue?category=${cat.id}`}
                className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                {categoryIcons[cat.icon]}
                <span className="text-center text-xs font-medium text-foreground">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-secondary/50 py-12">
        <div className="container">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Produits à la une</h2>
            <Link to="/catalogue" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              Voir tout <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Local Shops */}
      <section className="py-12">
        <div className="container">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Boutiques Locales</h2>
            <Link to="/boutiques" className="flex items-center gap-1 text-sm font-medium text-accent hover:underline">
              Voir toutes <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Vendeur */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="container text-center">
          <h2 className="font-display text-3xl font-bold">Vous êtes commerçant ou artisan ?</h2>
          <p className="mx-auto mt-3 max-w-lg text-lg opacity-80">
            Passez du quartier au digital en 5 minutes. Zéro frais d'inscription,
            vous ne payez que lorsque vous vendez.
          </p>
          <Link to="/devenir-vendeur">
            <Button size="lg" className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90 md:w-auto h-12 text-base">
              Devenir Vendeur — C'est gratuit
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
