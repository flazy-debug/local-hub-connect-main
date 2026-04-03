import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  User, Package, MapPin, Phone, CheckCircle, Truck, 
  ShoppingBag, Star, Heart, AlertTriangle, ArrowRight,
  TrendingUp, Wallet, ShieldCheck, MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCFA } from "@/lib/mock-data";
import { cn } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import ShopCard from "@/components/ShopCard";

const statusLabels: Record<string, string> = {
  pending: "En attente", paid: "Payé", preparing: "En préparation",
  shipped: "Expédié", delivered: "Livré", completed: "Terminé",
};
const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground", paid: "bg-info/10 text-info",
  preparing: "bg-warning/10 text-warning", shipped: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success", completed: "bg-success/10 text-success",
};

export function BuyerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [wishlistProducts, setWishlistProducts] = useState<any[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [followedShops, setFollowedShops] = useState<any[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(true);

  useEffect(() => {
    if (user) {
      fetchOrders();
      fetchWishlist();
      fetchFollowedShops();
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    const { data } = await supabase.from("orders")
      .select("*")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);
    setOrders(data || []);
    setLoadingOrders(false);
  };

  const fetchWishlist = async () => {
    if (!user) return;
    setLoadingWishlist(true);
    const { data: wishItems } = await supabase.from("wishlist").select("product_id").eq("user_id", user.id);
    if (wishItems && wishItems.length > 0) {
      const productIds = wishItems.map(w => w.product_id);
      const { data: products } = await supabase.from("products").select("*").in("id", productIds).eq("is_active", true).limit(4);
      setWishlistProducts(products || []);
    }
    setLoadingWishlist(false);
  };

  const fetchFollowedShops = async () => {
    if (!user) return;
    setLoadingFollowed(true);
    const { data: follows } = await supabase.from("follows").select("seller_id").eq("follower_id", user.id);
    if (follows && follows.length > 0) {
      const sellerIds = follows.map(f => f.seller_id);
      const { data: profiles } = await supabase.from("profiles")
        .select("user_id, shop_name, shop_description, avatar_url, neighborhood, whatsapp_number")
        .in("user_id", sellerIds).not("shop_name", "is", null).limit(3);
      setFollowedShops((profiles || []).map(p => ({
        id: p.user_id, name: p.shop_name!, description: p.shop_description || "",
        image: p.avatar_url || "/placeholder.svg", neighborhood: p.neighborhood || "",
        whatsappNumber: p.whatsapp_number || "", productCount: 0, rating: 0,
      })));
    }
    setLoadingFollowed(false);
  };

  const confirmReception = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    await supabase.from("transactions").update({ status: "completed" }).eq("order_id", orderId);
    toast({ title: "Réception confirmée ✅", description: "Les fonds ont été débloqués pour le vendeur." });
    fetchOrders();
  };

  if (authLoading) return <div className="flex min-h-[60vh] items-center justify-center p-8">Chargement...</div>;

  return (
    <div className="space-y-8 pb-20">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#142642] to-[#1e3a5f] p-8 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-accent/20 blur-[80px]"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="font-display text-3xl font-black md:text-4xl">
              Hello, <span className="text-accent">{profile?.display_name || "Acheteur"}</span> 👋
            </h1>
            <p className="text-sm font-medium text-white/70 max-w-sm">
              Votre espace personnel pour gérer vos achats, suivre vos commandes et découvrir vos coups de cœur.
            </p>
          </div>
          <div className="flex items-center gap-4">
             <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 text-center border border-white/5 shadow-inner">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent/80">Commandes</p>
                <p className="text-2xl font-black">{orders.length}</p>
             </div>
             <div className="rounded-2xl bg-accent/20 backdrop-blur-md p-4 text-center border border-accent/20 shadow-lg shadow-accent/10">
                <p className="text-[10px] font-bold uppercase tracking-widest text-accent">Points Reward</p>
                <p className="text-2xl font-black text-accent">1,250</p>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Recent Orders & Wishlist */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="font-display text-xl font-black text-primary flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" /> Commandes Récentes
              </h2>
              <Link to="/profil?tab=orders" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                Tout voir <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="grid gap-4">
              {loadingOrders ? <div className="h-40 bg-muted/20 animate-pulse rounded-3xl" /> : 
               orders.length === 0 ? (
                <Card className="border-dashed py-12 rounded-3xl bg-secondary/10">
                  <CardContent className="text-center">
                    <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30 mb-4" />
                    <p className="font-bold text-primary">Aucune commande en cours</p>
                    <Link to="/catalogue"><Button variant="link" className="text-accent underline">Explorer le catalogue</Button></Link>
                  </CardContent>
                </Card>
               ) : orders.map(order => (
                <Card key={order.id} className="border-none shadow-premium bg-white overflow-hidden rounded-3xl group transition-all hover:shadow-xl">
                  <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-secondary/30 flex items-center justify-center text-primary font-black shadow-inner">
                        <ShoppingBag className="h-6 w-6 opacity-50" />
                      </div>
                      <div>
                        <p className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">CMD #{order.order_number}</p>
                        <h4 className="font-bold text-sm text-primary">
                          {(order.items as any[])?.[0]?.name || "Produit"} { (order.items as any[])?.length > 1 && `+${(order.items as any[])?.length - 1} articles`}
                        </h4>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={cn("text-[10px] font-black uppercase tracking-tighter px-3 h-6", statusColors[order.status])}>
                        {statusLabels[order.status]}
                      </Badge>
                      <span className="font-black text-accent text-lg">{formatCFA(order.total)}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl" onClick={() => navigate(`/suivi?id=${order.order_number}`)}>
                        <ArrowRight className="h-5 w-5" />
                      </Button>
                      {order.status === "shipped" && (
                        <Button onClick={() => confirmReception(order.id)} className="bg-success text-white h-10 rounded-xl px-4 font-bold text-xs">
                          Reçu
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between px-2">
              <h2 className="font-display text-xl font-black text-primary flex items-center gap-2">
                <Heart className="h-5 w-5 text-accent" /> Coups de Cœur
              </h2>
              <Link to="/profil?tab=wishlist" className="text-xs font-bold text-accent hover:underline flex items-center gap-1">
                Gérer mes favoris <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {loadingWishlist ? Array(4).fill(0).map((_, i) => <div key={i} className="aspect-square bg-muted/20 animate-pulse rounded-2xl" />) :
               wishlistProducts.length === 0 ? (
                <div className="col-span-full py-8 text-center bg-secondary/10 rounded-3xl">
                  <p className="text-sm text-muted-foreground">Enregistrez vos articles préférés pour les retrouver ici.</p>
                </div>
               ) : wishlistProducts.map(p => (
                <div key={p.id} className="relative group">
                  <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-muted shadow-sm group-hover:shadow-md transition-all">
                    <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 bg-white/80 backdrop-blur-md p-2 rounded-xl border border-white/20 transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                    <p className="text-[10px] font-black text-primary truncate uppercase">{p.name}</p>
                    <p className="text-xs font-black text-accent">{formatCFA(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Ambassador & Quick Links */}
        <div className="space-y-8">
          {/* Ambassador Premium Card */}
          <Card className="border-none bg-gradient-to-br from-accent to-orange-500 text-white rounded-[2rem] overflow-hidden shadow-2xl relative group">
            <div className="absolute right-0 top-0 h-full w-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
            <div className="p-8 relative z-10 space-y-6">
              <div className="h-14 w-14 rounded-[1.2rem] bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/10">
                <Star className="h-8 w-8 text-white fill-white animate-pulse" />
              </div>
              <h3 className="font-display text-2xl font-black leading-tight uppercase tracking-tight">
                Devenez<br/>Ambassadeur
              </h3>
              <p className="text-sm font-medium text-white/90 leading-relaxed italic">
                "Partagez votre style, gagnez des récompenses exclusives."
              </p>
              <div className="pt-4">
                 <Button onClick={() => navigate("/profil?tab=profile")} variant="secondary" className="w-full h-12 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-black/10 group-hover:scale-105 transition-transform">
                   Mon Code Privé
                 </Button>
              </div>
            </div>
          </Card>

          {/* Quick Actions List */}
          <Card className="border-none shadow-premium rounded-[2rem] bg-white p-6">
            <h3 className="font-display font-black text-primary mb-6 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" /> Espace Sécurisé
            </h3>
            <div className="space-y-3">
              {[
                { icon: User, label: "Mon Profil", link: "/profil" },
                { icon: Truck, label: "Suivi Express", link: "/suivi" },
                { icon: MapPin, label: "Boutiques Proches", link: "/boutiques" },
                { icon: MessageSquare, label: "Support Client", link: "https://wa.me/..." },
              ].map((item, i) => (
                <Link key={i} to={item.link} className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/20 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-secondary/30 flex items-center justify-center group-hover:bg-accent group-hover:text-white transition-colors">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-primary">{item.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                </Link>
              ))}
            </div>
          </Card>

          {/* Followed Shops Teaser */}
          <section className="px-2">
            <h3 className="font-display font-black text-primary mb-4 text-sm uppercase tracking-widest">Vos Boutiques Favorites</h3>
            {loadingFollowed ? <div className="space-y-2">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-muted/20 animate-pulse rounded-2xl" />)}</div> :
             followedShops.length === 0 ? <p className="text-xs text-muted-foreground italic">Vous ne suivez aucune boutique encore.</p> :
             <div className="space-y-3">
               {followedShops.map(shop => (
                 <Link key={shop.id} to={`/boutique/${shop.id}`} className="flex items-center gap-3 group">
                   <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white shadow-sm ring-1 ring-accent/20 group-hover:ring-accent transition-all">
                     <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
                   </div>
                   <div>
                     <p className="text-xs font-black text-primary group-hover:text-accent transition-colors">{shop.name}</p>
                     <p className="text-[10px] text-muted-foreground">{shop.neighborhood}</p>
                   </div>
                 </Link>
               ))}
             </div>
            }
          </section>
        </div>
      </div>
    </div>
  );
}
