import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Package, MapPin, Phone, CheckCircle, Truck, ShoppingBag, Star, Heart, AlertTriangle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCFA, neighborhoods } from "@/lib/mock-data";
import ShopCard from "@/components/ShopCard";
import ProductCard from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import { Shop, Product } from "@/lib/types";

const statusLabels: Record<string, string> = {
  pending: "En attente", paid: "Payé", preparing: "En préparation",
  shipped: "Expédié", delivered: "Livré", completed: "Terminé",
};

const statusColors:Record<string, string> = {
  pending: "bg-slate-100 text-slate-600", 
  paid: "bg-blue-50 text-blue-600",
  preparing: "bg-indigo-50 text-indigo-600", 
  shipped: "bg-blue-100 text-blue-700",
  delivered: "bg-emerald-50 text-emerald-600", 
  completed: "bg-emerald-50 text-emerald-600",
};

export default function Profil() {
  const { user, profile, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [followedShops, setFollowedShops] = useState<Shop[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(true);
  const [wishlistProducts, setWishlistProducts] = useState<Product[]>([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  // Profile edit
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [saving, setSaving] = useState(false);

  // Review dialog
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewProductId, setReviewProductId] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Dispute dialog
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (user) { fetchOrders(); fetchFollowedShops(); fetchWishlist(); }
  }, [user, authLoading]);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setPhone(profile.phone || "");
      setNeighborhood(profile.neighborhood || "");
      setFacebookUrl(profile.facebook_url || "");
      setInstagramUrl(profile.instagram_url || "");
      setTiktokUrl(profile.tiktok_url || "");
    }
  }, [profile]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingOrders(true);
    const { data } = await supabase.from("orders").select("*").eq("buyer_id", user.id).order("created_at", { ascending: false });
    setOrders(data || []);
    setLoadingOrders(false);
  };

  const fetchFollowedShops = async () => {
    if (!user) return;
    setLoadingFollowed(true);
    const { data: follows } = await supabase.from("follows").select("seller_id").eq("follower_id", user.id);
    if (follows && follows.length > 0) {
      const sellerIds = follows.map(f => f.seller_id);
      const { data: profiles } = await supabase.from("profiles")
        .select("user_id, shop_name, shop_description, avatar_url, neighborhood, whatsapp_number")
        .in("user_id", sellerIds).not("shop_name", "is", null);
      setFollowedShops((profiles || []).map(p => ({
        id: p.user_id, name: p.shop_name!, description: p.shop_description || "",
        image: p.avatar_url || "/placeholder.svg", neighborhood: p.neighborhood || "",
        whatsappNumber: p.whatsapp_number || "", productCount: 0, rating: 0,
      })));
    } else { setFollowedShops([]); }
    setLoadingFollowed(false);
  };

  const fetchWishlist = async () => {
    if (!user) return;
    setLoadingWishlist(true);
    const { data: wishItems } = await supabase.from("wishlist").select("product_id").eq("user_id", user.id);
    if (wishItems && wishItems.length > 0) {
      const productIds = wishItems.map(w => w.product_id);
      const { data: products } = await supabase.from("products").select("*").in("id", productIds).eq("is_active", true);
      if (products) {
        const sellerIds = [...new Set(products.map(p => p.seller_id))];
        const { data: profiles } = await supabase.from("profiles")
          .select("user_id, display_name, shop_name").in("user_id", sellerIds);
        const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
        setWishlistProducts(products.map((p: any) => {
          const prof = profileMap.get(p.seller_id);
          return {
            id: p.id, name: p.name, description: p.description || "", price: p.price,
            images: p.images?.length > 0 ? p.images : ["/placeholder.svg"],
            category: p.category, condition: p.condition as "neuf" | "occasion",
            stock: p.stock, sellerId: p.seller_id,
            sellerName: prof?.shop_name || prof?.display_name || "Vendeur",
            sellerType: prof?.shop_name ? "boutique" as const : "particulier" as const,
            neighborhood: p.neighborhood, rating: 0, reviewCount: 0,
            pickupAvailable: p.pickup_available, deliveryAvailable: p.delivery_available,
            pickupAddress: p.pickup_address,
          };
        }));
      }
    } else { setWishlistProducts([]); }
    setLoadingWishlist(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ 
      display_name: displayName, 
      phone, 
      neighborhood,
      facebook_url: facebookUrl,
      instagram_url: instagramUrl,
      tiktok_url: tiktokUrl
    }).eq("user_id", user.id);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Profil mis à jour ✅" }); setEditMode(false); }
    setSaving(false);
  };

  const confirmReception = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "delivered" }).eq("id", orderId);
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); return; }
    await supabase.from("transactions").update({ status: "completed" }).eq("order_id", orderId);
    toast({ title: "Réception confirmée ✅", description: "Les fonds ont été débloqués pour le vendeur." });
    fetchOrders();
  };

  const openReviewDialog = (_orderId: string, items: any[]) => {
    const firstItem = items?.[0];
    setReviewProductId(firstItem?.productId || firstItem?.product_id || "");
    setReviewRating(5); setReviewComment("");
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!user || !reviewProductId) return;
    setReviewSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: reviewProductId, buyer_id: user.id,
      buyer_name: profile?.display_name || "Acheteur",
      rating: reviewRating, comment: reviewComment || null,
    });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Avis publié ✅" }); setReviewDialogOpen(false); }
    setReviewSubmitting(false);
  };

  const openDisputeDialog = (orderId: string) => {
    setDisputeOrderId(orderId);
    setDisputeReason("");
    setDisputeDialogOpen(true);
  };

  const submitDispute = async () => {
    if (!user || !disputeOrderId || !disputeReason.trim()) return;
    setDisputeSubmitting(true);
    const { error } = await supabase.from("disputes").insert({
      order_id: disputeOrderId, buyer_id: user.id, reason: disputeReason,
    });
    if (error) { toast({ title: "Erreur", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Signalement envoyé ✅", description: "L'équipe va examiner votre problème." }); setDisputeDialogOpen(false); }
    setDisputeSubmitting(false);
  };

  if (authLoading || loadingOrders) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] py-8">
      <div className="container max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations et suivez vos commandes</p>
        </motion.div>

        <Tabs defaultValue="orders" className="mt-8">
          <TabsList className="flex-wrap">
            <TabsTrigger value="orders">Commandes</TabsTrigger>
            <TabsTrigger value="wishlist"><Heart className="mr-1.5 h-3.5 w-3.5" /> Favoris</TabsTrigger>
            <TabsTrigger value="followed"><Heart className="mr-1.5 h-3.5 w-3.5" /> Boutiques</TabsTrigger>
            <TabsTrigger value="profile">Infos</TabsTrigger>
          </TabsList>

          {/* Orders */}
          <TabsContent value="orders" className="mt-4 space-y-4">
            <div className="grid gap-4">
              {orders.length === 0 ? (
                <Card className="border-dashed py-16 bg-white/30 backdrop-blur-sm rounded-3xl">
                  <CardContent className="text-center">
                    <div className="mx-auto h-20 w-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                      <ShoppingBag className="h-10 w-10 text-muted-foreground/30" />
                    </div>
                    <p className="font-bold text-lg text-primary">Le panier est vide</p>
                    <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto">Explorez nos milliers de produits et faites-vous plaisir !</p>
                    <Link to="/tous-les-produits" className="inline-block mt-6">
                      <Button className="bg-primary text-white hover:bg-primary/90 h-12 px-8 rounded-2xl font-bold shadow-lg shadow-primary/20">
                        Parcourir nos produits
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : orders.map((order) => (
                <Card key={order.id} className="overflow-hidden border-none shadow-premium rounded-3xl bg-white/50 backdrop-blur-sm p-5 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest leading-none">COMMANDE #{order.order_number}</p>
                      <p className="text-xs font-bold text-primary">{new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <Badge className={cn("text-[10px] rounded-full px-2.5 py-0.5 border-none shadow-sm", statusColors[order.status])}>
                      {statusLabels[order.status] || order.status}
                    </Badge>
                  </div>

                  <div className="bg-slate-100/50 rounded-2xl p-4 space-y-3">
                    {(order.items as any[])?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground/80"><span className="font-bold text-primary">{item.quantity}x</span> {item.name || item.product_name}</span>
                        <span className="font-bold text-primary">{formatCFA(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-muted/50 flex justify-between items-center">
                      <span className="text-xs font-black uppercase tracking-widest text-[#142642]">Total Payé</span>
                      <span className="text-lg font-black text-accent tracking-tighter">{formatCFA(order.total)}</span>
                    </div>
                  </div>

                  {/* Delivery proof */}
                  {order.shipping_proof_note && (
                    <div className="rounded-2xl border border-accent/10 bg-accent/5 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-accent">
                        <Truck className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Note d'expédition</span>
                      </div>
                      <p className="text-xs text-muted-foreground italic leading-relaxed">"{order.shipping_proof_note}"</p>
                      {order.shipping_proof_image && (
                        <div className="h-32 w-full rounded-xl overflow-hidden shadow-inner">
                          <img src={order.shipping_proof_image} alt="Preuve" className="h-full w-full object-cover" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Visual Status Path */}
                  <div className="flex items-center justify-between px-1">
                    {[
                      { key: "paid", icon: CheckCircle, label: "Payé" },
                      { key: "preparing", icon: Package, label: "Prêt" },
                      { key: "shipped", icon: Truck, label: "Expédié" },
                      { key: "delivered", icon: CheckCircle, label: "Reçu" }
                    ].map((step, idx, arr) => {
                      const isActive = ["paid","preparing","shipped","delivered","completed"].indexOf(order.status) >= ["paid","preparing","shipped","delivered"].indexOf(step.key);
                      return (
                        <div key={step.key} className="flex flex-col items-center gap-1.5 flex-1 relative">
                          <div className={cn("h-8 w-8 rounded-full flex items-center justify-center z-10 transition-colors", 
                            isActive ? "bg-success text-white shadow-lg shadow-success/20" : "bg-muted text-muted-foreground/40")}>
                            <step.icon className="h-4 w-4" />
                          </div>
                          <span className={cn("text-[9px] font-black uppercase tracking-tighter", isActive ? "text-success" : "text-muted-foreground/40")}>
                            {step.label}
                          </span>
                          {idx < arr.length - 1 && (
                            <div className={cn("absolute top-4 left-[50%] w-full h-[2px] -z-0", 
                              isActive ? "bg-success/30" : "bg-muted/30")}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {order.status === "shipped" && (
                      <Button onClick={() => confirmReception(order.id)} className="flex-1 bg-success hover:bg-success/90 text-white h-11 rounded-2xl font-bold shadow-lg shadow-success/20">
                        <CheckCircle className="mr-2 h-4 w-4" /> Confirmer la réception
                      </Button>
                    )}
                    {order.status === "delivered" && (
                      <Button variant="outline" onClick={() => openReviewDialog(order.id, order.items as any[])} className="flex-1 border-primary/20 hover:bg-primary/5 h-11 rounded-2xl font-bold text-primary">
                        <Star className="mr-2 h-4 w-4" /> Laisser un avis
                      </Button>
                    )}
                    {!["completed", "pending"].includes(order.status) && (
                      <Button variant="ghost" size="sm" onClick={() => openDisputeDialog(order.id)} className="h-11 rounded-2xl text-[10px] text-muted-foreground font-bold hover:text-destructive hover:bg-destructive/5 uppercase tracking-widest px-4">
                        <AlertTriangle className="mr-2 h-3.5 w-3.5" /> Signaler
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist" className="mt-4">
            {loadingWishlist ? <p className="text-muted-foreground">Chargement...</p> :
              wishlistProducts.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <Heart className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-muted-foreground">Aucun produit en favoris.</p>
                  <Link to="/tous-les-produits"><Button className="mt-4 bg-primary text-white hover:bg-primary/90">Parcourir nos produits</Button></Link>
                </CardContent></Card>
              ) : (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {wishlistProducts.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
          </TabsContent>

          {/* Followed Shops */}
          <TabsContent value="followed" className="mt-4 space-y-3">
            {loadingFollowed ? <p className="text-muted-foreground">Chargement...</p> :
              followedShops.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <Heart className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-muted-foreground">Vous ne suivez aucune boutique.</p>
                  <Link to="/boutiques"><Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">Découvrir les boutiques</Button></Link>
                </CardContent></Card>
              ) : followedShops.map(shop => <ShopCard key={shop.id} shop={shop} />)
            }
          </TabsContent>

          {/* Profile */}
          <TabsContent value="profile" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display">Mes informations</CardTitle>
                  {!editMode && <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>Modifier</Button>}
                </div>
              </CardHeader>
              <CardContent>
                {editMode ? (
                    <div className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2"><Label>Nom complet</Label><Input value={displayName} onChange={e => setDisplayName(e.target.value)} /></div>
                        <div className="space-y-2"><Label>Téléphone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+228..." /></div>
                      </div>
                      <div className="space-y-2">
                        <Label>Quartier</Label>
                        <Select value={neighborhood} onValueChange={setNeighborhood}>
                          <SelectTrigger><SelectValue placeholder="Choisir un quartier" /></SelectTrigger>
                          <SelectContent>{neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-3 pt-2 border-t">
                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Réseaux Sociaux</p>
                        <div className="space-y-2">
                          <Label className="text-xs">Lien Facebook</Label>
                          <Input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/votre-page" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Lien Instagram</Label>
                          <Input value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/votre-page" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Lien TikTok</Label>
                          <Input value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@votre-page" />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button onClick={handleSaveProfile} disabled={saving} className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1">{saving ? "Enregistrement..." : "Enregistrer les modifications"}</Button>
                        <Button variant="outline" onClick={() => setEditMode(false)}>Annuler</Button>
                      </div>
                    </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground"><User className="h-5 w-5" /></div>
                      <div><p className="font-medium">{profile?.display_name || "—"}</p><p className="text-sm text-muted-foreground">{user?.email}</p></div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                       <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /><span>{profile?.phone || "Non renseigné"}</span></div>
                       <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{profile?.neighborhood || "Non renseigné"}</span></div>
                    </div>

                    {isAdmin && (
                      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-accent">Accès Administrateur</p>
                          <p className="text-[10px] text-muted-foreground">Gérez les boutiques, produits et litiges.</p>
                        </div>
                        <Link to="/admin-portal">
                          <Button size="sm" className="bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-bold px-4">
                             Accéder au Portail
                          </Button>
                        </Link>
                      </div>
                    )}
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm font-medium">Statistiques</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-center">
                        <div><p className="font-display text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">Commandes</p></div>
                        <div><p className="font-display text-2xl font-bold">{formatCFA(orders.reduce((s, o) => s + o.total, 0))}</p><p className="text-xs text-muted-foreground">Total dépensé</p></div>
                      </div>
                    </div>

                    {/* Programme Ambassadeur */}
                    <div className="rounded-3xl border-none bg-gradient-to-br from-primary/10 to-slate-50 p-6 relative overflow-hidden group shadow-premium">
                      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-accent/20 blur-3xl group-hover:bg-accent/30 transition-all duration-700"></div>
                      <div className="relative z-10">
                        <h3 className="font-display text-xl font-black text-accent flex items-center gap-2">
                          <Star className="h-5 w-5 fill-accent" /> Programme Ambassadeur
                        </h3>
                        <p className="mt-2 text-xs font-medium text-primary/70 leading-relaxed max-w-[280px]">
                          Partagez votre code et débloquez <span className="font-bold text-accent">30 jours de mode PRO</span> gratuitement à chaque parrainage réussi !
                        </p>
                        <div className="mt-5 flex items-center gap-3">
                          <div className="flex-1 rounded-2xl bg-white/60 backdrop-blur-sm px-4 py-3 font-mono font-black text-lg text-accent tracking-[0.2em] shadow-inner text-center">
                            {profile?.referral_code || "GENERATION..."}
                          </div>
                          <Button 
                            className="bg-accent hover:bg-accent/90 h-14 w-14 rounded-2xl shadow-lg shadow-accent/20 transition-transform active:scale-95" 
                            onClick={() => {
                              navigator.clipboard.writeText(profile?.referral_code || "");
                              toast({ title: "Code copié ! 📋", description: "Partagez-le avec vos amis pour gagner vos récompenses." });
                            }}
                          >
                            <User className="h-6 w-6 text-white" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Socials View */}
                    {(profile?.facebook_url || profile?.instagram_url || profile?.tiktok_url) && (
                      <div className="space-y-2 pt-2 border-t">
                        <p className="text-xs font-bold uppercase text-muted-foreground tracking-widest">Réseaux Sociaux</p>
                        <div className="flex gap-4">
                          {profile?.facebook_url && (
                             <a href={profile.facebook_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:scale-110 transition-transform">Facebook</a>
                          )}
                          {profile?.instagram_url && (
                             <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="text-pink-600 hover:scale-110 transition-transform">Instagram</a>
                          )}
                          {profile?.tiktok_url && (
                             <a href={profile.tiktok_url} target="_blank" rel="noreferrer" className="text-foreground hover:scale-110 transition-transform">TikTok</a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Laisser un avis</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Note</Label>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(star => (
                  <button key={star} type="button" onClick={() => setReviewRating(star)}
                    className={`text-2xl transition-colors ${star <= reviewRating ? "text-warning" : "text-muted-foreground/30"}`}>★</button>
                ))}
              </div>
            </div>
            <div className="space-y-2"><Label>Commentaire</Label><Textarea placeholder="Partagez votre expérience..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} /></div>
            <Button onClick={submitReview} disabled={reviewSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">{reviewSubmitting ? "Envoi..." : "Publier l'avis"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={disputeDialogOpen} onOpenChange={setDisputeDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Signaler un problème</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Décrivez le problème rencontré avec cette commande. Notre équipe examinera votre signalement.</p>
            <div className="space-y-2">
              <Label>Raison du signalement *</Label>
              <Textarea placeholder="Ex: Produit non conforme, article endommagé, non reçu..." value={disputeReason} onChange={e => setDisputeReason(e.target.value)} />
            </div>
            <Button onClick={submitDispute} disabled={disputeSubmitting || !disputeReason.trim()} className="w-full" variant="destructive">
              <AlertTriangle className="mr-2 h-4 w-4" /> {disputeSubmitting ? "Envoi..." : "Envoyer le signalement"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
