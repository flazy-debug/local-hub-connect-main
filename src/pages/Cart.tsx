import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/lib/cart-store";
import { formatCFA, generateWhatsAppLink, neighborhoods } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Minus, ShoppingBag, Truck, ArrowLeft, MessageCircle, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";

export default function Cart() {
  const { items, removeItem, updateQuantity, getTotal, getServiceFee, getGrandTotal, clearCart } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [buyerName, setBuyerName] = useState(profile?.display_name || "");
  const [buyerPhone, setBuyerPhone] = useState(profile?.phone || "");
  const [buyerNeighborhood, setBuyerNeighborhood] = useState(profile?.neighborhood || "");
  const [isProcessing, setIsProcessing] = useState(false);

  if (items.length === 0) {
    return (
      <div className="container py-20 text-center">
        <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground/30" />
        <h2 className="mt-4 font-display text-2xl font-bold">Votre panier est vide</h2>
        <p className="mt-2 text-muted-foreground">Découvrez nos produits et ajoutez-les à votre panier</p>
        <Link to="/tous-les-produits">
          <Button className="mt-6 bg-primary text-white hover:bg-primary/90">
            Parcourir nos produits
          </Button>
        </Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!buyerName.trim() || !buyerPhone.trim() || !buyerNeighborhood) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!user) {
      toast.error("Veuillez vous connecter pour commander.");
      navigate("/auth");
      return;
    }

    setIsProcessing(true);

    try {
      // Group items by seller
      const sellerGroups = items.reduce((acc, item) => {
        const sid = item.product.sellerId;
        if (!acc[sid]) acc[sid] = [];
        acc[sid].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      for (const [sellerId, sellerItems] of Object.entries(sellerGroups)) {
        // Fetch seller profile FIRST to get subscription_type
        const { data: sellerProfile } = await supabase
          .from("profiles")
          .select("whatsapp_number, display_name, shop_name, subscription_type")
          .eq("user_id", sellerId)
          .single();

        const isProOrPartner = sellerProfile?.subscription_type === "monthly_flat" || sellerProfile?.subscription_type === "partner";
        const commissionRate = isProOrPartner ? 0 : 0.10;
        const GATEWAY_FEE = 0.04;

        const orderTotal = sellerItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
        const grandTotal = orderTotal;
        const gatewayDeduction = grandTotal * GATEWAY_FEE;
        const platformCommission = grandTotal * commissionRate;
        const totalCommission = Math.round(gatewayDeduction + platformCommission);
        const sellerPayout = grandTotal - totalCommission;

        // Create order in DB
        const { data: orderData, error: orderError } = await supabase
          .from("orders")
          .insert({
            buyer_id: user.id,
            seller_id: sellerId,
            items: sellerItems.map(i => ({
              product_id: i.product.id,
              name: i.product.name,
              quantity: i.quantity,
              price: i.product.price,
            })),
            total: grandTotal,
            delivery_method: sellerItems[0].deliveryMethod,
            buyer_name: buyerName,
            buyer_phone: buyerPhone,
            buyer_neighborhood: buyerNeighborhood,
            status: "paid", // Simulates successful payment — funds in escrow
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Create transaction record (escrow)
        const { error: txError } = await supabase
          .from("transactions")
          .insert({
            order_id: orderData.id,
            seller_id: sellerId,
            amount_total: grandTotal,
            commission_fee: totalCommission,
            seller_payout: sellerPayout,
            status: "escrow",
          });

        if (txError) throw txError;

        const whatsappNumber = sellerProfile?.whatsapp_number || "+22890000000";

        // Open WhatsApp with order summary
        const whatsappLink = generateWhatsAppLink(whatsappNumber, {
          id: orderData.order_number,
          items: sellerItems.map(i => ({
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price * i.quantity,
          })),
          total: grandTotal,
          deliveryMethod: sellerItems[0].deliveryMethod,
          neighborhood: buyerNeighborhood,
          buyerName,
          buyerPhone,
        });

        window.open(whatsappLink, "_blank");
      }

      toast.success("Commande créée ! Le vendeur a été notifié par WhatsApp.");
      clearCart();
      navigate("/profil");
    } catch (err: any) {
      toast.error("Erreur lors de la commande : " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <Link to="/tous-les-produits" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Continuer mes achats
        </Link>

        <h1 className="font-display text-3xl font-bold">Mon Panier</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <Card key={item.product.id} className="overflow-hidden border-none shadow-premium rounded-3xl bg-white/50 backdrop-blur-sm p-4 relative group">
                <div className="flex gap-4">
                  <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-muted shadow-inner">
                    <img src={item.product.images?.[0]} alt={item.product.name} className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500" />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest truncate">{item.product.sellerName}</p>
                        <h3 className="font-bold text-sm text-primary truncate leading-tight mt-0.5">{item.product.name}</h3>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeItem(item.product.id)} 
                        className="h-8 w-8 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-1 flex items-center gap-3 text-[10px] font-bold uppercase tracking-tighter text-muted-foreground/60">
                      {item.deliveryMethod === "pickup" ? (
                        <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full"><ShoppingBag className="h-2.5 w-2.5" /> Retrait</div>
                      ) : (
                        <div className="flex items-center gap-1 bg-accent/10 text-accent px-2 py-0.5 rounded-full"><Truck className="h-2.5 w-2.5" /> Livraison</div>
                      )}
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center bg-slate-100 rounded-xl p-1 border border-white/50 shadow-sm">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className={cn("flex h-8 w-8 items-center justify-center rounded-lg transition-colors", 
                            item.quantity <= 1 ? "text-muted-foreground/30" : "text-primary hover:bg-white/50")}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-10 text-center text-sm font-black text-primary">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-primary hover:bg-white/50 transition-colors"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="font-black text-accent text-lg tracking-tighter">{formatCFA(item.product.price * item.quantity)}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {/* Buyer Info Form */}
            <Card className="rounded-3xl border-none bg-white/50 backdrop-blur-sm p-6 shadow-premium">
              <h3 className="font-display text-xl font-black text-[#142642]">Vos informations</h3>
              <div className="mt-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="buyer-name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Nom complet</Label>
                  <Input id="buyer-name" placeholder="Ex: Jean Koffi" value={buyerName} onChange={e => setBuyerName(e.target.value)} required className="h-12 rounded-2xl border-muted/20 bg-white/50 focus:ring-accent/20" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyer-phone" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Téléphone WhatsApp</Label>
                  <Input id="buyer-phone" type="tel" inputMode="tel" placeholder="+228..." value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} required className="h-12 rounded-2xl border-muted/20 bg-white/50 focus:ring-accent/20" />
                  <p className="text-[10px] text-muted-foreground italic">Le vendeur utilisera ce numéro pour vous contacter.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Quartier de livraison</Label>
                  <Select value={buyerNeighborhood} onValueChange={setBuyerNeighborhood}>
                    <SelectTrigger className="h-12 rounded-2xl border-muted/20 bg-white/50 focus:ring-accent/20">
                      <SelectValue placeholder="Choisir un quartier" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-premium">
                      {neighborhoods.map(n => (
                        <SelectItem key={n} value={n} className="rounded-xl my-0.5">{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <Card className="rounded-3xl border-none bg-white/50 backdrop-blur-sm p-6 shadow-premium relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <ShoppingBag className="h-20 w-20 text-[#142642]" />
              </div>
              <h3 className="font-display text-xl font-black text-[#142642] mb-4">Résumé de commande</h3>

              {/* Per-seller breakdown */}
              <div className="space-y-3">
                {(() => {
                  const groups = items.reduce((acc, item) => {
                    const name = item.product.sellerName;
                    if (!acc[name]) acc[name] = { items: [], total: 0 };
                    acc[name].items.push(item);
                    acc[name].total += item.product.price * item.quantity;
                    return acc;
                  }, {} as Record<string, { items: typeof items; total: number }>);
                  return Object.entries(groups).map(([seller, g]) => (
                    <div key={seller} className="rounded-2xl bg-slate-100/50 p-4 border border-white/50">
                      <p className="text-[10px] font-black uppercase text-[#142642] tracking-widest">{seller}</p>
                      <div className="mt-2 space-y-1">
                        {g.items.map(i => (
                          <div key={i.product.id} className="flex justify-between text-xs text-muted-foreground">
                            <span>{i.product.name} × {i.quantity}</span>
                            <span className="font-medium">{formatCFA(i.product.price * i.quantity)}</span>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-muted/20 flex justify-between text-[11px] font-black uppercase text-[#142642]">
                        <span>Total boutique</span>
                        <span>{formatCFA(g.total)}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground font-medium">Sous-total</span>
                  <span className="font-bold text-primary font-mono">{formatCFA(getTotal())}</span>
                </div>

                <div className="pt-4 border-t border-dashed border-muted/50">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-black uppercase tracking-widest text-[#142642]">Total Final</span>
                    <span className="text-2xl font-black text-accent tracking-tighter leading-none">{formatCFA(getGrandTotal())}</span>
                  </div>
                </div>
              </div>

              <Button
                className="mt-8 w-full bg-accent hover:bg-accent/90 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-accent/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                onClick={handleCheckout}
                disabled={isProcessing}
              >
                {isProcessing ? "Traitement..." : (
                  <>
                    <MessageCircle className="h-5 w-5" />
                    Commander par WhatsApp
                  </>
                )}
              </Button>
              
              <div className="mt-6 rounded-xl bg-blue-50/50 p-4 space-y-2">
                <div className="flex items-center gap-2 text-blue-600">
                  <ShieldCheck className="h-4 w-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Paiement Sécurisé</span>
                </div>
                <p className="text-[10px] text-blue-700/70 leading-relaxed italic">
                  Vos fonds sont gardés en séquestre par la plateforme jusqu'à ce que vous confirmiez la bonne réception de votre colis.
                </p>
              </div>
            </Card>
            
            <div className="text-center space-y-2">
              <p className="text-[10px] text-muted-foreground/60 uppercase font-bold tracking-[0.2em]">VOIKET Market & Escrow Service</p>
              <div className="flex justify-center gap-4 opacity-30 grayscale">
                {/* Minimal placeholder logos for payment trust */}
                <div className="h-6 w-10 bg-muted rounded"></div>
                <div className="h-6 w-10 bg-muted rounded"></div>
                <div className="h-6 w-10 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
