import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, ShoppingCart, TrendingUp, Plus, Trash2, Pencil, Megaphone, 
  Bell, Wallet, Tag, Camera, ShieldCheck, Store, Copy, Facebook, 
  Instagram, Link as LinkIcon, MessageSquare, Clock, ExternalLink,
  AlertTriangle, ArrowUpRight, Calendar
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Legend
} from "recharts";
import ImageUpload from "@/components/ImageUpload";
import VideoUpload from "@/components/VideoUpload";
import EditProductDialog from "@/components/dashboard/EditProductDialog";
import LandingPageGenerator from "@/components/dashboard/LandingPageGenerator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

export function SellerDashboard() {
  const { user, isSeller, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<any[]>([]);
  const [sellerPlan, setSellerPlan] = useState(profile?.subscription_type || "STANDARD");
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [promoCodes, setPromoCodes] = useState<any[]>([]);
  const [partnerMarkup, setPartnerMarkup] = useState(profile?.partner_markup_percent || 0);
  const [loadingData, setLoadingData] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState("7d");

  const { tab: queryTab } = Object.fromEntries(new URLSearchParams(window.location.search));
  const [activeTab, setActiveTab] = useState(queryTab || "products");

  useEffect(() => {
    if (queryTab) setActiveTab(queryTab);
  }, [queryTab]);

  // Product form states
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
  
  // Dialog states
  const [boostDialogOpen, setBoostDialogOpen] = useState(false);
  const [selectedBoostProduct, setSelectedBoostProduct] = useState<any>(null);
  const [boosting, setBoosting] = useState(false);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofOrderId, setProofOrderId] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [proofSubmitting, setProofSubmitting] = useState(false);
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState("10");
  const [newPromoMaxUses, setNewPromoMaxUses] = useState("");

  // Shop Details
  const [shopSlug, setShopSlug] = useState(profile?.shop_slug || "");
  const [facebookUrl, setFacebookUrl] = useState(profile?.facebook_url || "");
  const [instagramUrl, setInstagramUrl] = useState(profile?.instagram_url || "");
  const [tiktokUrl, setTiktokUrl] = useState(profile?.tiktok_url || "");
  const [savingShopInfo, setSavingShopInfo] = useState(false);

  useEffect(() => {
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
  }, [user, isSeller]);

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

  // Helper for Chart Data
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      // Données de factices pour un nouveau dashboard
      const now = new Date();
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(now.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          brut: Math.floor(Math.random() * 15000) + 5000,
          net: Math.floor(Math.random() * 12000) + 4000,
          isMock: true
        };
      });
    }
    
    const days: Record<string, { date: string, brut: number, net: number, isMock: boolean }> = {};
    const now = new Date();
    const timeframeDays = chartTimeframe === "7d" ? 7 : chartTimeframe === "30d" ? 30 : 365;

    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = { date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), brut: 0, net: 0, isMock: false };
    }

    transactions.forEach(t => {
      const key = new Date(t.created_at).toISOString().split('T')[0];
      if (days[key]) {
        days[key].brut += t.amount_total || 0;
        days[key].net += t.seller_payout || 0;
      }
    });

    return Object.values(days);
  }, [transactions, chartTimeframe]);

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
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { setShopSlug(formattedSlug); toast({ title: "Boutique mise à jour" }); }
    setSavingShopInfo(false);
  };

  const deleteProduct = async (productId: string) => {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Produit supprimé" }); fetchData(); }
  };

  if (loadingData) {
    return <div className="flex min-h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  }

  // Wallet stats
  const totalSales = transactions.reduce((s, t) => s + (t.amount_total || 0), 0);
  const availableBalance = transactions.filter(t => t?.status === "completed").reduce((s, t) => s + (t.seller_payout || 0), 0);
  const escrowBalance = transactions.filter(t => t?.status === "escrow").reduce((s, t) => s + (t.seller_payout || 0), 0);
  const pendingOrdersCount = orders.filter(o => ["pending", "paid", "preparing"].includes(o.status)).length;
  const lowStockCount = products.filter(p => (p.stock || 0) < 3).length;

  return (
    <DashboardErrorBoundary>
      <div className="space-y-8">
        {/* Visual Bubbles Stats */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard icon={TrendingUp} label="Ventes Totales" value={formatCFA(totalSales)} color="bg-primary shadow-primary/20" />
          <StatCard icon={ShoppingCart} label="Commandes en cours" value={pendingOrdersCount} color="bg-accent shadow-accent/20" suffix={pendingOrdersCount > 1 ? "actives" : "active"} />
          <StatCard icon={Wallet} label="Gain Disponible" value={formatCFA(availableBalance)} color="bg-success shadow-success/20" />
          <StatCard icon={lowStockCount > 0 ? AlertTriangle : ShieldCheck} label="Alertes Stock" value={lowStockCount} color={lowStockCount > 0 ? "bg-destructive shadow-destructive/20" : "bg-warning shadow-warning/20"} suffix="bas" />
        </div>

        {/* Plan & Action Banner */}
        <Card className="border-none shadow-premium rounded-[32px] overflow-hidden bg-white/80 backdrop-blur-md">
           <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className={cn("h-16 w-16 rounded-3xl flex items-center justify-center text-white", sellerPlan === "PRO" ? "bg-accent shadow-lg shadow-accent/30" : "bg-primary shadow-lg shadow-primary/30")}>
                  <ShieldCheck className="h-8 w-8" />
                </div>
                <div>
                   <h2 className="text-xl font-black text-primary flex items-center gap-2">
                     {sellerPlan === "PRO" ? "EPUREMARKET PRO ⭐" : "EPUREMARKET STANDARD"}
                     {sellerPlan === "PARTNER" && <Badge className="bg-success">PARTENAIRE</Badge>}
                   </h2>
                   <p className="text-sm text-muted-foreground font-medium">
                     {sellerPlan === "PRO" ? "Boosts illimités & Commissions 0%" : "Commission 14% par vente (Gateway + Plateforme)"}
                   </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {sellerPlan !== "PRO" && (
                   <Button size="lg" className="rounded-2xl bg-accent text-accent-foreground font-bold h-14 px-8 hover:bg-accent/90" asChild>
                     <Link to="/pricing">PASSER PRO 🔥</Link>
                   </Button>
                )}
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="rounded-2xl bg-primary text-white font-bold h-14 px-8"><Plus className="mr-2 h-5 w-5" /> NOUVEAU PRODUIT</Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-[32px]">
                    <DialogHeader><DialogTitle className="font-display text-2xl">Vendre un article</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
                      <div className="space-y-2"><Label>Nom de l'article *</Label><Input placeholder="Ex: Basket Nike Air" value={pName} onChange={e => setPName(e.target.value)} required /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label>Prix (CFA) *</Label><Input type="number" placeholder="15000" value={pPrice} onChange={e => setPPrice(e.target.value)} required /></div>
                        <div className="space-y-2"><Label>Stock *</Label><Input type="number" value={pStock} onChange={e => setPStock(e.target.value)} required min={0} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Catégorie *</Label>
                          <Select value={pCategory} onValueChange={setPCategory} required>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choisir" /></SelectTrigger>
                            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Quartier *</Label>
                          <Select value={pNeighborhood} onValueChange={setPNeighborhood} required>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Chosir" /></SelectTrigger>
                            <SelectContent>{neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2"><Label>Photos</Label><ImageUpload images={pImages} onChange={setPImages} maxImages={5} /></div>
                      
                      <div className="flex items-start space-x-3 p-4 rounded-2xl bg-slate-50 border border-slate-100 mt-4">
                        <input 
                          type="checkbox" 
                          id="compliance" 
                          required 
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="compliance" className="text-[11px] leading-tight font-medium text-muted-foreground cursor-pointer">
                          Je certifie que ce produit est 100% légal et conforme aux <Link to="/help" className="text-primary underline font-bold">règles publicitaires Meta/Facebook</Link>. Pas de contrefaçons, tabac, ou produits interdits.
                        </Label>
                      </div>
                      <Button type="submit" className="w-full h-12 rounded-xl bg-primary text-white font-bold" disabled={submitting}>
                        {submitting ? "Publication..." : "Publier maintenant"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
           </div>
        </Card>

        {/* Analytics Chart */}
        <Card className="border-none shadow-premium rounded-[32px] bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-xl font-black text-primary uppercase tracking-tighter">Epuremarket Analytics</CardTitle>
              <CardDescription>Visualisation de vos revenus réels à Lomé</CardDescription>
            </div>
            <Select value={chartTimeframe} onValueChange={setChartTimeframe}>
              <SelectTrigger className="w-[120px] rounded-full bg-slate-50 border-none h-10 font-bold text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-none shadow-xl">
                <SelectItem value="7d">7 derniers jours</SelectItem>
                <SelectItem value="30d">30 derniers jours</SelectItem>
                <SelectItem value="365d">Cette année</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pt-4 px-2 md:px-6">
            <div className="h-[350px] w-full relative">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorBrut" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sellerPlan === "PRO" ? "#F97316" : "#22C55E"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={sellerPlan === "PRO" ? "#F97316" : "#22C55E"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888888', fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888888', fontWeight: 600 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                    formatter={(value: any) => [formatCFA(value), ""]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="brut" 
                    name="Vente Brute"
                    stroke={sellerPlan === "PRO" ? "#F97316" : "#22C55E"} 
                    strokeWidth={4}
                    fillOpacity={1} 
                    fill="url(#colorBrut)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="net" 
                    name="Gain Net"
                    stroke="#0EA5E9" 
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    fill="transparent" 
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 'bold' }} />
                </AreaChart>
              </ResponsiveContainer>
              {chartData[0]?.isMock && (
                <p className="text-[10px] text-center text-muted-foreground mt-4 font-bold uppercase tracking-widest opacity-50">Démonstration (En attente de vos premières ventes)</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="scrollbar-hide overflow-x-auto pb-2">
            <TabsList className="inline-flex w-auto bg-slate-100 rounded-full p-1 gap-1">
              <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold h-10">Produits</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold h-10">Commandes ({pendingOrdersCount})</TabsTrigger>
              <TabsTrigger value="transactions" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold h-10">Finances</TabsTrigger>
              <TabsTrigger value="shop" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold h-10">Ma Page</TabsTrigger>
              <TabsTrigger value="promos" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-6 font-bold h-10">Codes Promo</TabsTrigger>
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
              <TabsContent value="products" className="mt-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products.map(p => (
                    <Card key={p.id} className="overflow-hidden border-none shadow-premium rounded-3xl bg-white transition-all hover:scale-[1.02]">
                      <div className="flex p-4 gap-4">
                        <div className="h-24 w-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 relative">
                          <img src={p.images?.[0]} alt="" className="h-full w-full object-cover" />
                          {p.stock < 3 && (
                            <div className="absolute top-1 right-1 bg-destructive text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                              <AlertTriangle className="h-2 w-2" /> URGENT
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div className="space-y-1">
                            <h4 className="font-bold text-sm truncate text-primary uppercase">{p.name}</h4>
                            <p className="text-primary font-black text-lg leading-none">{formatCFA(p.price)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant={p.stock < 3 ? "destructive" : "secondary"} className="text-[9px] font-black rounded-full">
                               STOCK: {p.stock}
                             </Badge>
                             {p.is_boosted && <Badge className="bg-accent text-white text-[9px] font-bold rounded-full border-none">🔥 BOOSTÉ</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100" onClick={() => setEditProduct(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100" onClick={() => { setSelectedBoostProduct(p); setBoostDialogOpen(true); }}><Megaphone className="h-4 w-4" /></Button>
                          <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl border-slate-100 text-destructive" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                  {products.length === 0 && (
                    <div className="col-span-full py-20 text-center rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold uppercase tracking-widest">Aucun produit en vente</p>
                      <Button variant="ghost" className="mt-4 text-primary font-black underline" onClick={() => setAddDialogOpen(true)}>Lister mon premier article</Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="orders" className="mt-4">
                <Card className="border-none shadow-premium rounded-[32px] bg-white">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {orders.length === 0 ? (
                        <div className="py-20 text-center text-slate-300 font-black uppercase tracking-widest">Zéro commande en attente</div>
                      ) : (
                        orders.map((order) => (
                          <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 rounded-3xl bg-slate-50 border-none gap-6 transition-all hover:bg-slate-100/50">
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <Badge className="bg-primary/10 text-primary border-none text-[10px] h-6 px-3 rounded-full font-black">#{order.order_number}</Badge>
                                <Badge className={cn("text-[9px] h-6 rounded-full font-bold px-3 border-none", statusColors[order.status])}>
                                  {statusLabels[order.status] || order.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl">👤</div>
                                <div>
                                  <p className="text-sm font-black text-primary uppercase">{order.customer_name}</p>
                                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {new Date(order.created_at).toLocaleDateString()} • {order.items?.length || 0} articles</p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-6 shrink-0 border-t md:border-t-0 pt-4 md:pt-0">
                              <div className="text-right">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Payé</p>
                                <p className="text-2xl font-black text-primary">{formatCFA(order.total)}</p>
                              </div>
                              <div className="flex gap-2">
                                {order.status === "paid" && (
                                  <Button className="h-12 rounded-xl bg-primary text-white font-black px-6" onClick={() => updateOrderStatus(order.id, "preparing")}>PRÉPARER</Button>
                                )}
                                {order.status === "preparing" && (
                                  <Button className="h-12 rounded-xl bg-accent text-white font-black px-6 shadow-lg shadow-accent/20" onClick={() => setProofOrderId(order.id)}>EXPÉDIER</Button>
                                )}
                                <Button size="icon" variant="outline" className="h-12 w-12 rounded-xl bg-white border-none shadow-sm" asChild>
                                  <Link to={`/suivi?id=${order.id}`}><ExternalLink className="h-5 w-5" /></Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="mt-4">
                 <Card className="border-none shadow-premium rounded-[32px] bg-white overflow-hidden">
                    <Table>
                      <TableHeader className="bg-slate-50 border-none">
                        <TableRow className="border-none">
                          <TableHead className="text-[10px] font-black uppercase tracking-widest pl-6">Date</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest">Détails</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Brut</TableHead>
                          <TableHead className="text-[10px] font-black uppercase tracking-widest text-right pr-6">Gain Net</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.map((tx) => (
                          <TableRow key={tx.id} className="border-b-slate-50">
                            <TableCell className="text-xs font-bold pl-6">{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-xs font-black uppercase">Vente Commande</span>
                                <span className="text-[10px] text-muted-foreground">ID: #{tx.order_id?.slice(0, 8)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-right font-medium">{formatCFA(tx.amount_total)}</TableCell>
                            <TableCell className="text-xs text-right pr-6">
                              <Badge className={cn("rounded-full font-black text-[10px] border-none", tx.status === "completed" ? "bg-success/10 text-success" : "bg-warning/10 text-warning")}>
                                {formatCFA(tx.seller_payout)}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                 </Card>
              </TabsContent>

              <TabsContent value="shop" className="mt-4">
                 <div className="grid gap-6 md:grid-cols-2">
                    <Card className="border-none shadow-premium rounded-[32px] bg-white p-8">
                       <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                         <Store className="h-4 w-4" /> Ma Page Boutique
                       </h3>
                       <div className="space-y-4">
                          <Label className="text-xs font-bold">Lien personnalisé (Slug)</Label>
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm leading-none">/s/</span>
                              <Input value={shopSlug} onChange={e => setShopSlug(e.target.value)} className="pl-9 h-12 rounded-xl bg-slate-50 border-none shadow-inner font-bold" />
                            </div>
                            <Button className="h-12 rounded-xl" onClick={saveShopInfo}>Valider</Button>
                          </div>
                          <div className="p-4 rounded-2xl bg-accent/5 border border-accent/10 flex items-center justify-between">
                             <div className="truncate pr-4">
                               <p className="text-[10px] font-black uppercase text-accent mb-0.5">Votre URL publique</p>
                               <p className="text-xs font-mono font-medium truncate">{window.location.origin}/s/{shopSlug || "..."}</p>
                             </div>
                             <Button size="icon" variant="ghost" className="h-10 w-10 shrink-0" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/s/${shopSlug}`); toast({ title: "Lien copié !" }); }}>
                                <Copy className="h-4 w-4 text-accent" />
                             </Button>
                          </div>
                       </div>
                    </Card>

                    <Card className="border-none shadow-premium rounded-[32px] bg-white p-8">
                       <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-6">Réseaux Sociaux</h3>
                       <div className="space-y-4">
                          <SocialInput icon={Facebook} value={facebookUrl} onChange={setFacebookUrl} placeholder="facebook.com/votre-shop" />
                          <SocialInput icon={Instagram} value={instagramUrl} onChange={setInstagramUrl} placeholder="instagram.com/votre-shop" />
                          <SocialInput icon={MessageSquare} value={tiktokUrl} onChange={setTiktokUrl} placeholder="Lien WhatsApp ou TikTok" />
                       </div>
                    </Card>
                 </div>
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </DashboardErrorBoundary>
  );
}

function StatCard({ icon: Icon, label, value, color, suffix }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn("flex flex-col items-center justify-center rounded-[32px] p-6 text-center text-white shadow-lg", color)}
    >
      <div className="mb-3 h-10 w-10 rounded-2xl bg-white/20 flex items-center justify-center">
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-2xl font-black leading-none mb-1 tracking-tighter">{value}</span>
      <p className="text-[9px] uppercase font-black tracking-widest opacity-80">{label} {suffix && <span className="opacity-50">• {suffix}</span>}</p>
    </motion.div>
  );
}

function SocialInput({ icon: Icon, value, onChange, placeholder }: any) {
  return (
    <div className="relative">
      <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
      <Input 
        placeholder={placeholder} 
        value={value || ""} 
        onChange={e => onChange(e.target.value)} 
        className="pl-12 h-12 rounded-xl bg-slate-50 border-none shadow-inner text-sm font-medium" 
      />
    </div>
  );
}
