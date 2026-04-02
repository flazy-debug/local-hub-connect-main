import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { shops as mockShops } from "@/lib/mock-data";
import ShopCard from "@/components/ShopCard";
import { Shop } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import PageTransition from "@/components/PageTransition";
import PullToRefresh from "@/components/PullToRefresh";

export default function Boutiques() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchShops = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, shop_name, shop_description, avatar_url, neighborhood, whatsapp_number, verification_status")
      .not("shop_name", "is", null);

    if (data && data.length > 0) {
      // Get product counts per seller
      const sellerIds = data.map(p => p.user_id);
      const { data: products } = await supabase
        .from("products")
        .select("seller_id")
        .eq("is_active", true)
        .in("seller_id", sellerIds);

      const productCounts = new Map<string, number>();
      (products || []).forEach(p => {
        productCounts.set(p.seller_id, (productCounts.get(p.seller_id) || 0) + 1);
      });

      // Get follower counts
      const { data: follows } = await supabase
        .from("follows")
        .select("seller_id")
        .in("seller_id", sellerIds);

      const followerCounts = new Map<string, number>();
      (follows || []).forEach(f => {
        followerCounts.set(f.seller_id, (followerCounts.get(f.seller_id) || 0) + 1);
      });

      const mapped: Shop[] = data
        .filter(p => p.shop_name)
        .map(p => ({
          id: p.user_id,
          name: p.shop_name!,
          description: p.shop_description || "",
          image: p.avatar_url || "/placeholder.svg",
          neighborhood: p.neighborhood || "",
          whatsappNumber: p.whatsapp_number || "",
          productCount: productCounts.get(p.user_id) || 0,
          rating: 0,
          followerCount: followerCounts.get(p.user_id) || 0,
          verificationStatus: (p as any).verification_status || "none",
        }));

      // Sort: PRO first, then verified, then others
      mapped.sort((a, b) => {
        const order = { pro: 0, verified: 1, none: 2 };
        return (order[a.verificationStatus || "none"] ?? 2) - (order[b.verificationStatus || "none"] ?? 2);
      });

      setShops(mapped);
    } else {
      setShops(mockShops);
    }
    setLoading(false);
  };

  useEffect(() => { fetchShops(); }, []);

  const handleRefresh = async () => { await fetchShops(); };

  const filtered = useMemo(() => {
    if (!search) return shops;
    const q = search.toLowerCase();
    return shops.filter(s =>
      s.name.toLowerCase().includes(q) || s.neighborhood.toLowerCase().includes(q)
    );
  }, [search, shops]);

  return (
    <PageTransition>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen py-8">
          <div className="container max-w-3xl">
            <h1 className="font-display text-3xl font-bold">Boutiques Locales</h1>
            <p className="mt-1 text-muted-foreground">Découvrez les commerçants de votre quartier</p>

            {/* Search */}
            <div className="relative mt-6">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou quartier..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <p className="mt-6 text-muted-foreground">Chargement...</p>
            ) : (
              <div className="mt-6 space-y-3">
                {filtered.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} />
                ))}
                {filtered.length === 0 && (
                  <p className="text-muted-foreground">Aucune boutique trouvée.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>
    </PageTransition>
  );
}
