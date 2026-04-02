import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { shops as mockShops, products as mockProducts } from "@/lib/mock-data";
import ProductCard from "@/components/ProductCard";
import { MapPin, MessageCircle, Package, Users, Facebook, Instagram, Link as LinkIcon, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shop, Product } from "@/lib/types";
import VerificationBadge from "@/components/VerificationBadge";
import FollowButton from "@/components/FollowButton";

export default function ShopDetail() {
  const { id, slug } = useParams();
  const [shop, setShop] = useState<Shop | null>(null);
  const [shopProducts, setShopProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);

  const handleShare = async () => {
    if (!shop) return;
    const shareUrl = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: shop.name,
          text: `Découvrez la boutique ${shop.name} sur VoiketMarket !`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Erreur de partage:", err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  const fetchFollowerCount = async (sellerId: string) => {
    if (!sellerId) return;
    const { count } = await supabase
      .from("follows")
      .select("id", { count: "exact", head: true })
      .eq("seller_id", sellerId);
    setFollowerCount(count || 0);
  };

  useEffect(() => {
    const fetchShop = async () => {
      let query = supabase.from("profiles").select("*");
      
      if (slug) {
        query = query.eq("shop_slug", slug);
      } else if (id) {
        query = query.eq("user_id", id);
      } else {
        setLoading(false);
        return;
      }

      const { data: profile } = await query.single();

      if (profile && profile.shop_name) {
        setShop({
          id: profile.user_id,
          name: profile.shop_name,
          description: profile.shop_description || "",
          image: profile.avatar_url || "/placeholder.svg",
          neighborhood: profile.neighborhood || "",
          whatsappNumber: profile.whatsapp_number || "",
          productCount: 0,
          rating: 0,
          verificationStatus: (profile as any).verification_status || "none",
          facebookUrl: profile.facebook_url || "",
          instagramUrl: profile.instagram_url || "",
          tiktokUrl: profile.tiktok_url || "",
        });

        fetchFollowerCount(profile.user_id);

        const { data: prods } = await supabase
          .from("products")
          .select("*")
          .eq("seller_id", profile.user_id)
          .eq("is_active", true);

        if (prods) {
          setShopProducts(prods.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || "",
            price: p.price,
            images: p.images?.length > 0 ? p.images : ["/placeholder.svg"],
            category: p.category,
            condition: p.condition as "neuf" | "occasion",
            stock: p.stock,
            sellerId: p.seller_id,
            sellerName: profile.shop_name || profile.display_name || "Vendeur",
            sellerType: "boutique" as const,
            neighborhood: p.neighborhood,
            rating: 0,
            reviewCount: 0,
            pickupAvailable: p.pickup_available,
            deliveryAvailable: p.delivery_available,
            pickupAddress: p.pickup_address,
            sellerVerification: (profile as any).verification_status || "none",
          })));
        }
      } else if (id) {
        const mockShop = mockShops.find(s => s.id === id);
        setShop(mockShop || null);
        setShopProducts(mockProducts.filter(p => p.sellerId === id));
        fetchFollowerCount(id);
      }
      setLoading(false);
    };
    fetchShop();
  }, [id, slug]);

  if (loading) {
    return <div className="container py-20 text-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  if (!shop) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">Boutique introuvable</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <div className="flex items-center gap-4 rounded-xl border bg-card p-6">
          <div className="h-20 w-20 overflow-hidden rounded-xl bg-secondary">
            <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold">{shop.name}</h1>
              <VerificationBadge status={shop.verificationStatus} size="md" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">{shop.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {shop.neighborhood && (
                <span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{shop.neighborhood}</span>
              )}
              <span className="flex items-center gap-1"><Package className="h-4 w-4" />{shopProducts.length} produits</span>
              <span className="flex items-center gap-1"><Users className="h-4 w-4" />{followerCount} abonnés</span>
            </div>
          </div>
          <div className="ml-auto flex flex-col items-end gap-3">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-2">
                <Share2 className="h-4 w-4" /> <span className="hidden sm:inline">Partager</span>
              </Button>
              <FollowButton sellerId={shop.id} onFollowChange={() => fetchFollowerCount(shop.id)} />
            </div>
            {shop.whatsappNumber && (
              <a
                href={`https://wa.me/${shop.whatsappNumber.replace("+", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm font-medium text-success hover:bg-success/20 w-fit self-end"
              >
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </a>
            )}
            
            {(shop.facebookUrl || shop.instagramUrl || shop.tiktokUrl) && (
              <div className="flex items-center gap-2 justify-end mt-1">
                {shop.facebookUrl && (
                  <a href={shop.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-full transition-colors">
                    <Facebook className="h-4 w-4" />
                  </a>
                )}
                {shop.instagramUrl && (
                  <a href={shop.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-pink-500/10 text-pink-500 hover:bg-pink-500/20 rounded-full transition-colors">
                    <Instagram className="h-4 w-4" />
                  </a>
                )}
                {shop.tiktokUrl && (
                  <a href={shop.tiktokUrl} target="_blank" rel="noopener noreferrer" className="p-2 bg-black/10 dark:bg-white/10 text-foreground hover:bg-black/20 dark:hover:bg-white/20 rounded-full transition-colors">
                    <LinkIcon className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <h2 className="mt-8 font-display text-xl font-bold">Produits de la boutique</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {shopProducts.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {shopProducts.length === 0 && (
          <p className="mt-4 text-muted-foreground">Aucun produit pour cette boutique</p>
        )}
      </div>
    </div>
  );
}
