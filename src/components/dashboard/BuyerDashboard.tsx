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
  pending: "bg-slate-100 text-slate-600", paid: "bg-violet-100 text-violet-600",
  preparing: "bg-amber-100 text-amber-600", shipped: "bg-accent/10 text-accent",
  delivered: "bg-green-100 text-green-600", completed: "bg-green-100 text-green-600",
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
      {/* Premium Header - Digital Curator Style */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-accent to-accent-hover p-10 text-white shadow-2xl">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-[80px]"></div>
        <div className="absolute -left-12 -bottom-12 h-40 w-40 rounded-full bg-black/10 blur-[60px]"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-bold uppercase tracking-widest">
              <ShieldCheck className="h-3 w-3" /> Espace Sécurisé Elite
            </div>
            <h1 className="font-display text-4xl font-black md:text-5xl uppercase tracking-tighter leading-none">
              Mon <span className="opacity-70">Univers</span>
            </h1>
            <p className="text-sm font-medium text-white/80 max-w-sm leading-relaxed">
              Gérez vos acquisitions, suivez vos colis et explorez vos sélections exclusives dans un environnement haute couture.
            </p>
          </div>
          
          <div className="flex items-center gap-5">
             <div className="rounded-3xl bg-white/5 backdrop-blur-xl p-5 text-center border border-white/10 shadow-2xl min-w-[120px]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Commandes</p>
                <p className="text-3xl font-black text-white">{orders.length}</p>
             </div>
             <div className="rounded-3xl bg-white/5 backdrop-blur-xl p-5 text-center border border-white/10 shadow-2xl min-w-[120px]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">Points</p>
                <div className="flex items-center justify-center gap-1">
                  <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
                  <p className="text-3xl font-black text-white">1,250</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Recent Orders & Wishlist */}
        <div className="lg:col-span-2 space-y-8">
          <section>
            <div className="mb-6 flex items-center justify-between px-2">
              <h2 className="font-display text-2xl font-black text-primary flex items-center gap-3">
                <Package className="h-6 w-6 text-accent" /> Acquisitions Récentes
              </h2>
              <Link to="/profil?tab=orders" className="group flex items-center gap-2 text-xs font-bold text-accent uppercase tracking-widest hover:opacity-70 transition-all">
                Tout voir <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid gap-5">
              {loadingOrders ? <div className="h-40 bg-slate-100/50 animate-pulse rounded-[2rem] shadow-sm" /> : 
               orders.length === 0 ? (
                <Card className="border-none py-16 rounded-[2.5rem] bg-slate-50/50 backdrop-blur-sm shadow-inner text-center">
                  <CardContent>
                    <div className="h-20 w-20 rounded-full bg-white shadow-xl mx-auto flex items-center justify-center mb-6">
                      <ShoppingBag className="h-10 w-10 text-slate-200" />
                    </div>
                    <p className="font-display text-xl font-black text-primary uppercase mb-2">Aucune commande</p>
                    <p className="text-sm text-slate-500 mb-8 max-w-xs mx-auto">Votre collection est vide. Découvrez nos pièces d'exception dès maintenant.</p>
                    <Link to="/tous-les-produits">
                      <Button className="bg-accent hover:bg-accent-hover text-white rounded-2xl px-8 font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/20">
                        Explorer l'Atelier
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
               ) : orders.map(order => (
                <Card key={order.id} className="border-none shadow-soft overflow-hidden rounded-[2rem] bg-white group transition-all hover:shadow-premium hover:-translate-y-1">
                  <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                      <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-black shadow-inner group-hover:scale-105 transition-transform">
                        <ShoppingBag className="h-7 w-7 text-accent/30" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">CMD #{order.order_number}</p>
                          <Badge className={cn("text-[8px] font-black uppercase tracking-widest px-2 h-4", statusColors[order.status])}>
                            {statusLabels[order.status]}
                          </Badge>
                        </div>
                        <h4 className="font-display font-bold text-primary text-lg">
                          {(order.items as any[])?.[0]?.name || "Produit"} { (order.items as any[])?.length > 1 && <span className="text-accent/50 text-base">+{(order.items as any[])?.length - 1} articles</span>}
                        </h4>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-4 md:pt-0">
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total</p>
                        <p className="font-display font-black text-primary text-xl leading-none">{formatCFA(order.total)}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-12 w-12 rounded-2xl bg-slate-50 hover:bg-accent hover:text-white transition-all shadow-sm" 
                          onClick={() => navigate(`/suivi?id=${order.order_number}`)}
                        >
                          <ArrowRight className="h-5 w-5" />
                        </Button>
                        {order.status === "shipped" && (
                          <Button 
                            onClick={() => confirmReception(order.id)} 
                            className="bg-green-500 hover:bg-green-600 text-white h-12 rounded-2xl px-6 font-bold text-xs uppercase tracking-widest shadow-lg shadow-green-200"
                          >
                            Reçu
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-6 flex items-center justify-between px-2">
              <h2 className="font-display text-2xl font-black text-primary flex items-center gap-3">
                <Heart className="h-6 w-6 text-accent" /> Coups de Cœur
              </h2>
              <Link to="/profil?tab=wishlist" className="group flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-accent transition-all">
                Gérer mes favoris <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {loadingWishlist ? Array(4).fill(0).map((_, i) => <div key={i} className="aspect-[4/5] bg-slate-100 animate-pulse rounded-3xl" />) :
               wishlistProducts.length === 0 ? (
                <div className="col-span-full py-12 text-center bg-slate-50/50 backdrop-blur-sm rounded-[2.5rem] border border-dashed border-slate-200">
                  <p className="text-sm font-medium text-slate-400 italic">Enregistrez vos articles préférés pour les retrouver ici.</p>
                </div>
               ) : wishlistProducts.map(p => (
                <div key={p.id} className="relative group cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                  <div className="aspect-[4/5] overflow-hidden rounded-[2rem] bg-slate-100 shadow-soft group-hover:shadow-premium transition-all duration-500">
                    <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl transform translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <p className="text-[10px] font-black text-primary truncate uppercase tracking-tighter mb-1">{p.name}</p>
                    <p className="text-xs font-black text-accent">{formatCFA(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Ambassador & Quick Links */}
        <div className="space-y-8">
          {/* Ambassador Premium Card - Digital Curator Style */}
          <Card className="border-none bg-accent text-white rounded-[2.5rem] overflow-hidden shadow-2xl relative group min-h-[340px] flex flex-col">
            <div className="absolute right-0 top-0 h-full w-full bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -right-20 -bottom-20 h-64 w-64 rounded-full bg-black/20 blur-[60px]"></div>
            
            <div className="p-10 relative z-10 flex flex-col h-full justify-between">
              <div className="space-y-6">
                <div className="h-16 w-16 rounded-[1.5rem] bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/20 group-hover:rotate-12 transition-transform">
                  <Star className="h-8 w-8 text-white fill-current" />
                </div>
                <div>
                  <h3 className="font-display text-3xl font-black leading-[0.9] uppercase tracking-tighter mb-4">
                    Devenir<br/>Ambassadeur
                  </h3>
                  <p className="text-sm font-medium text-white/70 leading-relaxed max-w-[200px]">
                    Rejoignez l'élite des conservateurs et récoltez des bénéfices à chaque recommandation.
                  </p>
                </div>
              </div>
              
              <div className="pt-8">
                 <Button 
                   onClick={() => navigate("/profil?tab=profile")} 
                   className="w-full h-14 bg-white text-accent hover:bg-slate-50 rounded-[1.2rem] font-black uppercase text-xs tracking-widest shadow-xl group-hover:scale-[1.02] transition-all"
                 >
                   Obtenir mon code
                 </Button>
              </div>
            </div>
          </Card>

          {/* Quick Actions List */}
          <Card className="border-none shadow-soft rounded-[2.5rem] bg-white p-8">
            <h3 className="font-display font-black text-primary mb-8 px-2 flex items-center gap-3 uppercase tracking-widest text-sm">
              <ShieldCheck className="h-5 w-5 text-accent" /> Conciergerie Elite
            </h3>
            <div className="space-y-2">
              {[
                { icon: User, label: "Profil Personnel", link: "/profil" },
                { icon: Truck, label: "Suivi Logistique", link: "/suivi" },
                { icon: MapPin, label: "Boutiques Proches", link: "/boutiques" },
                { icon: MessageSquare, label: "Assistance VIP", link: "https://wa.me/..." },
              ].map((item, i) => (
                <Link key={i} to={item.link} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-accent group-hover:text-white transition-all shadow-sm">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-bold text-primary group-hover:translate-x-1 transition-transform">{item.label}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-accent opacity-0 group-hover:opacity-100 transform -translate-x-3 group-hover:translate-x-0 transition-all" />
                </Link>
              ))}
            </div>
          </Card>

          {/* Followed Shops Teaser */}
          <section className="px-4 py-6 bg-slate-50/50 rounded-[2.5rem] mt-4 shadow-inner">
            <h3 className="font-display font-black text-slate-400 mb-6 text-[10px] uppercase tracking-[0.2em] px-2 text-center">Partenaires Favoris</h3>
            {loadingFollowed ? <div className="space-y-3">{Array(3).fill(0).map((_, i) => <div key={i} className="h-16 bg-white animate-pulse rounded-2xl" />)}</div> :
             followedShops.length === 0 ? <p className="text-xs text-slate-400 italic text-center px-4">Cultivez votre cercle en suivant vos boutiques favorites.</p> :
             <div className="space-y-4">
               {followedShops.map(shop => (
                 <Link key={shop.id} to={`/boutique/${shop.id}`} className="flex items-center gap-4 group p-2 rounded-2xl hover:bg-white transition-all">
                   <div className="h-14 w-14 rounded-2xl overflow-hidden border-4 border-white shadow-premium group-hover:scale-110 transition-transform">
                     <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
                   </div>
                   <div>
                     <p className="text-sm font-black text-primary group-hover:text-accent transition-colors">{shop.name}</p>
                     <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest leading-none mt-1">{shop.neighborhood}</p>
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
