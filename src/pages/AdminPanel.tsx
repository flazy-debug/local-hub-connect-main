import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Package, AlertTriangle, Ban, CheckCircle, Eye, RefreshCw, MessageSquare, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCFA } from "@/lib/mock-data";
import PageTransition from "@/components/PageTransition";

export default function AdminPanel() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sellers, setSellers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [detailProduct, setDetailProduct] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && user && !isAdmin) { navigate("/"); return; }
    if (user && isAdmin) fetchAll();
  }, [user, isAdmin, authLoading]);

  const fetchAll = async () => {
    try {
      setLoadingData(true);
      const [sellersRes, prodsRes, txRes, ordRes, dispRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("disputes").select("*").order("created_at", { ascending: false }),
      ]);
      setSellers(sellersRes.data || []);
      setProducts(prodsRes.data || []);
      setTransactions(txRes.data || []);
      setOrders(ordRes.data || []);
      setDisputes(dispRes.data || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const toggleProduct = async (id: string, currentActive: boolean) => {
    const { error } = await supabase.from("products").update({ is_active: !currentActive }).eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: currentActive ? "Produit désactivé" : "Produit réactivé" }); fetchAll(); }
  };

  const updateTxStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("transactions").update({ status }).eq("id", id);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else { toast({ title: "Transaction mise à jour" }); fetchAll(); }
  };

  // Stats
  const totalSellers = sellers.filter(s => s.shop_name).length;
  const activeProducts = products.filter(p => p.is_active).length;
  const disputedTx = transactions.filter(t => t.status === "escrow").length;
  const totalRevenue = transactions.filter(t => t.status === "completed").reduce((s, t) => s + t.commission_fee, 0);
  const openDisputes = disputes.filter(d => d.status === "open").length;

  if (authLoading || loadingData) {
    return <div className="flex min-h-[60vh] items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-secondary/30 py-8">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold">Panel Administrateur</h1>
                <p className="text-sm text-muted-foreground">Gestion vendeurs, produits & litiges</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchAll} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Rafraîchir
            </Button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard icon={Users} label="Vendeurs" value={totalSellers} color="text-info" bg="bg-info/10" />
            <StatCard icon={Package} label="Produits actifs" value={activeProducts} color="text-accent" bg="bg-accent/10" />
            <StatCard icon={AlertTriangle} label="En séquestre" value={disputedTx} color="text-warning" bg="bg-warning/10" />
            <StatCard icon={CheckCircle} label="Commissions gagnées" value={formatCFA(totalRevenue)} color="text-success" bg="bg-success/10" />
          </div>

          <Tabs defaultValue="sellers">
            <TabsList className="flex-wrap">
              <TabsTrigger value="sellers">Vendeurs ({totalSellers})</TabsTrigger>
              <TabsTrigger value="products">Produits ({products.length})</TabsTrigger>
              <TabsTrigger value="disputes" className="gap-1"><MessageSquare className="h-3.5 w-3.5" /> Litiges ({openDisputes})</TabsTrigger>
              <TabsTrigger value="transactions">Transactions ({transactions.length})</TabsTrigger>
              <TabsTrigger value="orders">Commandes ({orders.length})</TabsTrigger>
            </TabsList>

            {/* Sellers Tab */}
            <TabsContent value="sellers" className="mt-4">
              <div className="grid gap-4">
                {sellers.filter(s => s.shop_name).map(s => (
                  <Card key={s.id} className="overflow-hidden border-none shadow-premium rounded-2xl bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                            {s.shop_name?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm">{s.shop_name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.display_name}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] bg-secondary/30">{s.neighborhood || "—"}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                        <div className="space-y-1">
                          <p className="text-muted-foreground uppercase tracking-widest text-[9px]">WhatsApp</p>
                          <p className="font-mono font-medium">{s.whatsapp_number || "—"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground uppercase tracking-widest text-[9px]">Inscrit le</p>
                          <p className="font-medium">{new Date(s.created_at).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>

                      <div className="pt-3 border-t flex flex-col gap-2">
                        <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Statut de vérification</p>
                        <Select
                          value={(s as any).verification_status || "none"}
                          onValueChange={async (val) => {
                            await supabase.from("profiles").update({ verification_status: val }).eq("id", s.id);
                            toast({ title: "Vérification mise à jour" });
                            fetchAll();
                          }}
                        >
                          <SelectTrigger className="w-full h-10 rounded-xl bg-background/50"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucun</SelectItem>
                            <SelectItem value="verified">Vérifié</SelectItem>
                            <SelectItem value="pro">PRO</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {sellers.filter(s => s.shop_name).length === 0 && (
                  <div className="text-center text-muted-foreground py-12">Aucun vendeur inscrit</div>
                )}
              </div>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="mt-4">
              <div className="grid gap-4">
                {products.map(p => (
                  <Card key={p.id} className="overflow-hidden border-none shadow-premium rounded-2xl bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-3">
                      <div className="flex gap-4">
                        <div className="h-20 w-20 rounded-xl bg-muted overflow-hidden shrink-0">
                          <img src={p.images?.[0] || "/placeholder.svg"} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="font-bold text-sm truncate">{p.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-primary font-bold text-base">{formatCFA(p.price)}</span>
                              <Badge variant="outline" className="text-[9px] py-0 h-4">{p.neighborhood}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <Badge className={p.is_active ? "bg-success/10 text-success text-[9px] h-5" : "bg-destructive/10 text-destructive text-[9px] h-5"}>
                              {p.is_active ? "Actif" : "Désactivé"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setDetailProduct(p)}>
                            <Eye className="h-4 w-4 text-primary" />
                          </Button>
                          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl" onClick={() => toggleProduct(p.id, p.is_active)}>
                            <Ban className={`h-4 w-4 ${p.is_active ? "text-destructive" : "text-success"}`} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {products.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">Aucun produit</div>
                )}
              </div>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes" className="mt-4">
              <div className="grid gap-4">
                {disputes.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <MessageSquare className="mx-auto h-12 w-12 opacity-30" />
                    <p className="mt-3">Aucun litige signalé</p>
                  </div>
                ) : (
                  disputes.map(d => {
                    const order = orders.find(o => o.id === d.order_id);
                    return (
                      <Card key={d.id} className="overflow-hidden border-none shadow-premium rounded-2xl bg-white/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-3">
                            <Badge variant="outline" className="text-[10px] font-mono">{order?.order_number || d.order_id.slice(0, 8)}</Badge>
                            <Badge className={d.status === "open" ? "bg-destructive/10 text-destructive text-[10px]" : "bg-success/10 text-success text-[10px]"}>
                              {d.status === "open" ? "Ouvert" : "Résolu"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{d.reason}</p>
                          <div className="flex items-center justify-between pt-3 border-t">
                            <span className="text-[10px] text-muted-foreground">{new Date(d.created_at).toLocaleDateString("fr-FR")}</span>
                            {d.status === "open" && (
                              <Button size="sm" variant="outline" className="h-8 rounded-lg px-4 text-[11px]" onClick={async () => {
                                await supabase.from("disputes").update({ status: "resolved" }).eq("id", d.id);
                                toast({ title: "Litige résolu" }); fetchAll();
                              }}>Résoudre</Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="mt-4">
              <div className="grid gap-4">
                {transactions.map(t => (
                  <Card key={t.id} className="overflow-hidden border-none shadow-premium rounded-2xl bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Transaction</p>
                          <p className="text-base font-bold text-primary">{formatCFA(t.amount_total)}</p>
                        </div>
                        <Badge className={
                          t.status === "completed" ? "bg-success/10 text-success text-[10px]" :
                          t.status === "escrow" ? "bg-warning/10 text-warning text-[10px]" : "text-[10px]"
                        }>
                          {t.status === "completed" ? "Complété" : t.status === "escrow" ? "Séquestre" : t.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-[10px] mb-4 bg-secondary/20 p-3 rounded-xl">
                        <div>
                          <p className="text-muted-foreground">Commission</p>
                          <p className="font-bold text-destructive">{formatCFA(t.commission_fee)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Part Vendeur</p>
                          <p className="font-bold text-success">{formatCFA(t.seller_payout)}</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("fr-FR")}</span>
                        {t.status === "escrow" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="h-8 rounded-lg text-success text-[10px] px-3" onClick={() => updateTxStatus(t.id, "completed")}>Libérer</Button>
                            <Button size="sm" variant="outline" className="h-8 rounded-lg text-destructive text-[10px] px-3" onClick={() => updateTxStatus(t.id, "refunded")}>Rembourser</Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {transactions.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">Aucune transaction</div>
                )}
              </div>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="mt-4">
              <div className="grid gap-4">
                {orders.map(o => (
                  <Card key={o.id} className="overflow-hidden border-none shadow-premium rounded-2xl bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="space-y-1">
                          <p className="text-[10px] font-mono text-muted-foreground uppercase">{o.order_number}</p>
                          <h4 className="font-bold text-sm">{o.buyer_name}</h4>
                        </div>
                        <Badge variant="outline" className="text-[10px] rounded-full">{o.status}</Badge>
                      </div>
                      <div className="flex items-center justify-between py-2 border-t border-b border-dashed my-3">
                        <span className="text-xs text-muted-foreground">Total Commande</span>
                        <span className="text-sm font-bold text-accent">{formatCFA(o.total)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          <span>{o.delivery_method === "delivery" ? "Livraison" : "Retrait"}</span>
                        </div>
                        <span>{new Date(o.created_at).toLocaleDateString("fr-FR")}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {orders.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">Aucune commande</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Product Detail Dialog */}
        <Dialog open={!!detailProduct} onOpenChange={(o) => { if (!o) setDetailProduct(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Détail produit</DialogTitle>
            </DialogHeader>
            {detailProduct && (
              <div className="space-y-3">
                <img src={detailProduct.images?.[0] || "/placeholder.svg"} alt="" className="aspect-square w-full rounded-xl object-cover" />
                <h3 className="font-display text-lg font-bold">{detailProduct.name}</h3>
                <p className="text-sm text-muted-foreground">{detailProduct.description}</p>
                <div className="flex gap-2 text-sm">
                  <Badge>{formatCFA(detailProduct.price)}</Badge>
                  <Badge variant="outline">{detailProduct.condition === "neuf" ? "Neuf" : "Occasion"}</Badge>
                  <Badge variant="outline">{detailProduct.neighborhood}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">Stock: {detailProduct.stock} • ID: {detailProduct.id.slice(0, 8)}</p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => { toggleProduct(detailProduct.id, detailProduct.is_active); setDetailProduct(null); }}
                >
                  {detailProduct.is_active ? "Désactiver ce produit" : "Réactiver ce produit"}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }: { icon: any; label: string; value: any; color: string; bg: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="font-display text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
