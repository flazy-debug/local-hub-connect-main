import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ShoppingCart, TrendingUp, Plus, Trash2, Pencil, Megaphone, Bell, Wallet, Tag, Camera, ShieldCheck, Store, Copy, Facebook, Instagram, Link as LinkIcon, MessageSquare, Clock } from "lucide-react";
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
import { cn } from "@/lib/utils";
import DashboardErrorBoundary from "@/components/dashboard/DashboardErrorBoundary";

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

  const { tab: queryTab } = Object.fromEntries(new URLSearchParams(window.location.search));
  const [activeTab, setActiveTab] = useState(queryTab || "products");

  useEffect(() => {
    if (queryTab) setActiveTab(queryTab);
  }, [queryTab]);

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

  // Auto-calculate price for partners
  useEffect(() => {
    if (sellerPlan === "PARTNER" && pSupplierPrice && partnerMarkup > 0) {
      const calculatedPrice = Math.round(parseInt(pSupplierPrice) * (1 + partnerMarkup / 100));
      setPPrice(calculatedPrice.toString());
    }
  }, [pSupplierPrice, sellerPlan, partnerMarkup]);

  const fetchData = async () => {
    try {
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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoadingData(false);
    }
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
  const totalSales = (transactions || []).reduce((s, t) => s + (t.amount_total || 0), 0);
  const totalGatewayFee = (transactions || []).reduce((s, t) => s + (t.gateway_fee || 0), 0);
  const totalPlatformFee = (transactions || []).reduce((s, t) => s + (t.platform_commission || 0), 0);
  
  const completedPayout = (transactions || []).filter(t => t?.status === "completed").reduce((s, t) => s + (t.seller_payout || 0), 0);
  const escrowBalance = (transactions || []).filter(t => t?.status === "escrow").reduce((s, t) => s + (t.seller_payout || 0), 0);
  const availableBalance = completedPayout;
  const totalOrders = (orders || []).length;
  const totalProducts = (products || []).length;

  if (authLoading || loadingData) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  if (!user) {
    return null;
  }



  return (
    <DashboardErrorBoundary>
    <div className="min-h-screen bg-secondary/30 pb-24 pt-4 md:py-8">
      <div className="container px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">Tableau de Bord</h1>
            <p className="text-xs text-muted-foreground">Bienvenue, {(user as any)?.full_name || 'Vendeur'}</p>
          </div>
          <Button variant="outline" size="icon" className="md:hidden rounded-full">
            <Bell className="h-5 w-5" />
          </Button>
        </div>

        {/* Visual Bubbles Stats - Mobile First */}
        <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl bg-primary p-4 text-center text-primary-foreground shadow-lg shadow-primary/20"
          >
            <TrendingUp className="mb-2 h-6 w-6 opacity-80" />
            <span className="text-lg font-bold leading-tight">{formatCFA(totalSales)}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-70">Ventes Totales</span>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center justify-center rounded-3xl bg-accent p-4 text-center text-accent-foreground shadow-lg shadow-accent/20"
          >
            <ShoppingCart className="mb-2 h-6 w-6 opacity-80" />
            <span className="text-lg font-bold leading-tight">{totalOrders}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-70">Commandes</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center justify-center rounded-3xl bg-success p-4 text-center text-success-foreground shadow-lg shadow-success/20"
          >
            <Wallet className="mb-2 h-6 w-6 opacity-80" />
            <span className="text-lg font-bold leading-tight">{formatCFA(availableBalance)}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-70">Disponible</span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center rounded-3xl bg-warning p-4 text-center text-warning-foreground shadow-lg shadow-warning/20"
          >
            <ShieldCheck className="mb-2 h-6 w-6 opacity-80" />
            <span className="text-lg font-bold leading-tight">{formatCFA(escrowBalance)}</span>
            <span className="text-[10px] uppercase tracking-wider opacity-70">Séquestre</span>
          </motion.div>
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
                          inputMode="numeric"
                          placeholder="15000" 
                          value={sellerPlan === "PARTNER" ? pSupplierPrice : pPrice} 
                          onChange={e => sellerPlan === "PARTNER" ? setPSupplierPrice(e.target.value) : setPPrice(e.target.value)} 
                          required 
                          min={1} 
                        />
                        {sellerPlan === "PARTNER" && partnerMarkup > 0 && (
                          <p className="text-[10px] text-success font-medium">
                            Prix de vente public (marge {partnerMarkup}%): {formatCFA(Math.round(parseInt(pSupplierPrice || "0") * (1 + partnerMarkup / 100)))}
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="scrollbar-hide overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto bg-transparent p-0 gap-2">
              <TabsTrigger value="products" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">Produits</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">Commandes</TabsTrigger>
              <TabsTrigger value="transactions" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">Compta</TabsTrigger>
              <TabsTrigger value="shop" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">Boutique</TabsTrigger>
              <TabsTrigger value="promos" className="rounded-full border data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6">Promos</TabsTrigger>
              <TabsTrigger value="ads" className="rounded-full border data-[state=active]:bg-accent data-[state=active]:text-accent-foreground px-6 font-bold flex items-center gap-1">
                <Megaphone className="h-3.5 w-3.5" /> BOOST
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >

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
          <TabsContent value="products" className="mt-4 focus-visible:outline-none">
            {products.length === 0 ? (
              <Card className="border-dashed py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <Package className="h-12 w-12 opacity-20 mb-4" />
                  <p className="text-muted-foreground font-medium">Aucun produit en ligne</p>
                  <Button variant="link" onClick={() => setAddDialogOpen(true)} className="text-accent">Ajouter mon premier article</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {products.map(p => (
                  <Card key={p.id} className="overflow-hidden border-none shadow-premium rounded-2xl bg-white/50 backdrop-blur-sm">
                    <div className="flex p-3 gap-4">
                      <div className="h-24 w-24 rounded-2xl bg-muted overflow-hidden shrink-0 shadow-inner">
                        <img src={p.images?.[0]} alt="" className="h-full w-full object-cover transition-transform hover:scale-110 duration-500" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                        <div>
                          <h4 className="font-bold text-sm truncate text-primary">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-primary font-black text-base">{formatCFA(p.price)}</span>
                            {p.promo_price && <span className="text-[10px] text-muted-foreground line-through opacity-60">{formatCFA(p.promo_price)}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] py-0 h-5 border-primary/10 bg-primary/5">Stock: {p.stock}</Badge>
                          {p.is_boosted && (
                            <Badge className="bg-gradient-to-r from-orange-500 to-amber-400 text-white text-[9px] py-0 h-5 border-none shadow-sm">
                              🔥 BOOSTÉ
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors"
                          onClick={() => setEditProduct(p)}
                        >
                          <Pencil className="h-4 w-4 text-primary" />
                        </Button>
                        <Button 
                          variant="secondary" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors"
                          onClick={() => { setSelectedBoostProduct(p); setBoostDialogOpen(true); }}
                        >
                          <Megaphone className="h-4 w-4 text-accent" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            <div className="hidden md:block">
              <Card className="rounded-2xl border-none shadow-sm">
                <CardContent className="p-0">
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
                              <Button variant="ghost" size="icon" className="text-accent" onClick={() => { setSelectedBoostProduct(p); setBoostDialogOpen(true); }}><Megaphone className="h-4 w-4" /></Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => setEditProduct(p)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Orders */}
          <TabsContent value="orders" className="mt-4 focus-visible:outline-none">
            {orders.length === 0 ? (
              <Card className="border-dashed py-12">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <ShoppingCart className="h-12 w-12 opacity-20 mb-4" />
                  <p className="text-muted-foreground font-medium">Aucune commande reçue</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {orders.map(o => (
                  <Card key={o.id} className="overflow-hidden border-none shadow-premium rounded-2xl bg-white/50 backdrop-blur-sm p-4 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest leading-none">#{o.order_number}</p>
                        <h4 className="font-bold text-sm text-primary tracking-tight">{o.buyer_name}</h4>
                      </div>
                      <Badge className={cn("text-[10px] rounded-full px-2 py-0.5 border-none shadow-sm", statusColors[o.status])}>
                        {statusLabels[o.status] || o.status}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between py-3 border-t border-b border-dashed">
                      <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Commande</span>
                      <span className="text-base font-black text-accent">{formatCFA(o.total)}</span>
                    </div>

                    <div className="flex gap-2">
                      {o.status === "paid" && (
                        <Button className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-2xl font-bold shadow-lg shadow-primary/20" onClick={() => updateOrderStatus(o.id, "preparing")}>
                          Préparer le colis
                        </Button>
                      )}
                      {o.status === "preparing" && (
                        <Button className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground h-11 rounded-2xl font-bold shadow-lg shadow-accent/20" onClick={() => openShippingProof(o.id)}>
                          <Camera className="h-4 w-4 mr-2" /> Expédier
                        </Button>
                      )}
                      <Button variant="secondary" className="h-11 w-12 rounded-2xl bg-success/10 text-success hover:bg-success hover:text-white transition-all border-none" onClick={() => window.open(`https://wa.me/${o.buyer_phone?.replace(/\+/g, '')}?text=Bonjour%20${o.buyer_name},%20concernant%20votre%20commande%20${o.order_number}...`)}>
                        <MessageSquare className="h-5 w-5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="hidden md:block">
              <Card className="rounded-2xl border-none shadow-sm">
                <CardContent className="p-0">
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
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {transactions.length === 0 ? (
                <Card className="border-dashed py-12 md:col-span-full">
                  <CardContent className="flex flex-col items-center justify-center text-center">
                    <TrendingUp className="h-12 w-12 opacity-20 mb-4" />
                    <p className="text-muted-foreground">Aucune transaction enregistrée</p>
                  </CardContent>
                </Card>
              ) : (
                transactions.map(t => (
                  <Card key={t.id} className="overflow-hidden border-none shadow-premium rounded-3xl bg-white/50 backdrop-blur-sm p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">REÇU LE</p>
                        <p className="text-xs font-bold text-primary">{new Date(t.created_at).toLocaleDateString("fr-FR", { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <Badge className={cn("text-[10px] rounded-full px-3 py-1 border-none shadow-sm", 
                        t.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                        {t.status === "completed" ? "Déjà payé" : "En attente (Séquestre)"}
                      </Badge>
                    </div>

                    <div className="rounded-2xl bg-secondary/20 p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground font-medium uppercase tracking-tight">Vente brute</span>
                        <span className="font-bold">{formatCFA(t.amount_total)}</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground/70 italic">Frais réseau (4%)</span>
                          <span className="text-destructive">-{formatCFA(t.gateway_fee || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground/70 italic">Commission plateforme</span>
                          <span className="text-destructive">-{formatCFA(t.platform_commission || 0)}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-muted/50 flex justify-between items-center">
                        <span className="text-xs font-black uppercase tracking-widest">Part Vendeur</span>
                        <span className="text-lg font-black text-success tracking-tighter">{formatCFA(t.seller_payout)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground/60 px-1 italic">
                      <span>Transaction ID: {t.id.slice(0, 12)}...</span>
                      {t.status === "escrow" && <span className="flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Libération auto. sous 48h</span>}
                    </div>
                  </Card>
                ))
              )}
            </div>
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
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {promoCodes.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground bg-white/50 backdrop-blur-sm rounded-3xl border border-dashed md:col-span-full">
                  <Tag className="mx-auto h-12 w-12 opacity-20 mb-3" />
                  <p>Aucun code promo créé</p>
                  <Button variant="link" className="text-accent text-[11px]" onClick={() => setPromoDialogOpen(true)}>Lancer ma première promo</Button>
                </div>
              ) : (
                promoCodes.map(pc => (
                  <Card key={pc.id} className="overflow-hidden border-none shadow-premium rounded-3xl bg-white/50 backdrop-blur-sm p-5 space-y-4 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-lg font-black tracking-widest text-[#142642]">{pc.code}</p>
                          <Badge className="bg-success/10 text-success border-none text-[9px] px-2 py-0">-{pc.discount_percent}%</Badge>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-destructive hover:bg-destructive/10" onClick={() => deletePromoCode(pc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-muted/30">
                      <div className="space-y-0.5">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">UTILISATIONS</p>
                        <p className="text-xs font-bold text-primary">{pc.uses_count} {pc.max_uses ? `/ ${pc.max_uses}` : "Illimitée"}</p>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <p className="text-[9px] text-muted-foreground uppercase font-bold">STATUT</p>
                        <p className={cn("text-xs font-bold", pc.is_active ? "text-success" : "text-muted-foreground")}>
                          {pc.is_active ? "CODE ACTIF" : "DÉSACTIVÉ"}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
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
          </motion.div>
        </AnimatePresence>
      </Tabs>

        {/* Floating Action Button - Mobile Only */}
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-24 right-6 z-40 md:hidden"
        >
          <Button 
            onClick={() => setAddDialogOpen(true)}
            className="h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-2xl shadow-accent/40"
          >
            <Plus className="h-7 w-7" />
          </Button>
        </motion.div>

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
  </div>
    </DashboardErrorBoundary>
  );
}
