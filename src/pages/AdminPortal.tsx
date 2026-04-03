import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3, Users, AlertTriangle, Receipt, Store, Shield,
  ChevronRight, RefreshCw, Crown, Ban, MessageCircle, Clock,
  TrendingUp, ShoppingBag, AlertCircle, Phone, MapPin, XCircle, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatCFA, generateWhatsAppLink } from "@/lib/mock-data";
import PageTransition from "@/components/PageTransition";

type Section = "stats" | "shops" | "partners" | "pro" | "commissions" | "disputes";

const navItems: { id: Section; label: string; icon: any }[] = [
  { id: "stats", label: "Statistiques", icon: BarChart3 },
  { id: "shops", label: "Boutiques", icon: Store },
  { id: "partners", label: "Partenaires", icon: Users },
  { id: "pro", label: "Forfaits PRO", icon: Crown },
  { id: "commissions", label: "Commissions", icon: Receipt },
  { id: "disputes", label: "Litiges", icon: AlertTriangle },
];

function AdminSidebar({ active, onNavigate }: { active: Section; onNavigate: (s: Section) => void }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Shield className="mr-2 h-4 w-4" />
            {!collapsed && "Administration"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onNavigate(item.id)}
                    className={active === item.id ? "bg-accent/10 text-accent font-medium" : "hover:bg-muted/50"}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default function AdminPortal() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [section, setSection] = useState<Section>("stats");
  const [sellers, setSellers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [disputeDialog, setDisputeDialog] = useState<any>(null);
  const [editingPartner, setEditingPartner] = useState<any>(null);
  const [markupValue, setMarkupValue] = useState("");

  useEffect(() => {
    if (!authLoading && !user) { navigate("/auth"); return; }
    if (!authLoading && user && !isAdmin) { navigate("/"); toast.error("Accès réservé aux administrateurs"); return; }
    if (user && isAdmin) fetchAll();
  }, [user, isAdmin, authLoading]);

  const fetchAll = async () => {
    try {
      setLoadingData(true);
      const [sellersRes, txRes, ordRes, dispRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("disputes").select("*").order("created_at", { ascending: false }),
      ]);
      setSellers(sellersRes.data || []);
      setTransactions(txRes.data || []);
      setOrders(ordRes.data || []);
      setDisputes(dispRes.data || []);
    } catch (error) {
      console.error("Error fetching admin data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  if (authLoading || loadingData) {
    return <div className="flex min-h-screen items-center justify-center"><p className="text-muted-foreground">Chargement...</p></div>;
  }

  const shops = sellers.filter(s => s.shop_name);
  const proShops = shops.filter(s => s.subscription_type === "monthly_flat");
  const commShops = shops.filter(s => s.subscription_type !== "monthly_flat");
  const openDisputes = disputes.filter(d => d.status === "open");
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthlyOrders = orders.filter(o => new Date(o.created_at) >= monthStart);
  const monthlyTx = transactions.filter(t => new Date(t.created_at) >= monthStart);
  const monthlyRevenue = monthlyTx.reduce((s, t) => s + (t.commission_fee || 0), 0) + proShops.length * 5000;

  const getProStatus = (seller: any) => {
    if (seller.subscription_type !== "monthly_flat") return null;
    if (!seller.pro_expires_at) return "active";
    const exp = new Date(seller.pro_expires_at);
    const daysLeft = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) return "expired";
    if (daysLeft <= 3) return "expiring";
    return "active";
  };

  const handleSetPro = async (userId: string) => {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    await supabase.from("profiles").update({
      subscription_type: "monthly_flat",
      pro_expires_at: expiresAt.toISOString(),
    }).eq("user_id", userId);
    toast.success("Boutique passée en PRO !");
    fetchAll();
  };

  const handleSuspend = async (userId: string) => {
    await supabase.from("products").update({ is_active: false }).eq("seller_id", userId);
    toast.success("Boutique suspendue — produits masqués");
    fetchAll();
  };

  const handleRenewReminder = (seller: any) => {
    const phone = seller.whatsapp_number || seller.phone;
    if (!phone) { toast.error("Aucun numéro trouvé"); return; }
    const msg = `Bonjour ${seller.shop_name || seller.display_name} ! Votre forfait PRO sur VoiketMarket expire bientôt. Renouvelez pour garder votre visibilité prioritaire et le badge PRO. Contactez-nous pour le paiement de 5 000 CFA.`;
    window.open(`https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleResolveDispute = async (disputeId: string) => {
    await supabase.from("disputes").update({
      status: "resolved",
      admin_response: adminResponse,
    }).eq("id", disputeId);
    toast.success("Litige résolu");
    setDisputeDialog(null);
    setAdminResponse("");
    fetchAll();
  };

  const handlePromotePartner = async (userId: string) => {
    await supabase.from("profiles").update({
      subscription_type: "PARTNER",
      partner_markup_percent: 15, // Default 15%
    }).eq("user_id", userId);
    toast.success("Utilisateur promu Partenaire !");
    fetchAll();
  };

  const handleUpdateMarkup = async () => {
    if (!editingPartner) return;
    const val = parseFloat(markupValue);
    if (isNaN(val)) return toast.error("Valeur invalide");

    await supabase.from("profiles").update({
      partner_markup_percent: val
    }).eq("user_id", editingPartner.user_id);
    
    toast.success("Markup mis à jour");
    setEditingPartner(null);
    fetchAll();
  };

  const partners = sellers.filter(s => s.subscription_type === "PARTNER");
  const candidates = sellers.filter(s => s.subscription_type !== "PARTNER");

  return (
    <PageTransition>
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AdminSidebar active={section} onNavigate={setSection} />
          <div className="flex-1 flex flex-col">
            <header className="flex h-14 items-center gap-3 border-b px-4">
              <SidebarTrigger />
              <Shield className="h-5 w-5 text-accent" />
              <h1 className="font-display text-lg font-bold">Portail Admin</h1>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={fetchAll}>
                <RefreshCw className="mr-1 h-4 w-4" /> Actualiser
              </Button>
            </header>

            <main className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
              {/* STATS */}
              {section === "stats" && (
                <>
                  <h2 className="font-display text-xl font-bold">Statistiques Globales</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">CA Mensuel</CardTitle>
                        <TrendingUp className="h-4 w-4 text-success" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-accent">{formatCFA(monthlyRevenue)}</p>
                        <p className="text-xs text-muted-foreground mt-1">Forfaits PRO + Commissions</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Boutiques</CardTitle>
                        <Store className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{shops.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-accent font-medium">{proShops.length} PRO</span> · {commShops.length} Commission
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Ventes (mois)</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-primary" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{monthlyOrders.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Commandes traitées</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Litiges</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-destructive">{openDisputes.length}</p>
                        <p className="text-xs text-muted-foreground mt-1">Signalements en cours</p>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* SHOPS */}
              {section === "shops" && (
                <>
                  <h2 className="font-display text-xl font-bold">Gestion des Boutiques</h2>
                  <div className="grid gap-4">
                    {shops.map((s) => {
                      const status = getProStatus(s);
                      return (
                        <Card key={s.id} className="overflow-hidden border-none shadow-premium rounded-2xl bg-white/50 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                  {s.shop_name?.[0].toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-sm">{s.shop_name || s.display_name}</h4>
                                  <p className="text-[10px] text-muted-foreground uppercase">{s.neighborhood || "N/A"}</p>
                                </div>
                              </div>
                              {s.subscription_type === "monthly_flat" ? (
                                <Badge className="bg-accent text-accent-foreground text-[10px]">PRO</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[10px]">10% Comm.</Badge>
                              )}
                            </div>
                            
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center gap-2 text-xs">
                                <Phone className="h-3 w-3 text-muted-foreground" />
                                <span className="font-mono">{s.whatsapp_number || s.phone}</span>
                              </div>
                              {s.subscription_type === "monthly_flat" && (
                                <div className="flex items-center gap-2 text-xs">
                                  <Clock className="h-3 w-3 text-muted-foreground" />
                                  <span className={
                                    status === "expired" ? "text-destructive font-medium" :
                                    status === "expiring" ? "text-warning font-medium" : "text-success"
                                  }>
                                    {status === "expired" ? "Expiré" : status === "expiring" ? "Expire bientôt" : "Actif"}
                                    {s.pro_expires_at && ` (${new Date(s.pro_expires_at).toLocaleDateString()})`}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex gap-2 flex-wrap pt-3 border-t">
                              {s.subscription_type !== "monthly_flat" && (
                                <Button size="sm" variant="outline" className="flex-1 h-9 rounded-lg text-[11px]" onClick={() => handleSetPro(s.user_id)}>
                                  <Crown className="mr-1 h-3 w-3 text-accent" /> Passer PRO
                                </Button>
                              )}
                              {s.subscription_type === "monthly_flat" && (status === "expired" || status === "expiring") && (
                                <Button size="sm" variant="outline" className="flex-1 h-9 rounded-lg text-[11px]" onClick={() => handleSetPro(s.user_id)}>
                                  <RefreshCw className="mr-1 h-3 w-3" /> Renouveler
                                </Button>
                              )}
                              <Button size="sm" variant="destructive" className="flex-1 h-9 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border-none text-[11px]" onClick={() => handleSuspend(s.user_id)}>
                                <Ban className="mr-1 h-3 w-3" /> Suspendre
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {shops.length === 0 && (
                      <div className="text-center text-muted-foreground py-12">Aucune boutique enregistrée</div>
                    )}
                  </div>
                </>
              )}

              {/* PRO TRACKING */}
              {section === "pro" && (
                <>
                  <h2 className="font-display text-xl font-bold">Suivi des Forfaits PRO</h2>
                  <div className="grid gap-3">
                    {proShops.length === 0 && <p className="text-muted-foreground">Aucune boutique PRO</p>}
                    {proShops.map((s) => {
                      const status = getProStatus(s);
                      return (
                        <Card key={s.id} className={
                          status === "expired" ? "border-destructive bg-destructive/5" :
                          status === "expiring" ? "border-warning bg-warning/5" : ""
                        }>
                          <CardContent className="flex items-center justify-between p-4">
                            <div>
                              <p className="font-semibold">{s.shop_name || s.display_name}</p>
                              <p className="text-sm text-muted-foreground">{s.neighborhood || "—"}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <Clock className="h-3 w-3" />
                                <span className={`text-xs font-medium ${
                                  status === "expired" ? "text-destructive" :
                                  status === "expiring" ? "text-warning" : "text-success"
                                }`}>
                                  {status === "expired" ? "Expiré" :
                                   status === "expiring" ? "Expire dans moins de 3 jours" :
                                   s.pro_expires_at ? `Expire le ${new Date(s.pro_expires_at).toLocaleDateString("fr-FR")}` : "Actif"}
                                </span>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {(status === "expired" || status === "expiring") && (
                                <Button size="sm" variant="outline" onClick={() => handleRenewReminder(s)}>
                                  <MessageCircle className="mr-1 h-3 w-3" /> Rappel WhatsApp
                                </Button>
                              )}
                              <Button size="sm" onClick={() => handleSetPro(s.user_id)}>
                                <RefreshCw className="mr-1 h-3 w-3" /> Renouveler
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}

              {/* COMMISSIONS JOURNAL */}
              {section === "commissions" && (
                <>
                  <h2 className="font-display text-xl font-bold">Journal des Commissions</h2>
                  <div className="grid gap-4">
                    {transactions.filter(t => t.commission_fee > 0).map((tx) => {
                      const seller = sellers.find(s => s.user_id === tx.seller_id);
                      return (
                        <Card key={tx.id} className="overflow-hidden border-none shadow-premium rounded-2xl bg-white/50 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-4">
                              <div className="space-y-1">
                                <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Commission</p>
                                <p className="text-lg font-black text-accent">{formatCFA(tx.commission_fee)}</p>
                              </div>
                              <Badge variant={tx.status === "released" ? "default" : "secondary"} className="text-[10px]">
                                {tx.status === "escrow" ? "Séquestre" : tx.status === "released" ? "Reversé" : tx.status}
                              </Badge>
                            </div>

                            <div className="bg-secondary/20 rounded-xl p-3 mb-2 space-y-2">
                              <div className="flex justify-between text-[11px]">
                                <span className="text-muted-foreground">Boutique</span>
                                <span className="font-bold">{seller?.shop_name || "N/A"}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-muted-foreground">Prix Vente</span>
                                <span className="font-medium">{formatCFA(tx.amount_total)}</span>
                              </div>
                              <div className="flex justify-between text-[11px]">
                                <span className="text-muted-foreground">Part Vendeur</span>
                                <span className="font-medium text-success">{formatCFA(tx.seller_payout)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground px-1">
                              <span>ID: {tx.id.slice(0, 8)}</span>
                              <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    {transactions.filter(t => t.commission_fee > 0).length === 0 && (
                      <div className="text-center text-muted-foreground py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-dashed">
                        <Receipt className="mx-auto h-12 w-12 opacity-20 mb-3" />
                        <p>Aucune transaction avec commission</p>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* PARTNERS */}
              {section === "partners" && (
                <>
                  <div className="flex items-center justify-between">
                     <h2 className="font-display text-xl font-bold">Gestion des Partenaires</h2>
                     <Badge className="bg-primary text-white">{partners.length} Partenaires</Badge>
                  </div>
                  
                  <div className="grid gap-6">
                    {/* Active Partners */}
                    <Card className="border-none shadow-premium rounded-3xl overflow-hidden bg-white">
                      <CardHeader className="bg-secondary/10 border-b">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                           <Users className="h-4 w-4" /> Liste des Partenaires Sourcing
                        </CardTitle>
                      </CardHeader>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px] uppercase font-black">Nom / Boutique</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-center">Markup (%)</TableHead>
                            <TableHead className="text-[10px] uppercase font-black">Contact</TableHead>
                            <TableHead className="text-[10px] uppercase font-black text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {partners.map(p => (
                            <TableRow key={p.id}>
                              <TableCell className="font-bold text-sm">{p.shop_name || p.display_name}</TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="font-mono text-accent">+{p.partner_markup_percent || 0}%</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground font-mono">{p.whatsapp_number || p.phone}</TableCell>
                              <TableCell className="text-right">
                                <Button size="sm" variant="ghost" onClick={() => { setEditingPartner(p); setMarkupValue(String(p.partner_markup_percent || 0)); }}>
                                  Modifier Markup
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {partners.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground italic">Aucun partenaire actif.</TableCell></TableRow>}
                        </TableBody>
                      </Table>
                    </Card>

                    {/* Potential Partners (Promote) */}
                    <Card className="border-none shadow-premium rounded-3xl overflow-hidden bg-white/50">
                      <CardHeader>
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Promouvoir un utilisateur</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                          {candidates.slice(0, 10).map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-white border border-secondary/20 hover:border-accent/40 transition-colors">
                              <div>
                                <p className="text-sm font-bold">{c.display_name || c.shop_name}</p>
                                <p className="text-[10px] text-muted-foreground">{c.whatsapp_number || "Pas de numéro"}</p>
                              </div>
                              <Button size="sm" className="h-8 rounded-lg" onClick={() => handlePromotePartner(c.user_id)}>Promouvoir</Button>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* DISPUTES */}
              {section === "disputes" && (
                <>
                  <h2 className="font-display text-xl font-bold">Litiges en cours</h2>
                  <div className="grid gap-3">
                    {disputes.length === 0 && <p className="text-muted-foreground">Aucun litige signalé</p>}
                    {disputes.map((d) => {
                      const order = orders.find(o => o.id === d.order_id);
                      return (
                        <Card key={d.id} className={d.status === "open" ? "border-destructive/50" : ""}>
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={d.status === "open" ? "destructive" : "secondary"}>
                                    {d.status === "open" ? "Ouvert" : "Résolu"}
                                  </Badge>
                                  <span className="text-sm text-muted-foreground">
                                    {new Date(d.created_at).toLocaleDateString("fr-FR")}
                                  </span>
                                </div>
                                <p className="mt-2 font-medium">Commande : {order?.order_number || d.order_id.slice(0, 8)}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{d.reason}</p>
                                {d.admin_response && (
                                  <p className="mt-2 rounded bg-muted p-2 text-sm"><strong>Réponse :</strong> {d.admin_response}</p>
                                )}
                              </div>
                              {d.status === "open" && (
                                <Button size="sm" onClick={() => { setDisputeDialog(d); setAdminResponse(""); }}>
                                  Résoudre
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </main>
          </div>
        </div>

        {/* Markup Edit Dialog */}
        <Dialog open={!!editingPartner} onOpenChange={() => setEditingPartner(null)}>
          <DialogContent className="rounded-3xl">
            <DialogHeader>
              <DialogTitle className="font-display font-black uppercase tracking-tight">Ajuster le Markup Partenaire</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
               <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 block">Taux de markup (%)</Label>
                  <Input 
                    type="number" 
                    value={markupValue} 
                    onChange={(e) => setMarkupValue(e.target.value)}
                    className="h-12 rounded-2xl text-lg font-bold border-2 focus:border-accent"
                  />
                  <p className="text-[10px] text-muted-foreground mt-2 italic">Ce pourcentage s'ajoute au prix fournisseur lors de la mise en ligne.</p>
               </div>
               <Button onClick={handleUpdateMarkup} className="w-full h-12 rounded-2xl bg-primary text-white font-bold text-sm uppercase tracking-widest">
                  Confirmer la modification
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarProvider>
    </PageTransition>
  );
}
