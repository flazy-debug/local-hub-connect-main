import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Package, MapPin, Phone, CheckCircle, Truck, ShoppingBag, Star, Heart, AlertTriangle } from "lucide-react";
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
import { Shop, Product } from "@/lib/types";

const statusLabels: Record<string, string> = {
  pending: "En attente", paid: "Payé", preparing: "En préparation",
  shipped: "Expédié", delivered: "Livré", completed: "Terminé",
};
const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground", paid: "bg-info/10 text-info",
  preparing: "bg-warning/10 text-warning", shipped: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success", completed: "bg-success/10 text-success",
};

export default function Profil() {
  const { user, profile, loading: authLoading } = useAuth();
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
    <div className="min-h-screen bg-secondary/30 py-8">
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
            {orders.length === 0 ? (
              <Card><CardContent className="py-12 text-center">
                <ShoppingBag className="mx-auto h-12 w-12 text-muted-foreground/30" />
                <p className="mt-3 text-muted-foreground">Aucune commande pour le moment.</p>
                <Link to="/catalogue"><Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">Découvrir le catalogue</Button></Link>
              </CardContent></Card>
            ) : orders.map((order) => (
              <Card key={order.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="font-mono text-sm">{order.order_number}</CardTitle>
                      <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                    </div>
                    <Badge className={statusColors[order.status] || ""}>{statusLabels[order.status] || order.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {(order.items as any[])?.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{item.name || item.product_name} × {item.quantity}</span>
                        <span className="font-medium">{formatCFA(item.price * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between border-t pt-2 font-semibold">
                      <span>Total</span><span>{formatCFA(order.total)}</span>
                    </div>
                  </div>

                  {/* Delivery proof */}
                  {order.shipping_proof_note && (
                    <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                      <p className="font-medium text-foreground">📦 Preuve d'expédition :</p>
                      <p className="mt-1 text-muted-foreground">{order.shipping_proof_note}</p>
                      {order.shipping_proof_image && (
                        <img src={order.shipping_proof_image} alt="Preuve" className="mt-2 h-32 rounded-lg object-cover" />
                      )}
                    </div>
                  )}

                  {/* Timeline */}
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="flex items-center gap-6 text-sm">
                      <div className={`flex items-center gap-1.5 ${["paid","preparing","shipped","delivered","completed"].includes(order.status) ? "text-success" : "text-muted-foreground"}`}>
                        <CheckCircle className="h-4 w-4" /> Payé
                      </div>
                      <div className={`flex items-center gap-1.5 ${["preparing","shipped","delivered","completed"].includes(order.status) ? "text-success" : "text-muted-foreground"}`}>
                        <Package className="h-4 w-4" /> Préparé
                      </div>
                      <div className={`flex items-center gap-1.5 ${["shipped","delivered","completed"].includes(order.status) ? "text-success" : "text-muted-foreground"}`}>
                        <Truck className="h-4 w-4" /> Expédié
                      </div>
                      <div className={`flex items-center gap-1.5 ${["delivered","completed"].includes(order.status) ? "text-success" : "text-muted-foreground"}`}>
                        <CheckCircle className="h-4 w-4" /> Reçu
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {order.status === "shipped" && (
                      <Button onClick={() => confirmReception(order.id)} className="bg-success text-success-foreground hover:bg-success/90">
                        <CheckCircle className="mr-2 h-4 w-4" /> Confirmer la réception
                      </Button>
                    )}
                    {order.status === "delivered" && (
                      <Button variant="outline" onClick={() => openReviewDialog(order.id, order.items as any[])}>
                        <Star className="mr-2 h-4 w-4" /> Laisser un avis
                      </Button>
                    )}
                    {!["completed", "pending"].includes(order.status) && (
                      <Button variant="ghost" size="sm" onClick={() => openDisputeDialog(order.id)} className="text-muted-foreground hover:text-destructive">
                        <AlertTriangle className="mr-1.5 h-3.5 w-3.5" /> Signaler un problème
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Wishlist */}
          <TabsContent value="wishlist" className="mt-4">
            {loadingWishlist ? <p className="text-muted-foreground">Chargement...</p> :
              wishlistProducts.length === 0 ? (
                <Card><CardContent className="py-12 text-center">
                  <Heart className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-3 text-muted-foreground">Aucun produit en favoris.</p>
                  <Link to="/catalogue"><Button className="mt-4 bg-accent text-accent-foreground hover:bg-accent/90">Parcourir le catalogue</Button></Link>
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
                    <div className="rounded-lg border bg-muted/30 p-4">
                      <p className="text-sm font-medium">Statistiques</p>
                      <div className="mt-2 grid grid-cols-2 gap-4 text-center">
                        <div><p className="font-display text-2xl font-bold">{orders.length}</p><p className="text-xs text-muted-foreground">Commandes</p></div>
                        <div><p className="font-display text-2xl font-bold">{formatCFA(orders.reduce((s, o) => s + o.total, 0))}</p><p className="text-xs text-muted-foreground">Total dépensé</p></div>
                      </div>
                    </div>

                    {/* Programme Ambassadeur */}
                    <div className="rounded-xl border-2 border-accent/20 bg-accent/5 p-5 relative overflow-hidden group">
                      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-accent/10 blur-2xl group-hover:bg-accent/20 transition-all"></div>
                      <h3 className="font-display text-lg font-bold flex items-center gap-2">
                        🌟 Programme Ambassadeur
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Partagez votre code et débloquez 30 jours de mode PRO gratuitement à chaque parrainage réussi !
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        <div className="flex-1 rounded-lg border bg-background px-3 py-2 font-mono font-bold text-accent">
                          {profile?.referral_code || "GENERATION..."}
                        </div>
                        <Button size="sm" className="bg-accent" onClick={() => {
                          navigator.clipboard.writeText(profile?.referral_code || "");
                          toast({ title: "Code copié !", description: "Partagez-le avec vos amis." });
                        }}>
                          Copier
                        </Button>
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
