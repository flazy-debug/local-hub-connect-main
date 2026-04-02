import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Users, Package, AlertTriangle, Ban, CheckCircle, Eye, RefreshCw, MessageSquare } from "lucide-react";
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
    setLoadingData(false);
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
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nom / Boutique</TableHead>
                        <TableHead>Quartier</TableHead>
                        <TableHead>WhatsApp</TableHead>
                        <TableHead>Inscrit le</TableHead>
                        <TableHead>Badge</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sellers.filter(s => s.shop_name).map(s => (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{s.shop_name}</p>
                              <p className="text-xs text-muted-foreground">{s.display_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{s.neighborhood || "—"}</TableCell>
                          <TableCell className="font-mono text-sm">{s.whatsapp_number || "—"}</TableCell>
                          <TableCell>{new Date(s.created_at).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell>
                            <Select
                              value={(s as any).verification_status || "none"}
                              onValueChange={async (val) => {
                                await supabase.from("profiles").update({ verification_status: val }).eq("id", s.id);
                                toast({ title: "Vérification mise à jour" });
                                fetchAll();
                              }}
                            >
                              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Aucun</SelectItem>
                                <SelectItem value="verified">Vérifié</SelectItem>
                                <SelectItem value="pro">PRO</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                      {sellers.filter(s => s.shop_name).length === 0 && (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Aucun vendeur inscrit</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Products Tab */}
            <TabsContent value="products" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produit</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Quartier</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map(p => (
                        <TableRow key={p.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <img src={p.images?.[0] || "/placeholder.svg"} alt="" className="h-10 w-10 rounded-lg object-cover" />
                              <span className="font-medium">{p.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatCFA(p.price)}</TableCell>
                          <TableCell>{p.neighborhood}</TableCell>
                          <TableCell>
                            <Badge className={p.is_active ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}>
                              {p.is_active ? "Actif" : "Désactivé"}
                            </Badge>
                          </TableCell>
                          <TableCell className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setDetailProduct(p)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => toggleProduct(p.id, p.is_active)}>
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Disputes Tab */}
            <TabsContent value="disputes" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  {disputes.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground"><MessageSquare className="mx-auto h-12 w-12 opacity-30" /><p className="mt-3">Aucun litige signalé</p></div>
                  ) : (
                    <Table>
                      <TableHeader><TableRow>
                        <TableHead>Date</TableHead><TableHead>Commande</TableHead><TableHead>Raison</TableHead><TableHead>Statut</TableHead><TableHead>Action</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {disputes.map(d => {
                          const order = orders.find(o => o.id === d.order_id);
                          return (
                            <TableRow key={d.id}>
                              <TableCell>{new Date(d.created_at).toLocaleDateString("fr-FR")}</TableCell>
                              <TableCell className="font-mono text-sm">{order?.order_number || d.order_id.slice(0, 8)}</TableCell>
                              <TableCell className="max-w-[200px] truncate">{d.reason}</TableCell>
                              <TableCell>
                                <Badge className={d.status === "open" ? "bg-destructive/10 text-destructive" : d.status === "resolved" ? "bg-success/10 text-success" : ""}>
                                  {d.status === "open" ? "Ouvert" : d.status === "resolved" ? "Résolu" : d.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {d.status === "open" && (
                                  <Button size="sm" variant="outline" onClick={async () => {
                                    await supabase.from("disputes").update({ status: "resolved" }).eq("id", d.id);
                                    toast({ title: "Litige résolu" }); fetchAll();
                                  }}>Résoudre</Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Commission</TableHead>
                        <TableHead>Part vendeur</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(t => (
                        <TableRow key={t.id}>
                          <TableCell>{new Date(t.created_at).toLocaleDateString("fr-FR")}</TableCell>
                          <TableCell>{formatCFA(t.amount_total)}</TableCell>
                          <TableCell>{formatCFA(t.commission_fee)}</TableCell>
                          <TableCell>{formatCFA(t.seller_payout)}</TableCell>
                          <TableCell>
                            <Badge className={
                              t.status === "completed" ? "bg-success/10 text-success" :
                              t.status === "escrow" ? "bg-warning/10 text-warning" :
                              t.status === "refunded" ? "bg-destructive/10 text-destructive" : ""
                            }>
                              {t.status === "completed" ? "Complété" : t.status === "escrow" ? "Séquestre" : t.status === "refunded" ? "Remboursé" : t.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {t.status === "escrow" && (
                              <div className="flex gap-1">
                                <Button size="sm" variant="outline" className="text-success" onClick={() => updateTxStatus(t.id, "completed")}>
                                  Libérer
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive" onClick={() => updateTxStatus(t.id, "refunded")}>
                                  Rembourser
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {transactions.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune transaction</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>N°</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Livraison</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orders.map(o => (
                        <TableRow key={o.id}>
                          <TableCell className="font-mono text-sm">{o.order_number}</TableCell>
                          <TableCell>{o.buyer_name}</TableCell>
                          <TableCell>{formatCFA(o.total)}</TableCell>
                          <TableCell>{o.delivery_method === "delivery" ? "Livraison" : "Retrait"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{o.status}</Badge>
                          </TableCell>
                          <TableCell>{new Date(o.created_at).toLocaleDateString("fr-FR")}</TableCell>
                        </TableRow>
                      ))}
                      {orders.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucune commande</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
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
