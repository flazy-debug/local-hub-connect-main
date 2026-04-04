import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "@/lib/types";
import { products as mockProducts } from "@/lib/mock-data";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true);

      if (fetchError) {
        console.warn("Supabase fetch failed, using mock data:", fetchError);
        setProducts(mockProducts);
        return;
      }

      if (data && data.length > 0) {
        const sortedData = [...data].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        );

        const sellerIds = [...new Set(data.map(p => p.seller_id))];
        const { data: profiles, error: profError } = await supabase
          .from("profiles")
          .select("user_id, display_name, shop_name, verification_status, subscription_type")
          .in("user_id", sellerIds);

        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

        const mapped: Product[] = sortedData.map((p: any) => {
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
            isBoosted: p.is_boosted || false,
          };
        });

        setProducts(mapped);
      } else {
        // Fallback to mock data if DB is empty
        setProducts(mockProducts);
      }
    } catch (e: any) {
      console.error("Error in useProducts, falling back to mock:", e);
      setProducts(mockProducts);
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refresh: fetchProducts };
}
