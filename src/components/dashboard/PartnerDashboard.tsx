import { useState, useEffect, useMemo } from "react";
import { 
  Package, ShoppingCart, TrendingUp, Wallet, ShieldCheck, 
  Search, ArrowUpRight, CheckCircle, Clock, AlertTriangle,
  LayoutGrid, ListOrdered, Calendar, ExternalLink
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCFA } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import PageTransition from "@/components/PageTransition";

const statusColors: Record<string, string> = {
  pending: "bg-slate-100 text-slate-400", paid: "bg-primary/10 text-primary",
  preparing: "bg-accent/10 text-accent", shipped: "bg-slate-200 text-slate-500",
  delivered: "bg-secondary/10 text-secondary", completed: "bg-secondary text-white",
};
const statusLabels: Record<string, string> = {
  pending: "En attente", paid: "Payé", preparing: "Prêt",
  shipped: "Expédié", delivered: "Livré", completed: "Terminé",
};

export function PartnerDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [sourcingProducts, setSourcingProducts] = useState<any[]>([]);
  const [partnerOrders, setPartnerOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartTimeframe, setChartTimeframe] = useState("7d");

  const markupPercent = profile?.partner_markup_percent || 0;

  useEffect(() => {
    if (user) {
      fetchSourcingData();
    }
  }, [user]);

  const fetchSourcingData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [prodRes, ordRes, txRes] = await Promise.all([
        supabase.from("products").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("orders").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").eq("seller_id", user.id).order("created_at", { ascending: false }),
      ]);

      setSourcingProducts(prodRes.data || []);
      setPartnerOrders(ordRes.data || []);
      setTransactions(txRes.data || []);
    } catch (err) {
      console.error("Error fetching partner data:", err);
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      const now = new Date();
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(now.getDate() - (6 - i));
        return {
          date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
          revenue: Math.floor(Math.random() * 8000) + 2000,
          isMock: true
        };
      });
    }
    
    const days: Record<string, { date: string, revenue: number, isMock: boolean }> = {};
    const now = new Date();
    const timeframeDays = chartTimeframe === "7d" ? 7 : chartTimeframe === "30d" ? 30 : 365;

    for (let i = timeframeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days[key] = { date: d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), revenue: 0, isMock: false };
    }

    transactions.forEach(t => {
      const key = new Date(t.created_at).toISOString().split('T')[0];
      if (days[key]) {
        days[key].revenue += t.seller_payout || 0;
      }
    });

    return Object.values(days);
  }, [transactions, chartTimeframe]);

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  const totalRevenue = transactions.reduce((s, t) => s + (t.seller_payout || 0), 0);
  const activeOrders = partnerOrders.filter(o => ["pending", "paid", "preparing"].includes(o.status)).length;
  const lowStockCount = sourcingProducts.filter(p => (p.stock || 0) < 3).length;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-4">
        <div className="space-y-1">
          <h1 className="font-display text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            Console <span className="text-primary italic">Sourcing</span>
          </h1>
          <p className="text-slate-400 font-medium text-lg leading-tight uppercase tracking-widest text-[10px]">Gestion <span className="text-secondary font-black">Elite</span> de vos revenus sourcing</p>
        </div>
        <div className="rounded-[2.5rem] bg-white px-8 py-6 shadow-premium border-none flex items-center gap-6 group transition-all hover:scale-105 active:scale-95 cursor-pointer">
          <div className="h-16 w-16 rounded-[1.5rem] bg-primary shadow-xl shadow-primary/20 flex items-center justify-center text-white transition-transform group-hover:rotate-12">
            <TrendingUp className="h-8 w-8" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] leading-none mb-2 italic">Taux de Markup</p>
            <p className="text-3xl font-display font-black text-primary leading-none tracking-tighter">+{markupPercent}%</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <StatCard icon={Wallet} label="Total Gagné" value={formatCFA(totalRevenue)} color="bg-primary" />
        <StatCard icon={ShoppingCart} label="Ventes" value={partnerOrders.length} color="bg-secondary" suffix="total" />
        <StatCard icon={Package} label="Articles" value={sourcingProducts.length} color="bg-slate-900" />
        <StatCard icon={lowStockCount > 0 ? AlertTriangle : ShieldCheck} label={lowStockCount > 0 ? "Besoin de Stock" : "Statut Stock"} value={lowStockCount} color={lowStockCount > 0 ? "bg-destructive" : "bg-accent"} suffix={lowStockCount > 0 ? "critiques" : "OK"} />
      </div>

      <Card className="border-none shadow-premium rounded-[3rem] bg-white overflow-hidden relative">
        <div className="absolute top-0 right-0 h-40 w-40 bg-primary/5 rounded-full -mr-20 -mt-20 blur-2xl" />
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-8 pt-10 px-10 gap-6 relative z-10 transition-all">
          <div className="space-y-1">
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2 italic">Analyse Sourcing</h3>
            <CardTitle className="text-4xl font-display font-black text-slate-900 tracking-tighter">Performance Royale</CardTitle>
            <CardDescription className="text-slate-400 font-medium uppercase tracking-widest text-[9px] mt-1">Sourcing & Gains Partenaires</CardDescription>
          </div>
          <Select value={chartTimeframe} onValueChange={setChartTimeframe}>
            <SelectTrigger className="w-[180px] rounded-full bg-slate-50 border-none h-14 font-black text-[10px] uppercase tracking-widest px-6 shadow-inner transition-all hover:bg-slate-100 active:scale-95">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-[2rem] border-none shadow-3xl p-2">
              <SelectItem value="7d" className="font-bold rounded-xl">7 derniers jours</SelectItem>
              <SelectItem value="30d" className="font-bold rounded-xl">30 derniers jours</SelectItem>
              <SelectItem value="365d" className="font-bold rounded-xl">Année fiscale</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pb-10 pt-4 px-4 md:px-10 relative z-10">
          <div className="h-[400px] w-full relative">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6D28D9" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6D28D9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#FAFAFA" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em' }} dy={15} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748B', fontWeight: 900 }} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', fontWeight: '900', padding: '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}
                  itemStyle={{ color: '#6D28D9' }}
                  labelStyle={{ color: '#94A3B8', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.15em' }}
                  formatter={(value: any) => [formatCFA(value), "Gain Net"]}
                />
                <Area 
                  type="natural" 
                  dataKey="revenue" 
                  stroke="#6D28D9" 
                  strokeWidth={5}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
            {chartData[0]?.isMock && (
              <div className="absolute inset-x-0 bottom-1/2 flex items-center justify-center pointer-events-none">
                <p className="bg-white/80 backdrop-blur-md px-8 py-3 rounded-full text-[10px] text-slate-300 font-black uppercase tracking-[0.4em] shadow-sm italic">Sourcing Demo Mode</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Partner Tabs */}
      <Tabs defaultValue="inventory" className="w-full">
        <div className="scrollbar-hide overflow-x-auto pb-8">
          <TabsList className="bg-slate-100/50 backdrop-blur-xl rounded-full p-2 gap-2 shadow-inner inline-flex w-auto">
            <TabsTrigger value="inventory" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-primary px-10 font-black uppercase text-[10px] tracking-[0.2em] h-12 transition-all">
              <Package className="h-4 w-4 mr-2" /> Inventaire
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-2xl data-[state=active]:text-primary px-10 font-black uppercase text-[10px] tracking-[0.2em] h-12 transition-all">
              <ShoppingCart className="h-4 w-4 mr-2" /> Ventes ({activeOrders})
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-8">
            
            <TabsContent value="inventory">
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {sourcingProducts.length === 0 ? (
                  <div className="col-span-full py-32 text-center rounded-[3rem] bg-white border-2 border-dashed border-slate-100 shadow-premium">
                    <p className="text-slate-300 font-black uppercase tracking-[0.4em] italic">Zéro article sourcing</p>
                  </div>
                ) : sourcingProducts.map(p => (
                  <Card key={p.id} className="border-none shadow-premium rounded-[3rem] bg-white overflow-hidden group transition-all hover:scale-[1.03] hover:shadow-3xl">
                    <div className="relative aspect-[4/5] overflow-hidden">
                       <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                       <div className="absolute top-6 right-6 flex flex-col gap-3 items-end">
                         <Badge className={cn("text-[10px] border-none font-black uppercase px-5 h-8 rounded-full shadow-lg tracking-widest", p.is_approved ? "bg-secondary text-white" : "bg-white/90 backdrop-blur-md text-slate-900")}>
                           {p.is_approved ? "Validé ✅" : "Validation en cours"}
                         </Badge>
                         {p.stock < 3 && <Badge className="bg-destructive text-white border-none text-[9px] px-4 h-7 font-black rounded-full shadow-lg animate-pulse uppercase tracking-widest">Stock Critique</Badge>}
                       </div>
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-8">
                      <div className="mb-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{p.category}</p>
                        <h4 className="font-display font-black text-2xl text-slate-900 tracking-tight leading-tight group-hover:text-primary transition-colors">{p.name}</h4>
                      </div>
                      <div className="flex justify-between items-end bg-slate-50/50 rounded-[2rem] p-6 shadow-inner transition-colors group-hover:bg-slate-50">
                        <div>
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-2 italic">Coût Pack</p>
                           <p className="text-sm font-bold text-slate-500 line-through opacity-60">{formatCFA(p.supplier_price || 0)}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] leading-none mb-2 font-display">Prix Marché</p>
                           <p className="text-3xl font-display font-black text-slate-900 tracking-tighter leading-none">{formatCFA(p.price)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="border-none shadow-premium rounded-[3rem] overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-slate-50/50 border-none">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] pl-10 h-16">ID Sourcing</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] h-16">Article Elite</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-right h-16">Gain Partner</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-center h-16">Statut de la Vente</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-right pr-10 h-16">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerOrders.length === 0 ? (
                       <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="text-center py-32 text-slate-300 uppercase font-black text-xs tracking-[0.5em] italic">Zéro vente sourcing enregistrée</TableCell></TableRow>
                    ) : partnerOrders.map(o => (
                      <TableRow key={o.id} className="border-b-slate-50 transition-colors hover:bg-slate-50/30">
                        <TableCell className="pl-10 py-8">
                          <Badge variant="outline" className="font-mono text-[10px] font-black rounded-lg border-slate-100 bg-white shadow-sm px-3 h-8">#{o.order_number}</Badge>
                        </TableCell>
                        <TableCell className="py-8">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">{o.items?.[0]?.category || "Sourcing"}</span>
                            <span className="text-sm font-display font-black text-slate-900 uppercase">
                              {o.items?.[0]?.name || "Article Sourcing"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-8">
                           <span className="text-xl font-display font-black text-secondary tracking-tighter">{formatCFA(Math.round(o.total * (markupPercent / 100)))}</span>
                        </TableCell>
                        <TableCell className="text-center py-8">
                          <Badge className={cn("text-[10px] font-black uppercase border-none px-6 h-9 rounded-full shadow-md tracking-widest", statusColors[o.status])}>
                             {statusLabels[o.status] || o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-slate-400 font-black text-right pr-10 py-8 uppercase tracking-widest italic opacity-60">
                          <div className="flex items-center justify-end gap-2"><Calendar className="h-4 w-4" /> {new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </TabsContent>
          </motion.div>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, suffix }: any) {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className={cn("flex flex-col items-center justify-center rounded-[3rem] p-10 text-center text-white shadow-2xl relative overflow-hidden group border-none", color)}
    >
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="mb-6 h-16 w-16 rounded-[1.8rem] bg-white/20 backdrop-blur-md flex items-center justify-center relative z-10 shadow-lg transition-transform group-hover:scale-110">
        <Icon className="h-8 w-8" />
      </div>
      <span className="text-3xl font-display font-black leading-none mb-3 tracking-tighter relative z-10">{value}</span>
      <p className="text-[10px] uppercase font-black tracking-[0.3em] opacity-70 relative z-10 italic">{label} {suffix && <span className="opacity-50">• {suffix}</span>}</p>
    </motion.div>
  );
}
