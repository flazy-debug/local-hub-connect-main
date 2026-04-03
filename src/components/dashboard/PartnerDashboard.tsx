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

const statusLabels: Record<string, string> = {
  pending: "En attente", paid: "Payé", preparing: "Prêt",
  shipped: "Expédié", delivered: "Livré", completed: "Terminé",
};
const statusColors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground", paid: "bg-info/10 text-info",
  preparing: "bg-warning/10 text-warning", shipped: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success", completed: "bg-success/10 text-success",
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
      // Données de factices pour un nouveau dashboard partenaire
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
      {/* Sourcing Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-black text-primary uppercase tracking-tighter">
            Console <span className="text-success">Sourcing</span>
          </h1>
          <p className="text-sm text-muted-foreground font-medium">Gestion exclusive de vos produits et revenus partenaires</p>
        </div>
        <div className="rounded-[24px] bg-success/10 px-6 py-3 border border-success/20 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-success flex items-center justify-center text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-black text-success uppercase tracking-[0.2em] leading-none mb-1">Taux de Markup</p>
            <p className="text-xl font-black text-primary leading-none">+{markupPercent}%</p>
          </div>
        </div>
      </div>

      {/* Sourcing Stats */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <StatCard icon={Wallet} label="Total Gagné" value={formatCFA(totalRevenue)} color="bg-primary shadow-primary/20" />
        <StatCard icon={ShoppingCart} label="Ventes" value={partnerOrders.length} color="bg-success shadow-success/20" suffix="total" />
        <StatCard icon={Package} label="Articles" value={sourcingProducts.length} color="bg-accent shadow-accent/20" />
        <StatCard icon={lowStockCount > 0 ? AlertTriangle : ShieldCheck} label={lowStockCount > 0 ? "Besoin de Stock" : "Statut Stock"} value={lowStockCount} color={lowStockCount > 0 ? "bg-destructive shadow-destructive/20" : "bg-slate-800 shadow-slate-900/20"} suffix={lowStockCount > 0 ? "critiques" : "OK"} />
      </div>

      {/* Performance Chart */}
      <Card className="border-none shadow-premium rounded-[32px] bg-white overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-xl font-black text-primary uppercase tracking-tighter">Performance Sourcing</CardTitle>
            <CardDescription>Évolution de vos gains partenaires</CardDescription>
          </div>
          <Select value={chartTimeframe} onValueChange={setChartTimeframe}>
            <SelectTrigger className="w-[120px] rounded-full bg-slate-50 border-none h-10 font-bold text-xs focus:ring-success">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-xl">
              <SelectItem value="7d">7 jours</SelectItem>
              <SelectItem value="30d">30 jours</SelectItem>
              <SelectItem value="365d">Année</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="pt-4 px-2 md:px-6">
          <div className="h-[350px] w-full relative">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888888', fontWeight: 600 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#888888', fontWeight: 600 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                  formatter={(value: any) => [formatCFA(value), "Gain"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#22C55E" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
            {chartData[0]?.isMock && (
              <p className="text-[10px] text-center text-muted-foreground mt-4 font-bold uppercase tracking-widest opacity-50">Démonstration Epuremarket (En attente de vos premiers gains)</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Partner Tabs */}
      <Tabs defaultValue="inventory" className="w-full">
        <div className="scrollbar-hide overflow-x-auto pb-2">
          <TabsList className="bg-slate-100 rounded-full p-1 gap-1">
            <TabsTrigger value="inventory" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 font-black uppercase text-[10px] tracking-widest h-10">
              <Package className="h-3.5 w-3.5 mr-2" /> Inventaire
            </TabsTrigger>
            <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-white data-[state=active]:shadow-sm px-8 font-black uppercase text-[10px] tracking-widest h-10">
              <ShoppingCart className="h-3.5 w-3.5 mr-2" /> Ventes ({activeOrders})
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-8">
            
            <TabsContent value="inventory">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {sourcingProducts.length === 0 ? (
                  <div className="col-span-full py-20 text-center rounded-[40px] bg-slate-50 border-2 border-dashed border-slate-200">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Aucun produit sourcing</p>
                  </div>
                ) : sourcingProducts.map(p => (
                  <Card key={p.id} className="border-none shadow-premium rounded-[32px] bg-white overflow-hidden group transition-all hover:scale-[1.02]">
                    <div className="relative aspect-video">
                       <img src={p.images?.[0]} alt={p.name} className="h-full w-full object-cover" />
                       <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                         <Badge className={cn("text-[9px] border-none font-black uppercase px-3 h-6 rounded-full", p.is_approved ? "bg-success text-white" : "bg-warning text-warning-foreground")}>
                           {p.is_approved ? "Validé" : "En attente"}
                         </Badge>
                         {p.stock < 3 && <Badge className="bg-destructive text-white border-none text-[8px] px-2 font-black h-5 rounded-full">STOCK BAS</Badge>}
                       </div>
                    </div>
                    <div className="p-6">
                      <h4 className="font-black text-sm text-primary uppercase truncate">{p.name}</h4>
                      <div className="mt-4 flex justify-between items-end border-t pt-4">
                        <div>
                           <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1">Coût Sourcing</p>
                           <p className="text-sm font-bold text-slate-400">{formatCFA(p.supplier_price || 0)}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-success uppercase tracking-widest leading-none mb-1">Prix Client</p>
                           <p className="text-xl font-black text-primary">{formatCFA(p.price)}</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <Card className="border-none shadow-premium rounded-[40px] overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="border-none">
                      <TableHead className="font-black text-[10px] uppercase tracking-widest pl-8">ID Vente</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest">Article</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-right">Gain Partner</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-center">Statut</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest text-right pr-8">Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {partnerOrders.length === 0 ? (
                       <TableRow><TableCell colSpan={5} className="text-center py-20 text-slate-300 uppercase font-black text-sm tracking-widest">Aucune vente enregistrée</TableCell></TableRow>
                    ) : partnerOrders.map(o => (
                      <TableRow key={o.id} className="border-b-slate-50 transition-colors">
                        <TableCell className="pl-8">
                          <Badge variant="outline" className="font-mono text-[10px] font-bold rounded-lg border-slate-100">#{o.order_number}</Badge>
                        </TableCell>
                        <TableCell className="text-xs font-black text-primary uppercase">
                          {o.items?.[0]?.name || "Article Sourcing"}
                        </TableCell>
                        <TableCell className="text-right">
                           <span className="text-sm font-black text-success">{formatCFA(Math.round(o.total * (markupPercent / 100)))}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn("text-[9px] font-black uppercase border-none px-3 h-6 rounded-full", statusColors[o.status])}>
                             {statusLabels[o.status] || o.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-bold text-right pr-8">
                          <div className="flex items-center justify-end gap-1.5"><Calendar className="h-3 w-3" /> {new Date(o.created_at).toLocaleDateString()}</div>
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
