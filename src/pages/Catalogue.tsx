import { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { categories, neighborhoods, formatCFA } from "@/lib/mock-data";
import { products as mockProducts } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";
import PageTransition from "@/components/PageTransition";
import PullToRefresh from "@/components/PullToRefresh";

export default function Catalogue() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [condition, setCondition] = useState(searchParams.get("condition") || "all");
  const [neighborhood, setNeighborhood] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        // Fetch seller profiles
        const sellerIds = [...new Set(data.map(p => p.seller_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, shop_name, verification_status, subscription_type")
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
            sellerType: prof?.shop_name ? "boutique" as const : "particulier" as const,
            neighborhood: p.neighborhood,
            rating: 0,
            reviewCount: 0,
            pickupAvailable: p.pickup_available,
            deliveryAvailable: p.delivery_available,
            pickupAddress: p.pickup_address,
            sellerVerification: (prof as any)?.verification_status || "none",
            sellerSubscription: (prof as any)?.subscription_type || "STANDARD",
            promoPrice: p.promo_price || undefined,
            isBoosted: p.is_boosted,
          };
        });
        // Sort: Boosted first, then PRO sellers, then verified, then others
        mapped.sort((a, b) => {
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;
          
          const order = { pro: 0, verified: 1, none: 2 };
          return (order[a.sellerVerification || "none"] ?? 2) - (order[b.sellerVerification || "none"] ?? 2);
        });
        setDbProducts(mapped);
      } else {
        // Fallback to mock data if no products in DB yet
        setDbProducts(mockProducts);
      }
      setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleRefresh = async () => { await fetchProducts(); };

  const allProducts = dbProducts;

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (category !== "all" && p.category !== category) return false;
      if (condition !== "all" && p.condition !== condition) return false;
      if (neighborhood !== "all" && p.neighborhood !== neighborhood) return false;
      if (priceRange === "0-10000" && p.price > 10000) return false;
      if (priceRange === "10000-30000" && (p.price < 10000 || p.price > 30000)) return false;
      if (priceRange === "30000+" && p.price < 30000) return false;
      return true;
    });
  }, [search, category, condition, neighborhood, priceRange, allProducts]);

  return (
    <PageTransition>
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen py-8">
      <div className="container">
        <h1 className="font-display text-3xl font-bold">Catalogue</h1>
        <p className="mt-1 text-muted-foreground">Découvrez les produits de vos boutiques locales</p>

        {/* Search & Filter Toggle */}
        <div className="mt-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Filtres
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border bg-card p-4 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Catégorie</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">État</label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="neuf">Neuf</SelectItem>
                  <SelectItem value="occasion">Occasion</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Quartier</label>
              <Select value={neighborhood} onValueChange={setNeighborhood}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {neighborhoods.map((n) => (
                    <SelectItem key={n} value={n}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Prix (CFA)</label>
              <Select value={priceRange} onValueChange={setPriceRange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les prix</SelectItem>
                  <SelectItem value="0-10000">Moins de 10 000</SelectItem>
                  <SelectItem value="10000-30000">10 000 — 30 000</SelectItem>
                  <SelectItem value="30000+">Plus de 30 000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Active Filters */}
        <div className="mt-3 flex flex-wrap gap-2">
          {category !== "all" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setCategory("all")}>
              {categories.find(c => c.id === category)?.name} ✕
            </Badge>
          )}
          {condition !== "all" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setCondition("all")}>
              {condition === "neuf" ? "Neuf" : "Occasion"} ✕
            </Badge>
          )}
          {neighborhood !== "all" && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setNeighborhood("all")}>
              {neighborhood} ✕
            </Badge>
          )}
        </div>

        {/* Results */}
        <div className="mt-6">
          {loading ? (
            <p className="text-muted-foreground">Chargement...</p>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted-foreground">{filtered.length} produit{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}</p>
              {filtered.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border bg-card p-12 text-center">
                  <p className="text-lg font-medium text-muted-foreground">Aucun produit trouvé</p>
                  <p className="mt-1 text-sm text-muted-foreground">Essayez de modifier vos filtres</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </PullToRefresh>
    </PageTransition>
  );
}
