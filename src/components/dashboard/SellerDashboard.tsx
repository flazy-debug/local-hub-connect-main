import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, ShoppingCart, TrendingUp, Plus, Trash2, Pencil, Megaphone, 
  Bell, Wallet, Tag, Camera, ShieldCheck, Store, Copy, Facebook, 
  Instagram, Link as LinkIcon, MessageSquare, Clock, ExternalLink,
  AlertTriangle, ArrowUpRight, Calendar as CalendarIcon, ChevronDown,
  Truck
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, Legend
} from "recharts";
import { format, subDays, startOfDay, endOfDay, isWithinInterval, eachDayOfInterval, isSameDay } from "date-fns";
import { fr } from "date-fns/locale";
import { DateRange } from "react-day-picker";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  pending: "bg-slate-100 text-slate-400", paid: "bg-primary/10 text-primary",
  preparing: "bg-slate-50 text-slate-400", shipped: "bg-slate-200 text-slate-500",
  delivered: "bg-secondary/10 text-secondary", completed: "bg-secondary text-white",
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
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  });
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
  const [pTransactionType, setPTransactionType] = useState<"vente" | "location" | "service">("vente");
  const [pYear, setPYear] = useState("");
  const [pKm, setPKm] = useState("");
  const [pFuel, setPFuel] = useState("essence");
  const [pTransmission, setPTransmission] = useState("automatique");
  const [pSurface, setPSurface] = useState("");
  const [pRooms, setPRooms] = useState("");
  const [pIsRent, setPIsRent] = useState(false);
  const [pDeliveryZone, setPDeliveryZone] = useState("");
  const [isUploading, setIsUploading] = useState(false);
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

  // Analytics Logic - Current vs Previous
  const analyticsData = useMemo(() => {
    if (!transactions || transactions.length === 0 || !dateRange?.from || !dateRange?.to) {
      return { chart: [], totalNet: 0, trend: 0 };
    }

    const from = startOfDay(dateRange.from);
    const to = endOfDay(dateRange.to);
    
    // Previous period for trend calculation
    const durationMs = to.getTime() - from.getTime();
    const prevFrom = new Date(from.getTime() - durationMs - 1);
    const prevTo = new Date(from.getTime() - 1);

    let currentNet = 0;
    let prevNet = 0;

    transactions.forEach(t => {
      const txDate = new Date(t.created_at);
      if (isWithinInterval(txDate, { start: from, end: to })) {
        currentNet += t.seller_payout || 0;
      } else if (isWithinInterval(txDate, { start: prevFrom, end: prevTo })) {
        prevNet += t.seller_payout || 0;
      }
    });

    const trend = prevNet === 0 ? 100 : Math.round(((currentNet - prevNet) / prevNet) * 100);

    // Chart Data
    const days = eachDayOfInterval({ start: from, end: to });
    const chart = days.map(day => {
      const dayNet = transactions
        .filter(t => isSameDay(new Date(t.created_at), day))
        .reduce((sum, t) => sum + (t.seller_payout || 0), 0);
      const dayBrut = transactions
        .filter(t => isSameDay(new Date(t.created_at), day))
        .reduce((sum, t) => sum + (t.amount_total || 0), 0);

      return {
        date: format(day, "dd MMM", { locale: fr }),
        net: dayNet,
        brut: dayBrut,
      };
    });

    return { chart, totalNet: currentNet, trend };
  }, [transactions, dateRange]);

  const { chart: filteredChartData, totalNet: periodTotalNet, trend: periodTrend } = analyticsData;

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    if (isUploading) {
      toast({ 
        title: "Veuillez patienter ⏳", 
        description: "L'upload des images est en cours.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      // Explicit conversion with defaults to avoid NaN/Null in DB
      const price = Number(pPrice) || 0;
      const promoPrice = pPromoPrice ? Number(pPromoPrice) : null;
      const stock = (pCategory === 'immobilier' || pCategory === 'vehicules') ? 1 : (Number(pStock) || 0);

      const { error } = await supabase.from("products").insert({
        seller_id: user.id, 
        name: pName || "Sans nom", 
        description: pDesc || "",
        price: price,
        promo_price: promoPrice,
        category: pCategory || "autres", 
        condition: pCondition, 
        stock: stock,
        neighborhood: pNeighborhood || "Lomé", 
        pickup_available: pPickup,
        delivery_available: pDelivery, 
        pickup_address: pPickupAddr || null,
        delivery_zone: pDeliveryZone || null,
        is_rent: pIsRent,
        images: pImages.length > 0 ? pImages : ["/placeholder.svg"],
        video_url: pVideoUrl || null,
        supplier_price: sellerPlan === "PARTNER" ? (Number(pSupplierPrice) || null) : null,
        transaction_type: pTransactionType,
        specifications: {
          year: pYear,
          km: pKm,
          fuel: pFuel,
          transmission: pTransmission,
          surface: pSurface,
          rooms: pRooms,
        },
        is_approved: sellerPlan !== "PARTNER",
      });
      
      if (error) throw error;
      
      toast({ title: "Produit ajouté ✅" });
      setAddDialogOpen(false); 
      resetForm(); 
      fetchData();
    } catch (err: any) { 
      console.error("Submission error:", err);
      toast({ 
        title: "Erreur de publication", 
        description: err.message || "Vérifiez vos informations et réessayez.", 
        variant: "destructive" 
      }); 
    } finally { 
      setSubmitting(false); 
    }
  };

  const handleCategoryChange = (val: string) => {
    const restricted = ['immobilier', 'vehicules', 'services-professionnels', 'services'];
    if ((restricted.includes(val) || val.toLowerCase().includes('service')) && !['PRO', 'PARTNER'].includes(sellerPlan || '')) {
      toast({
        title: "Compte Professionnel Requis 🔒",
        description: "Seuls les membres PRO et PARTENAIRES peuvent publier dans l'Immobilier, l'Automobile et les Services.",
        variant: "destructive"
      });
      return;
    }
    setPCategory(val);
    if (val.toLowerCase().includes('service')) {
      setPTransactionType("service");
      setPDelivery(false);
    } else if (val === 'vehicules') {
      setPTransactionType("vente");
      setPDelivery(false);
    } else if (val === 'immobilier') {
      setPDelivery(false);
    }
  };

  const resetForm = () => {
    setPName(""); setPDesc(""); setPPrice(""); setPPromoPrice(""); setPCategory("");
    setPCondition("neuf"); setPStock("1"); setPNeighborhood("");
    setPPickup(true); setPDelivery(false); setPPickupAddr(""); setPImages([]); setPVideoUrl(null); setPSupplierPrice("");
    setPTransactionType("vente"); setPYear(""); setPKm(""); setPFuel("essence");
    setPTransmission("automatique"); setPSurface(""); setPRooms("");
    setPIsRent(false); setPDeliveryZone("");
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
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard icon={TrendingUp} label="Ventes Totales" value={formatCFA(totalSales)} color="bg-primary" />
          <StatCard icon={ShoppingCart} label="Commandes en cours" value={pendingOrdersCount} color="bg-slate-900" suffix={pendingOrdersCount > 1 ? "actives" : "active"} />
          <StatCard icon={Wallet} label="Gain Disponible" value={formatCFA(availableBalance)} color="bg-accent" />
          <StatCard icon={lowStockCount > 0 ? AlertTriangle : ShieldCheck} label="Alertes Stock" value={lowStockCount} color={lowStockCount > 0 ? "bg-destructive" : "bg-secondary"} suffix="bas" />
        </div>

        {/* Plan & Action Banner */}
        <Card className="border-none shadow-premium rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-xl relative">
           <div className="absolute top-0 right-0 h-64 w-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
           <div className="p-8 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
              <div className="flex items-center gap-6">
                <div className={cn("h-20 w-20 rounded-[2rem] flex items-center justify-center text-white", sellerPlan === "PRO" ? "bg-accent shadow-2xl shadow-accent/20" : "bg-primary shadow-2xl shadow-primary/20")}>
                  <ShieldCheck className="h-10 w-10" />
                </div>
                <div>
                   <h2 className="text-2xl font-display font-black text-slate-900 tracking-tight flex items-center gap-2">
                     {sellerPlan === "PRO" ? "EPUREMARKET PRO ⭐" : "EPUREMARKET STANDARD"}
                     {sellerPlan === "PARTNER" && <Badge className="bg-secondary text-white border-none rounded-full px-4">PARTENAIRE</Badge>}
                   </h2>
                   <p className="text-slate-500 font-medium text-lg leading-tight mt-1">
                     {sellerPlan === "PRO" ? "Boosts illimités & Commissions 0%" : "Commission 14% par vente"}
                   </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                {sellerPlan !== "PRO" && (
                   <Button size="lg" className="rounded-full bg-accent text-white font-black h-16 px-10 hover:bg-accent/90 shadow-xl shadow-accent/20 transition-all hover:scale-105 active:scale-95" asChild>
                     <Link to="/pricing">DEVENIR PRO 🔥</Link>
                   </Button>
                )}
                <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg" className="rounded-full bg-slate-900 text-white font-black h-16 px-10 shadow-xl shadow-slate-900/10 transition-all hover:scale-105 active:scale-95"><Plus className="mr-2 h-6 w-6" /> LISTER UN PRODUIT</Button>
                  </DialogTrigger>
                  <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg rounded-3xl">
                    <DialogHeader><DialogTitle className="font-display text-2xl">Vendre un article</DialogTitle></DialogHeader>
                    <form onSubmit={handleAddProduct} className="space-y-4 mt-4">
                      <div className="space-y-2"><Label>Nom de l'article *</Label><Input placeholder="Ex: Basket Nike Air" value={pName} onChange={e => setPName(e.target.value)} required /></div>
                      <div className="space-y-2"><Label>Description *</Label><Textarea placeholder="Décrivez votre produit en détail..." value={pDesc} onChange={e => setPDesc(e.target.value)} required className="rounded-2xl" /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>{pCategory.toLowerCase().includes('service') ? "Tarif base / Déplacement (CFA) *" : "Prix (CFA) *"}</Label>
                          <div className="relative">
                            <Input type="number" placeholder="15000" value={pPrice} onChange={e => setPPrice(e.target.value)} required className="pr-16" />
                            {pTransactionType === 'location' && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">/ MOIS</span>}
                          </div>
                        </div>
                        {!(pCategory === 'immobilier' || pCategory === 'vehicules') && (
                          <div className="space-y-2"><Label>Stock *</Label><Input type="number" value={pStock} onChange={e => setPStock(e.target.value)} required min={0} /></div>
                        )}
                      </div>

                      {/* Specialized Fields: Immobilier */}
                      {pCategory === 'immobilier' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                          <div className="space-y-2">
                            <Label>Type de Transaction</Label>
                            <div className="flex bg-white p-1 rounded-2xl gap-1">
                              {['vente', 'location'].map(t => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => {
                                    setPTransactionType(t as any);
                                    setPIsRent(t === 'location');
                                  }}
                                  className={cn("flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", pTransactionType === t ? "bg-primary text-white shadow-lg" : "text-slate-400 hover:bg-slate-50")}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Surface (m²)</Label><Input type="number" placeholder="Ex: 300" value={pSurface} onChange={e => setPSurface(e.target.value)} /></div>
                            <div className="space-y-2"><Label>Pièces</Label><Input type="number" placeholder="Ex: 4" value={pRooms} onChange={e => setPRooms(e.target.value)} /></div>
                          </div>
                        </motion.div>
                      )}

                      {/* Specialized Fields: Automobile */}
                      {pCategory === 'vehicules' && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                          <div className="space-y-2"><Label>Année</Label><Input type="number" placeholder="2024" value={pYear} onChange={e => setPYear(e.target.value)} /></div>
                          <div className="space-y-2"><Label>Kilométrage (km)</Label><Input type="number" placeholder="15000" value={pKm} onChange={e => setPKm(e.target.value)} /></div>
                          <div className="space-y-2">
                            <Label>Carburant</Label>
                            <Select value={pFuel} onValueChange={setPFuel}>
                              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="essence">Essence</SelectItem>
                                <SelectItem value="diesel">Diesel</SelectItem>
                                <SelectItem value="hybride">Hybride</SelectItem>
                                <SelectItem value="electrique">Électrique</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Transmission</Label>
                            <Select value={pTransmission} onValueChange={setPTransmission}>
                              <SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="automatique">Automatique</SelectItem>
                                <SelectItem value="manuelle">Manuelle</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </motion.div>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Catégorie *</Label>
                          <Select value={pCategory} onValueChange={handleCategoryChange} required>
                            <SelectTrigger className="rounded-3xl"><SelectValue placeholder="Choisir" /></SelectTrigger>
                            <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Quartier *</Label>
                          <Select value={pNeighborhood} onValueChange={setPNeighborhood} required>
                            <SelectTrigger className="rounded-3xl"><SelectValue placeholder="Chosir" /></SelectTrigger>
                            <SelectContent>{neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Delivery Zone Integration */}
                      <div className={cn("space-y-4 p-4 rounded-3xl bg-primary/5 border border-primary/10 transition-all", pDelivery ? "opacity-100" : "opacity-50 pointer-events-none")}>
                        <div className="flex items-center justify-between">
                           <Label className="text-[10px] font-black uppercase tracking-widest">Zone de Livraison Préférée</Label>
                           <Truck className="h-4 w-4 text-primary" />
                        </div>
                        <Select value={pDeliveryZone} onValueChange={setPDeliveryZone} disabled={!pDelivery}>
                          <SelectTrigger className="rounded-3xl bg-white border-none shadow-sm"><SelectValue placeholder="Sélectionner le quartier" /></SelectTrigger>
                          <SelectContent>{neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                        </Select>
                        <p className="text-[9px] text-primary/60 font-medium italic">Spécifiez votre zone de livraison habituelle pour rassurer vos clients.</p>
                      </div>

                      <div className="space-y-2">
                        <Label>Photos</Label>
                        <ImageUpload 
                          images={pImages} 
                          onChange={setPImages} 
                          onUploadingChange={setIsUploading}
                          maxImages={5} 
                        />
                      </div>
                      
                      <div className="flex items-start space-x-3 p-4 rounded-3xl bg-slate-50 border border-slate-100 mt-4">
                        <input 
                          type="checkbox" 
                          id="compliance" 
                          required 
                          className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="compliance" className="text-[11px] leading-tight font-medium text-muted-foreground cursor-pointer">
                          Je certifie que ce produit est 100% légal et conforme aux <Link to="/aide" className="text-primary underline font-bold">règles publicitaires Meta/Facebook</Link>. Pas de contrefaçons, tabac, ou produits interdits.
                        </Label>
                      </div>
                      
                      <p className="text-[10px] text-muted-foreground text-center px-4 leading-tight">
                        En publiant sur Epuremarket, vous acceptez nos règles de sécurité et de conformité (Interdiction de produits illicites, tabac, etc.).
                      </p>
                      <Button 
                        type="submit" 
                        className={cn("w-full h-14 rounded-3xl font-black text-xs uppercase tracking-widest transition-all", isUploading ? "bg-slate-100 text-slate-400" : "bg-primary text-white hover:scale-[1.02]")}
                        disabled={submitting || isUploading}
                      >
                        {submitting ? "Publication..." : isUploading ? "Upload des images..." : "Publier maintenant"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
           </div>
        </Card>

        {/* Analytics Chart */}
        <Card className="border-none shadow-premium rounded-[3rem] bg-white overflow-hidden relative">
          <div className="absolute top-0 left-0 h-32 w-32 bg-primary/5 rounded-full -ml-16 -mt-16 blur-2xl" />
            <div className="flex flex-col md:flex-row md:items-end justify-between pb-8 pt-10 px-10 gap-8">
              <div className="space-y-4 flex-1">
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-2">Performance du Shop</h3>
                  <CardTitle className="text-4xl font-display font-black text-slate-900 tracking-tighter">Votre Business en Direct</CardTitle>
                  <CardDescription className="text-slate-400 font-medium italic">Analyse précise de vos profits sur mesure</CardDescription>
                </div>
                
                {/* KPI Highlight - GAIN NET */}
                <div className="flex items-center gap-6 pt-4">
                  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-premium p-8 flex flex-col gap-1 min-w-[280px]">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Gain Net de la Période</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-display font-black text-primary tracking-tighter">
                        {formatCFA(periodTotalNet)}
                      </span>
                      {periodTrend !== 0 && (
                        <div className={cn("flex items-center gap-1 text-xs font-black px-3 py-1 rounded-full", periodTrend > 0 ? "bg-secondary/10 text-secondary" : "bg-destructive/10 text-destructive")}>
                          {periodTrend > 0 ? "↑" : "↓"} {Math.abs(periodTrend)}%
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Date Range Picker */}
              <div className="flex flex-col gap-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Filtrer par date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="date"
                      variant={"outline"}
                      className={cn(
                        "w-[300px] justify-start text-left font-black text-[11px] uppercase tracking-widest h-16 rounded-full border-none bg-slate-50 shadow-inner px-8 transition-all hover:bg-slate-100",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-3 h-5 w-5 opacity-40" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "dd LLL y", { locale: fr })} -{" "}
                            {format(dateRange.to, "dd LLL y", { locale: fr })}
                          </>
                        ) : (
                          format(dateRange.from, "dd LLL y", { locale: fr })
                        )
                      ) : (
                        <span>Sélectionner une plage</span>
                      )}
                      <ChevronDown className="ml-auto h-4 w-4 opacity-40" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-[2.5rem] shadow-3xl border-none" align="end">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={fr}
                      className="p-6"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          <CardContent className="pb-10 pt-4 px-4 md:px-10">
            <div className="h-[400px] w-full relative">
              <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={filteredChartData} margin={{ top: 20, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6D28D9" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#6D28D9" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorBrut" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94A3B8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#94A3B8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#F1F5F9" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 900, letterSpacing: '0.05em' }} 
                      dy={15} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 11, fill: '#94A3B8', fontWeight: 900 }} 
                      tickFormatter={(val) => val === 0 ? "0" : `${val/1000}k`} 
                    />
                    <Tooltip 
                      contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900', padding: '20px', background: 'rgba(255,255,255,0.98)', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: '900' }}
                      labelStyle={{ color: '#94A3B8', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      formatter={(value: any) => [formatCFA(value), ""]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="brut" 
                      name="Chiffre d'Affaires"
                      stroke="#94A3B8" 
                      strokeWidth={2}
                      strokeOpacity={0.3}
                      fillOpacity={1} 
                      fill="url(#colorBrut)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="net" 
                      name="Gain Net"
                      stroke="#6D28D9" 
                      strokeWidth={6}
                      fillOpacity={1} 
                      fill="url(#colorNet)" 
                      animationDuration={2000}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="right" 
                      iconType="circle" 
                      iconSize={6} 
                      wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.5 }} 
                    />
                  </AreaChart>
              </ResponsiveContainer>

            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="scrollbar-hide overflow-x-auto pb-6">
            <TabsList className="inline-flex w-auto bg-slate-100/50 backdrop-blur-xl rounded-full p-2 gap-2 shadow-inner">
              <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-primary px-8 font-black h-12 text-xs uppercase tracking-widest transition-all">Produits</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-primary px-8 font-black h-12 text-xs uppercase tracking-widest transition-all">Commandes ({pendingOrdersCount})</TabsTrigger>
              <TabsTrigger value="transactions" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-primary px-8 font-black h-12 text-xs uppercase tracking-widest transition-all">Finances</TabsTrigger>
              <TabsTrigger value="shop" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-primary px-8 font-black h-12 text-xs uppercase tracking-widest transition-all">Boutique</TabsTrigger>
              <TabsTrigger value="promos" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-primary px-8 font-black h-12 text-xs uppercase tracking-widest transition-all">Marketing</TabsTrigger>
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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {products.map(p => (
                    <Card key={p.id} className="overflow-hidden border-none shadow-premium rounded-[2.5rem] bg-white transition-all hover:scale-[1.03] hover:shadow-2xl group">
                      <div className="flex p-6 gap-6">
                        <div className="h-28 w-28 rounded-[2rem] bg-slate-50 overflow-hidden shrink-0 relative shadow-inner">
                          <img src={p.images?.[0]} alt="" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                          {p.stock < 3 && (
                            <div className="absolute top-2 right-2 bg-destructive text-white text-[8px] font-black px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
                              <AlertTriangle className="h-2 w-2" /> STOCK BAS
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div className="space-y-1">
                            <h4 className="font-display font-black text-xs truncate text-slate-400 uppercase tracking-widest">{p.category}</h4>
                            <h3 className="font-display font-black text-lg truncate text-primary tracking-tight leading-none">{p.name}</h3>
                            <p className="text-secondary font-black text-xl leading-none mt-2">{formatCFA(p.price)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                             <Badge variant={p.stock < 3 ? "destructive" : "outline"} className="text-[10px] font-black rounded-full px-3 py-1 border-slate-100">
                               STOCK: {p.stock}
                             </Badge>
                             {p.is_boosted && <Badge className="bg-accent text-white text-[10px] font-black rounded-full border-none shadow-lg shadow-accent/20 px-3 py-1">🔥 BOOSTÉ</Badge>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-50 hover:bg-primary hover:text-white transition-colors" onClick={() => setEditProduct(p)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-50 hover:bg-accent hover:text-white transition-colors" onClick={() => { setSelectedBoostProduct(p); setBoostDialogOpen(true); }}><Megaphone className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-2xl bg-slate-50 hover:bg-destructive hover:text-white transition-colors" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
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
                <Card className="border-none shadow-premium rounded-[3rem] bg-white overflow-hidden">
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-50">
                      {orders.length === 0 ? (
                        <div className="py-32 text-center">
                          <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <ShoppingCart className="h-10 w-10 text-slate-200" />
                          </div>
                          <p className="text-slate-300 font-black uppercase tracking-[0.3em]">Aucune commande active</p>
                        </div>
                      ) : (
                        orders.map((order) => (
                          <div key={order.id} className="flex flex-col md:flex-row md:items-center justify-between p-10 hover:bg-slate-50/50 transition-colors gap-8">
                            <div className="space-y-6">
                              <div className="flex items-center gap-4">
                                <Badge className="bg-primary/5 text-primary border-none text-[10px] h-8 px-5 rounded-full font-black tracking-widest shadow-sm">ORD-{order.order_number}</Badge>
                                <Badge className={cn("text-[10px] h-8 rounded-full font-black px-5 border-none shadow-sm uppercase tracking-widest", statusColors[order.status])}>
                                  {statusLabels[order.status] || order.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-[1.5rem] bg-primary/5 shadow-inner flex items-center justify-center text-3xl">👤</div>
                                <div>
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Client</p>
                                  <p className="text-xl font-display font-black text-slate-900 leading-none">{order.customer_name}</p>
                                  <p className="text-xs text-slate-500 font-medium flex items-center gap-2 mt-2">
                                    <CalendarIcon className="h-3 w-3" /> {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </p>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center justify-between md:justify-end gap-10 shrink-0 border-t md:border-t-0 pt-8 md:pt-0">
                              <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none">Net à Percevoir</p>
                                <p className="text-3xl font-display font-black text-secondary tracking-tighter leading-none">{formatCFA(order.total)}</p>
                                <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-widest">{order.items?.length || 1} article(s)</p>
                              </div>
                              <div className="flex gap-3">
                                {order.status === "paid" && (
                                  <Button className="h-14 rounded-full bg-primary text-white font-black px-8 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95" onClick={() => updateOrderStatus(order.id, "preparing")}>PRÉPARER</Button>
                                )}
                                {order.status === "preparing" && (
                                  <Button className="h-14 rounded-full bg-accent text-white font-black px-8 shadow-xl shadow-accent/20 transition-all hover:scale-105 active:scale-95" onClick={() => setProofOrderId(order.id)}>EXPÉDIER</Button>
                                )}
                                <Button size="icon" variant="ghost" className="h-14 w-14 rounded-full bg-slate-50 hover:bg-slate-100 transition-all active:scale-90 shadow-inner" asChild>
                                  <Link to={`/suivi?id=${order.id}`}><ExternalLink className="h-6 w-6 text-slate-400" /></Link>
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
                              <Badge className={cn("rounded-full font-black text-[10px] border-none", tx.status === "completed" ? "bg-success/10 text-success" : "bg-slate-100 text-slate-600")}>
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
                              <Input value={shopSlug} onChange={e => setShopSlug(e.target.value)} className="pl-9 h-12 rounded-3xl bg-slate-50 border-none shadow-inner font-bold" />
                            </div>
                            <Button className="h-12 rounded-3xl" onClick={saveShopInfo}>Valider</Button>
                          </div>
                          <div className="p-4 rounded-3xl bg-accent/5 border border-accent/10 flex items-center justify-between">
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
      whileHover={{ y: -8 }}
      className={cn("flex flex-col items-center justify-center rounded-[3rem] p-8 text-center text-white shadow-2xl relative overflow-hidden group", color)}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="mb-4 h-14 w-14 rounded-[1.5rem] bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10">
        <Icon className="h-8 w-8" />
      </div>
      <span className="text-3xl font-display font-black leading-none mb-2 tracking-tighter relative z-10">{value}</span>
      <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-70 relative z-10">{label} {suffix && <span className="opacity-50">• {suffix}</span>}</p>
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
        className="pl-12 h-12 rounded-3xl bg-slate-50 border-none shadow-inner text-sm font-medium" 
      />
    </div>
  );
}
