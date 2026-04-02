import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Package, ShoppingCart, TrendingUp, Plus, Trash2, Pencil, Megaphone, Bell, Wallet, Tag, Camera, ShieldCheck, Store, Copy, Facebook, Instagram, Link as LinkIcon } from "lucide-react";
import ImageUpload from "@/components/ImageUpload";
import VideoUpload from "@/components/VideoUpload";
import DemoDataGenerator from "@/components/dashboard/DemoDataGenerator";
import EditProductDialog from "@/components/dashboard/EditProductDialog";
import LandingPageGenerator from "@/components/dashboard/LandingPageGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { categories, neighborhoods, formatCFA } from "@/lib/mock-data";

const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground", paid: "bg-info/10 text-info",
  preparing: "bg-warning/10 text-warning", shipped: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success", completed: "bg-success/10 text-success",
};
const statusLabels: Record<string, string> = {
  pending: "En attente", paid: "Payé", preparing: "En préparation",
  shipped: "Expédié", delivered: "Livré", completed: "Terminé",
};

export default function Dashboard() {
  const { user, isSeller, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [sellerPlan, setSellerPlan] = useState("commission");
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [partnerMarkup, setPartnerMarkup] = useState(0);
  const [loadingData, setLoadingData] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Product form
  const [pName, setPName] = useState("");
  const [pDesc, setPDesc] = useState("");
  const [pPrice, setPPrice] = useState("");
  const [pPromoPrice, setPPromoPrice] = useState("");
  const [pCategory, setPCategory] = useState("");
  const [pCondition, setPCondition] = useState("neuf");
  const [pStock, setPStock] = useState("1");
  const [pNeighborhood, setPNeighborhood] = useState("");
  const [pPickup, setPPickup] = useState(true);
  const [pDelivery, setPDelivery] = useState(false);
  const [pPickupAddr, setPPickupAddr] = useState("");
  const [pImages, setPImages] = useState<string[]>([]);
  const [pVideoUrl, setPVideoUrl] = useState<string | null>(null);
  const [pSupplierPrice, setPSupplierPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);
  
  // Boost dialog
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [selectedBoostProduct, setSelectedBoostProduct] = useState<any>(null);
  const [boosting, setBoosting] = useState(false);

  // Shipping proof dialog
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofOrderId, setProofOrderId] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [proofSubmitting, setProofSubmitting] = useState(false);

  // Promo code dialog
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("10");
  const [newPromoMaxUses, setNewPromoMaxUses] = useState("");

  // Shop Details
  const [shopSlug, setShopSlug] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [savingShopInfo, setSavingShopInfo] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && user && !isSeller) { navigate("/devenir-vendeur"); return; }
    if (user && isSeller) {
      fetchData();
      const channel = supabase.channel('seller-orders')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders', filter: `seller_id=eq.${user.id}` },
          (payload) => {
            const newOrder = payload.new as any;
            setOrders((prev) => [newOrder, ...prev]);
            toast({ title: "🔔 Nouvelle commande !", description: `${newOrder.order_number} — ${formatCFA(newOrder.total)}` });
          })
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `seller_id=eq.${user.id}` },
          (payload) => { setOrders((prev) => prev.map((o) => o.id === (payload.new as any).id ? payload.new : o)); })
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user, isSeller, authLoading]);

  useEffect(() => {
    if (user) {
      (supabase.from("profiles") as any).select("subscription_type, shop_slug, facebook_url, instagram_url, tiktok_url, partner_markup_percent").eq("user_id", user.id).single()
        .then(({ data }) => { 
          if (data) {
            setSellerPlan((data as any).subscription_type || "commission");
            setPartnerMarkup((data as any).partner_markup_percent || 0);
            setShopSlug(data.shop_slug || "");
            setFacebookUrl(data.facebook_url || "");
            setInstagramUrl(data.instagram_url || "");
            setTiktokUrl(data.tiktok_url || "");
          }
        });
    }
  }, [user]);

  const saveShopInfo = async () => {
    if (!user) return;
    setSavingShopInfo(true);
    let formattedSlug = shopSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/(^-|-$)/g, '');
    
    const { error } = await supabase.from("profiles").update({
      shop_slug: formattedSlug || null,
      facebook_url: facebookUrl || null,
      instagram_url: instagramUrl || null,
      tiktok_url: tiktokUrl || null
    }).eq("user_id", user.id);
    
    if (error) {
       toast({ title: "Erreur", description: error.message, variant: "destructive" });
    } else {
       setShopSlug(formattedSlug);
       toast({ title: "Boutique mise à jour", description: "Vos liens ont été sauvegardés." });
    }
    setSavingShopInfo(false);
  };

  const fetchData = async () => {
    if (!user) return;
    setLoadingData(true);
    const [prodRes, ordRes, txRes, promoRes] = await Promise.all([
      supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      supabase.from("promo_codes").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
    ]);
    setProducts(prodRes.data || []);
    setOrders(ordRes.data || []);
    setTransactions(txRes.data || []);
    setPromoCodes(promoRes.data || []);
    setLoadingData(false);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("products").insert({
        seller_id: user.id, name: pName, description: pDesc,
        price: parseInt(pPrice),
        promo_price: pPromoPrice ? parseInt(pPromoPrice) : null,
        category: pCategory, condition: pCondition, stock: parseInt(pStock),
        neighborhood: pNeighborhood, pickup_available: pPickup,
        delivery_available: pDelivery, pickup_address: pPickupAddr || null,
        images: pImages.length > 0 ? pImages : ["/placeholder.svg"],
        video_url: pVideoUrl || null,
        supplier_price: sellerPlan === "PARTNER" ? parseInt(pSupplierPrice) : null,
        is_approved: sellerPlan !== "PARTNER",
      });
      if (error) throw error;
      toast({ title: "Produit ajouté ✅" });
      setAddDialogOpen(false); resetForm(); fetchData();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setPName(""); setPDesc(""); setPPrice(""); setPPromoPrice(""); setPCategory("");
    setPCondition("neuf"); setPStock("1"); setPNeighborhood("");
    setPPickup(true); setPDelivery(false); setPPickupAddr(""); setPImages([]); setPVideoUrl(null); setPSupplierPrice("");
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Statut mis à jour" }); fetchData(); }
  };

  const openShippingProof = (orderId: string) => {
    setProofOrderId(orderId); setProofNote(""); setProofImages([]);
    setProofDialogOpen(true);
  };

  const submitShippingProof = async () => {
    if (!proofOrderId) return;
    setProofSubmitting(true);
    const { error } = await supabase.from("orders").update({
      status: "shipped",
      shipping_proof_note: proofNote || null,
      shipping_proof_image: proofImages[0] || null,
    }).eq("id", proofOrderId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Commande expédiée ✅" }); setProofDialogOpen(false); fetchData(); }
    setProofSubmitting(false);
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Produit supprimé" }); fetchData(); }
  };
  
  const handleBoostProduct = async () => {
    if (!selectedBoostProduct) return;
    setBoosting(true);
    
    // Simulate 3 days boost
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 3);
    
    const { error } = await supabase.from("products").update({
      is_boosted: true,
      boost_expiry: expiryDate.toISOString()
    } as any).eq("id", selectedBoostProduct.id);
    
    if (error) {
      toast({ title: "Erreur lors du boost", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produit Boosté ! 🔥", description: "Votre article sera mis en avant pendant 3 jours." });
      setBoostDialogOpen(false);
      fetchData();
    }
    setBoosting(false);
  };

  const createPromoCode = async () => {
    if (!user || !newPromoCode.trim()) return;
    const { error } = await supabase.from("promo_codes").insert({
      seller_id: user.id, code: newPromoCode.toUpperCase(),
      discount_percent: parseInt(newPromoDiscount),
      max_uses: newPromoMaxUses ? parseInt(newPromoMaxUses) : null,
    });
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Code promo créé ✅" }); setPromoDialogOpen(false); setNewPromoCode(""); fetchData(); }
  };

  const deletePromoCode = async (id: string) => {
    await supabase.from("promo_codes").delete().eq("id", id);
    fetchData();
  };

  // Wallet stats
  const totalSales = transactions.reduce((s, t) => s + t.amount_total, 0);
  const totalGatewayFee = transactions.reduce((s, t) => s + (t.gateway_fee || 0), 0);
  const totalPlatformFee = transactions.reduce((s, t) => s + (t.platform_commission || 0), 0);
  
  const completedPayout = transactions.filter(t => t.status === "completed").reduce((s, t) => s + t.seller_payout, 0);
  const escrowBalance = transactions.filter(t => t.status === "escrow").reduce((s, t) => s + t.seller_payout, 0);
  const availableBalance = completedPayout;
  const totalOrders = orders.length;
  const totalProducts = products.length;

  if (authLoading || loadingData) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }


  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="container">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold">Dashboard Vendeur</h1>
            <p className="text-muted-foreground">Gérez vos produits et commandes</p>
          </div>
        </div>

        {/* Plan banner */}
        <div className={`mb-6 rounded-xl border p-5 ${sellerPlan === "PRO" ? "border-accent/40 bg-accent/5 shadow-inner" : "bg-muted/30"}`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${sellerPlan === "PRO" ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"}`}>
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold">{sellerPlan === "PRO" ? "Compte PRO Activé" : "Compte STANDARD"}</h2>
                  <Badge variant={sellerPlan === "PRO" ? "default" : "outline"} className={sellerPlan === "PRO" ? "bg-accent" : ""}>
                    {sellerPlan}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {sellerPlan === "PRO" 
                    ? "🚀 Plan PRO : 0% commission plateforme (uniquement 4% frais réseau)." 
                    : sellerPlan === "PARTNER"
                    ? `🤝 Plan PARTNER : Vente directe avec markup de ${partnerMarkup}%.`
                    : "💎 Plan STANDARD : 10% commission plateforme + 4% frais réseau."}
                </p>
              </div>
            </div>
            {sellerPlan !== "PRO" && (
              <Link to="/pricing">
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                  ⚡ DEVENIR PRO (0% COMM.)
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DemoDataGenerator sellerId={user!.id} onDone={fetchData} />
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-2 h-4 w-4" /> Ajouter un produit</Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
                <DialogHeader><DialogTitle className="font-display">Nouveau produit</DialogTitle></DialogHeader>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div className="space-y-2"><Label>Nom du produit *</Label><Input placeholder="Ex: Robe Wax Ankara" value={pName} onChange={e => setPName(e.target.value)} required /></div>
                  <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Décrivez votre produit..." value={pDesc} onChange={e => setPDesc(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label>{sellerPlan === "PARTNER" ? "Prix d'achat fournisseur (CFA) *" : "Prix (CFA) *"}</Label>
                       <Input 
                         type="number" 
                         placeholder="15000" 
                         value={sellerPlan === "PARTNER" ? pSupplierPrice : pPrice} 
                         onChange={e => sellerPlan === "PARTNER" ? setPSupplierPrice(e.target.value) : setPPrice(e.target.value)} 
                         required 
                         min={1} 
                       />
                       {sellerPlan === "PARTNER" && partnerMarkup > 0 && (
                         <p className="text-[10px] text-success font-medium">
                           Prix de vente public estimé: {formatCFA(Math.round(parseInt(pSupplierPrice || "0") * (1 + partnerMarkup / 100)))}
                         </p>
                       )}
                    </div>
                    <div className="space-y-2">
                      <Label>Prix promo (CFA)</Label>
                      <Input type="number" placeholder="Optionnel" value={pPromoPrice} onChange={e => setPPromoPrice(e.target.value)} min={1} disabled={sellerPlan === "PARTNER"} />
                      <p className="text-[10px] text-muted-foreground">Sera affiché avec le prix barré</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Stock *</Label><Input type="number" placeholder="1" value={pStock} onChange={e => setPStock(e.target.value)} required min={0} /></div>
                    <div className="space-y-2">
                      <Label>Catégorie *</Label>
                      <Select value={pCategory} onValueChange={setPCategory} required>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>État *</Label>
                      <Select value={pCondition} onValueChange={setPCondition}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent><SelectItem value="neuf">Neuf</SelectItem><SelectItem value="occasion">Occasion</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Quartier *</Label>
                      <Select value={pNeighborhood} onValueChange={setPNeighborhood} required>
                        <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                        <SelectContent>{neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2"><Switch checked={pPickup} onCheckedChange={setPPickup} /><Label>Pick-up</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={pDelivery} onCheckedChange={setPDelivery} /><Label>Livraison</Label></div>
                  </div>
                  {pPickup && <div className="space-y-2"><Label>Adresse de retrait</Label><Input placeholder="Ex: Marché de Tokoin, Stand 42" value={pPickupAddr} onChange={e => setPPickupAddr(e.target.value)} /></div>}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2"><Label>Photos du produit</Label><ImageUpload images={pImages} onChange={setPImages} maxImages={5} /></div>
                    <div className="space-y-2"><Label>Vidéo démo</Label><VideoUpload videoUrl={pVideoUrl} onChange={setPVideoUrl} disabled={sellerPlan === "commission"} /></div>
                  </div>
                  <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={submitting}>
                    {submitting ? "Ajout en cours..." : sellerPlan === "PARTNER" ? "Soumettre pour approbation" : "Ajouter le produit"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Wallet Summary */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10"><TrendingUp className="h-6 w-6 text-success" /></div>
              <div><p className="text-xs text-muted-foreground">Total des ventes</p><p className="font-display text-xl font-bold">{formatCFA(totalSales)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col justify-center p-4">
              <p className="text-[11px] text-muted-foreground font-medium mb-1 uppercase tracking-wider">Déductions</p>
              <div className="space-y-1.5 w-full mt-1">
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Frais réseau (4%)</span>
                   <span className="font-semibold text-destructive">{formatCFA(totalGatewayFee)}</span>
                 </div>
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-muted-foreground">Service plateforme</span>
                   <span className="font-semibold text-destructive">{formatCFA(totalPlatformFee)}</span>
                 </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-success/30">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10"><Wallet className="h-6 w-6 text-success" /></div>
              <div><p className="text-xs text-muted-foreground">Solde disponible</p><p className="font-display text-xl font-bold text-success">{formatCFA(availableBalance)}</p></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10"><ShoppingCart className="h-6 w-6 text-warning" /></div>
              <div><p className="text-xs text-muted-foreground">En séquestre</p><p className="font-display text-xl font-bold text-warning">{formatCFA(escrowBalance)}</p></div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="products">
          <TabsList className="flex-wrap">
            <TabsTrigger value="products">Produits ({totalProducts})</TabsTrigger>
            <TabsTrigger value="orders">Commandes ({totalOrders})</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="shop"><Store className="mr-1 h-3.5 w-3.5" /> Ma Boutique</TabsTrigger>
            <TabsTrigger value="promos"><Tag className="mr-1 h-3.5 w-3.5" /> Codes Promo</TabsTrigger>
            <TabsTrigger value="ads" className="text-accent font-bold"><Megaphone className="mr-1 h-3.5 w-3.5" /> ADS MANAGER</TabsTrigger>
            <TabsTrigger value="landing"><LinkIcon className="mr-1 h-3.5 w-3.5" /> Marketing</TabsTrigger>
          </TabsList>

          {/* Shop Settings */}
          <TabsContent value="shop" className="mt-4">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lien de Partage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Personnalisez le lien de votre boutique et partagez-le avec vos clients.</p>
                  <div className="space-y-2">
                    <Label>Identifiant (Slug)</Label>
                    <div className="flex gap-2">
                      <div className="flex items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground whitespace-nowrap overflow-hidden">
                        /s/
                      </div>
                      <Input placeholder="mon-super-shop" value={shopSlug} onChange={e => setShopSlug(e.target.value)} />
                    </div>
                  </div>
                  <div className="pt-2 flex items-center gap-2">
                    <Button 
                      className="bg-accent text-accent-foreground hover:bg-accent/90 flex-1" 
                      onClick={saveShopInfo} 
                      disabled={savingShopInfo}
                    >
                      {savingShopInfo ? "Enregistrement..." : "Enregistrer le slug"}
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => {
                        if (!shopSlug) return toast({ title: "Créez un slug d'abord !" });
                        const link = window.location.origin + "/s/" + shopSlug;
                        navigator.clipboard.writeText(link);
                        toast({ title: "Lien copié !", description: link });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" /> Copier
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Réseaux Sociaux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Ajoutez vos liens pour qu'ils s'affichent sur votre page publique.</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                        <Facebook className="h-4 w-4" />
                      </div>
                      <Input placeholder="https://facebook.com/..." value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-pink-500/10 text-pink-500 rounded-lg shrink-0">
                        <Instagram className="h-4 w-4" />
                      </div>
                      <Input placeholder="https://instagram.com/..." value={instagramUrl} onChange={e => setInstagramUrl(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 flex items-center justify-center bg-black/10 text-foreground dark:bg-white/10 rounded-lg shrink-0">
                        <LinkIcon className="h-4 w-4" />
                      </div>
                      <Input placeholder="Lien TikTok (https://tiktok.com/@...)" value={tiktokUrl} onChange={e => setTiktokUrl(e.target.value)} />
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-accent text-accent-foreground hover:bg-accent/90" 
                    onClick={saveShopInfo} 
                    disabled={savingShopInfo}
                  >
                    {savingShopInfo ? "Enregistrement..." : "Enregistrer les liens"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Products */}
          <TabsContent value="products" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {products.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground"><Package className="mx-auto h-12 w-12 opacity-30" /><p className="mt-3">Aucun produit. Ajoutez votre premier produit !</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Produit</TableHead><TableHead>Prix</TableHead><TableHead>Promo</TableHead><TableHead>Stock</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {products.map(p => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell>{formatCFA(p.price)}</TableCell>
                          <TableCell>{p.promo_price ? <span className="text-success font-medium">{formatCFA(p.promo_price)}</span> : "—"}</TableCell>
                          <TableCell>{p.stock}</TableCell>
                          <TableCell className="flex gap-1">
                            {!p.is_boosted && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-accent hover:text-accent hover:bg-accent/10"
                                onClick={() => { setSelectedBoostProduct(p); setBoostDialogOpen(true); }}
                              >
                                <Megaphone className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setEditProduct(p)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground"><ShoppingCart className="mx-auto h-12 w-12 opacity-30" /><p className="mt-3">Aucune commande.</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>N° Commande</TableHead><TableHead>Client</TableHead><TableHead>Total</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {orders.map(o => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                          <TableCell>{o.buyer_name}</TableCell>
                          <TableCell>{formatCFA(o.total)}</TableCell>
                          <TableCell><Badge className={statusColors[o.status] || ""}>{statusLabels[o.status] || o.status}</Badge></TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {o.status === "paid" && (
                                <Button size="sm" variant="outline" onClick={() => updateOrderStatus(o.id, "preparing")}>Préparer</Button>
                              )}
                              {o.status === "preparing" && (
                                <Button size="sm" variant="outline" onClick={() => openShippingProof(o.id)} className="gap-1">
                                  <Camera className="h-3.5 w-3.5" /> Expédier
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions" className="mt-4">
            <Card>
              <CardContent className="p-0">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground"><TrendingUp className="mx-auto h-12 w-12 opacity-30" /><p className="mt-3">Aucune transaction.</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Date</TableHead><TableHead>Montant total</TableHead><TableHead>Commission</TableHead><TableHead>Votre part</TableHead><TableHead>Statut</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {transactions.map(t => (
                        <TableRow key={t.id}>
                          <TableCell>{new Date(t.created_at).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell>{formatCFA(t.amount_total)}</TableCell>
                          <TableCell>
                            <div className="text-destructive font-bold">-{formatCFA(t.commission_fee)}</div>
                            <div className="text-[10px] text-muted-foreground mt-0.5 font-medium">RESEAU (4%): {formatCFA(t.gateway_fee || 0)}</div>
                            <div className="text-[10px] text-muted-foreground font-medium">SERVICE: {formatCFA(t.platform_commission || 0)}</div>
                          </TableCell>
                          <TableCell className="font-bold text-success text-base">{formatCFA(t.seller_payout)}</TableCell>
                          <TableCell>
                            <Badge className={t.status === "completed" ? "bg-success/10 text-success" : t.status === "escrow" ? "bg-warning/10 text-warning" : ""}>
                              {t.status === "completed" ? "Complété" : t.status === "escrow" ? "Séquestre" : t.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Promo Codes */}
          <TabsContent value="promos" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">Mes codes promo</h3>
              <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90"><Plus className="mr-1 h-4 w-4" /> Nouveau code</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Créer un code promo</DialogTitle></DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2"><Label>Code *</Label><Input placeholder="Ex: SOLDES2026" value={newPromoCode} onChange={e => setNewPromoCode(e.target.value.toUpperCase())} /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Réduction (%)</Label><Input type="number" value={newPromoDiscount} onChange={e => setNewPromoDiscount(e.target.value)} min={1} max={100} /></div>
                      <div className="space-y-2"><Label>Max utilisations</Label><Input type="number" placeholder="Illimité" value={newPromoMaxUses} onChange={e => setNewPromoMaxUses(e.target.value)} min={1} /></div>
                    </div>
                    <Button onClick={createPromoCode} className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={!newPromoCode.trim()}>Créer le code promo</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                {promoCodes.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground"><Tag className="mx-auto h-12 w-12 opacity-30" /><p className="mt-3">Aucun code promo.</p></div>
                ) : (
                  <Table>
                    <TableHeader><TableRow>
                      <TableHead>Code</TableHead><TableHead>Réduction</TableHead><TableHead>Utilisations</TableHead><TableHead>Statut</TableHead><TableHead>Actions</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {promoCodes.map(pc => (
                        <TableRow key={pc.id}>
                          <TableCell className="font-mono font-bold">{pc.code}</TableCell>
                          <TableCell>{pc.discount_percent}%</TableCell>
                          <TableCell>{pc.uses_count}{pc.max_uses ? ` / ${pc.max_uses}` : ""}</TableCell>
                          <TableCell><Badge className={pc.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>{pc.is_active ? "Actif" : "Inactif"}</Badge></TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => deletePromoCode(pc.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ads" className="mt-4">
            <Card className="border-accent/20 overflow-hidden">
               <CardHeader className="bg-accent/5 border-b">
                 <div className="flex items-center justify-between">
                   <CardTitle className="flex items-center gap-2">
                     <Megaphone className="h-5 w-5 text-accent" /> Gestionnaire de Publicité (Ads)
                   </CardTitle>
                   <Button className="bg-accent hover:bg-accent/90">Acheter des vues 🚀</Button>
                 </div>
               </CardHeader>
               <CardContent className="p-6">
                 <div className="grid gap-6 md:grid-cols-3">
                   <div className="p-4 rounded-xl border bg-card text-center space-y-1">
                      <p className="text-2xl font-bold text-accent">{products.filter((p: any) => p.is_boosted).length}</p>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Produits Boostés</p>
                   </div>
                   <div className="p-4 rounded-xl border bg-card text-center space-y-1">
                      <p className="text-2xl font-bold text-primary">0</p>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Vues Sponsorisées (30j)</p>
                   </div>
                   <div className="p-4 rounded-xl border bg-card text-center space-y-1">
                      <p className="text-2xl font-bold text-success">Low</p>
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Coût par Vue (CPV)</p>
                   </div>
                 </div>

                 <div className="mt-8">
                   <h4 className="font-bold mb-4">Vos produits boostés</h4>
                    {products.filter((p: any) => p.is_boosted).length === 0 ? (
                     <div className="py-12 border-2 border-dashed rounded-xl text-center space-y-3">
                       <p className="text-muted-foreground">Aucun produit sponsorisé pour le moment.</p>
                       <p className="text-xs italic text-muted-foreground/60">Boostez un produit pour apparaître en tête du catalogue et multiplier vos chances de vente par 5 !</p>
                       <Button variant="outline" className="text-accent border-accent/20">Boostez votre premier produit</Button>
                     </div>
                   ) : (
                     <div className="space-y-3">
                        {products.filter((p: any) => p.is_boosted).map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg bg-accent/5">
                            <div className="flex items-center gap-3">
                               <div className="h-10 w-10 bg-muted rounded overflow-hidden">
                                 <img src={p.images?.[0]} alt="" className="h-full w-full object-cover" />
                               </div>
                               <div>
                                 <p className="text-sm font-bold">{p.name}</p>
                                 <p className="text-[10px] text-muted-foreground">Expiré le: {p.boost_expires_at ? new Date(p.boost_expires_at).toLocaleDateString() : 'Bientôt'}</p>
                               </div>
                            </div>
                            <Badge className="bg-success">ACTIF</Badge>
                          </div>
                        ))}
                     </div>
                   )}
                 </div>
               </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="landing" className="mt-4">
            <LandingPageGenerator products={products} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Boost Product Dialog */}
      <Dialog open={boostDialogOpen} onOpenChange={setBoostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-accent" /> Booster la visibilité
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="rounded-xl bg-accent/5 p-4 border border-accent/10">
              <p className="text-sm font-medium">
                Voulez-vous booster la visibilité de <span className="text-accent">"{selectedBoostProduct?.name}"</span> pour <span className="font-bold text-accent">1 000 CFA / 3 jours</span> ?
              </p>
              <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">✅ Apparaît en haut du catalogue</li>
                <li className="flex items-center gap-2">✅ Badge "🔥 Boosté" sur l'image</li>
                <li className="flex items-center gap-2">✅ Priorité dans les résultats de recherche</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button 
                onClick={handleBoostProduct} 
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                disabled={boosting}
              >
                {boosting ? "Traitement..." : "Confirmer le Boost (1 000 CFA)"}
              </Button>
              <Button 
                variant="ghost" 
                className="text-xs text-muted-foreground"
                onClick={() => {
                   window.open("https://wa.me/22890000000?text=Je%20souhaite%20booster%20mon%20produit%20" + selectedBoostProduct?.id, "_blank");
                }}
              >
                Contacter l'Admin pour d'autres options
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <EditProductDialog product={editProduct} open={!!editProduct} onOpenChange={(open) => { if (!open) setEditProduct(null); }} onSaved={fetchData} />

      {/* Shipping Proof Dialog */}
      <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-display">Preuve d'expédition</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Ajoutez une note ou une photo comme preuve d'expédition. L'acheteur pourra la consulter.</p>
            <div className="space-y-2">
              <Label>Note de suivi</Label>
              <Textarea placeholder="Ex: Colis confié au livreur, ref: ABC123..." value={proofNote} onChange={e => setProofNote(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Photo (optionnel)</Label>
              <ImageUpload images={proofImages} onChange={setProofImages} maxImages={1} />
            </div>
            <Button onClick={submitShippingProof} disabled={proofSubmitting} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
              <Camera className="mr-2 h-4 w-4" /> {proofSubmitting ? "Envoi..." : "Confirmer l'expédition"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
