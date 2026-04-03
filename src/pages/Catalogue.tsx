import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { categories, neighborhoods, formatCFA } from "@/lib/mock-data";
import { products as mockProducts } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Product } from "@/lib/types";
import PageTransition from "@/components/PageTransition";
import PullToRefresh from "@/components/PullToRefresh";
import { motion, AnimatePresence } from "framer-motion";

export default function Catalogue() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get("q") || "";
  const catParam = searchParams.get("category") || "all";
  
  const [search, setSearch] = useState(queryParam);
  const [debouncedSearch, setDebouncedSearch] = useState(queryParam);
  const [category, setCategory] = useState(catParam);
  const [condition, setCondition] = useState("all");
  const [neighborhood, setNeighborhood] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state with URL params on initial load
  useEffect(() => {
    if (queryParam) setSearch(queryParam);
    if (catParam) setCategory(catParam);
  }, [queryParam, catParam]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      // Search logic
      if (debouncedSearch) {
        query = query.or(`name.ilike.%${debouncedSearch}%,description.ilike.%${debouncedSearch}%,category.ilike.%${debouncedSearch}%`);
      }

      // Filters
      if (category !== "all") {
        query = query.eq("category", category);
      }
      if (condition !== "all") {
        query = query.eq("condition", condition);
      }
      if (neighborhood !== "all") {
        query = query.eq("neighborhood", neighborhood);
      }

      // Execute query
      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const sellerIds = [...new Set(data.map(p => p.seller_id))];
        const { data: profiles, error: profError } = await supabase
          .from("profiles")
          .select("user_id, display_name, shop_name, verification_status, subscription_type, shop_slug")
          .in("user_id", sellerIds);

        if (profError) throw profError;
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
            pickupAddress: p.pickup_address,
            sellerVerification: (prof as any)?.verification_status || "none",
            sellerSubscription: (prof as any)?.subscription_type || "STANDARD",
            promoPrice: p.promo_price || undefined,
            isBoosted: p.is_boosted,
          };
        });

        // Client-side price filtering (easier than Supabase complex filters for ranges)
        let filtered = mapped;
        if (priceRange === "0-10000") filtered = filtered.filter(p => p.price <= 10000);
        if (priceRange === "10000-30000") filtered = filtered.filter(p => p.price >= 10000 && p.price <= 30000);
        if (priceRange === "30000+") filtered = filtered.filter(p => p.price >= 30000);

        // Sorting
        filtered.sort((a, b) => {
          if (a.isBoosted && !b.isBoosted) return -1;
          if (!a.isBoosted && b.isBoosted) return 1;
          const order = { pro: 0, verified: 1, none: 2 };
          return (order[a.sellerVerification || "none"] ?? 2) - (order[b.sellerVerification || "none"] ?? 2);
        });

        setDbProducts(filtered);
      } else {
        setDbProducts([]);
      }
    } catch (error: any) {
      console.error("Error fetching products:", error);
      setDbProducts([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, condition, neighborhood, priceRange]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = async () => { await fetchProducts(); };

  return (
    <PageTransition>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen py-8 bg-slate-50/50">
          <div className="container">
            <header className="mb-8">
              <h1 className="font-display text-4xl font-black text-primary uppercase tracking-tighter">Catalogue</h1>
              <p className="mt-1 text-muted-foreground font-medium">Découvrez les trésors de vos boutiques locales à Lomé</p>
            </header>

            {/* Search & Filters Centralized */}
            <div className="sticky top-20 z-40 space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input
                    placeholder="Rechercher un article, une marque..."
                    className="pl-12 h-12 rounded-2xl border-none shadow-premium bg-white text-base focus-visible:ring-primary"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant={showFilters ? "default" : "outline"}
                  onClick={() => setShowFilters(!showFilters)}
                  className="h-12 rounded-2xl px-6 font-bold shadow-premium border-none bg-white text-primary hover:bg-slate-100 data-[state=open]:bg-primary data-[state=open]:text-white"
                >
                  <SlidersHorizontal className="mr-2 h-5 w-5" /> Filtres
                </Button>
              </div>

              <AnimatePresence>
                {showFilters && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 gap-3 rounded-3xl border-none bg-white p-6 shadow-premium md:grid-cols-4">
                      <FilterGroup label="Catégorie" value={category} onChange={setCategory} options={[{id: "all", name: "Toutes"}, ...categories]} />
                      <FilterGroup label="État" value={condition} onChange={setCondition} options={[{id: "all", name: "Tous"}, {id: "neuf", name: "Neuf"}, {id: "occasion", name: "Occasion"}]} />
                      <FilterGroup label="Quartier" value={neighborhood} onChange={setNeighborhood} options={[{id: "all", name: "Tous"}, ...neighborhoods.map(n => ({id: n, name: n}))]} />
                      <FilterGroup label="Prix (CFA)" value={priceRange} onChange={setPriceRange} options={[
                        {id: "all", name: "Tous les prix"},
                        {id: "0-10000", name: "Moins de 10 000"},
                        {id: "10000-30000", name: "10 000 — 30 000"},
                        {id: "30000+", name: "Plus de 30 000"}
                      ]} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Active Badges */}
            {(category !== "all" || condition !== "all" || neighborhood !== "all") && (
              <div className="mt-6 flex flex-wrap gap-2">
                {category !== "all" && <FilterBadge label={categories.find(c => c.id === category)?.name} onRemove={() => setCategory("all")} />}
                {condition !== "all" && <FilterBadge label={condition === "neuf" ? "Neuf" : "Occasion"} onRemove={() => setCondition("all")} />}
                {neighborhood !== "all" && <FilterBadge label={neighborhood} onRemove={() => setNeighborhood("all")} />}
              </div>
            )}

            {/* Results */}
            <div className="mt-10">
              {loading ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                   {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="aspect-[3/4] animate-pulse rounded-3xl bg-white shadow-premium"></div>)}
                </div>
              ) : (
                <>
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                      {dbProducts.length} résultat{dbProducts.length > 1 ? "s" : ""} à Lomé
                    </p>
                  </div>
                  
                  {dbProducts.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                      {dbProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-[40px] bg-white p-16 text-center shadow-premium"
                    >
                      <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
                        <PackageSearch className="h-12 w-12 text-slate-300" />
                      </div>
                      <h3 className="text-2xl font-black text-primary">Oups ! Rien trouvé...</h3>
                      <p className="mx-auto mt-3 max-w-sm text-muted-foreground leading-relaxed">
                        Aucun article ne correspond à votre recherche à Lomé. 
                        Essayez un autre mot-clé ou parcourez nos catégories.
                      </p>
                      <Button 
                        variant="secondary" 
                        size="lg" 
                        className="mt-8 rounded-2xl bg-primary text-white hover:bg-primary/90 px-8"
                        onClick={() => { setSearch(""); setCategory("all"); setCondition("all"); setNeighborhood("all"); }}
                      >
                        Réinitialiser la recherche
                      </Button>
                    </motion.div>
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

function FilterGroup({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: any[] }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{label}</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-11 rounded-xl border-none bg-slate-50 text-xs font-bold text-primary">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-none shadow-xl">
          {options.map((opt) => (
            <SelectItem key={opt.id} value={opt.id} className="text-xs font-semibold py-3">{opt.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function FilterBadge({ label, onRemove }: { label?: string, onRemove: () => void }) {
  return (
    <Badge 
      variant="secondary" 
      className="h-8 cursor-pointer rounded-full bg-white px-4 text-[10px] font-black uppercase tracking-wider text-primary shadow-sm hover:bg-slate-50 border-none"
      onClick={onRemove}
    >
      {label} <span className="ml-2 opacity-40">✕</span>
    </Badge>
  );
}
