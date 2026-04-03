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
import { Trash2, Plus, Minus, ShoppingBag, Truck, ArrowLeft, MessageCircle } from "lucide-react";
import { toast } from "sonner";

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
        <Link to="/catalogue">
          <Button className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
            Parcourir le catalogue
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
        <Link to="/catalogue" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Continuer mes achats
        </Link>

        <h1 className="font-display text-3xl font-bold">Mon Panier</h1>

        <div className="mt-6 grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {items.map((item) => (
              <div key={item.product.id} className="flex gap-4 rounded-xl border bg-card p-4">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                  <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{item.product.sellerName}</p>
                      <h3 className="font-display font-semibold">{item.product.name}</h3>
                    </div>
                    <button onClick={() => removeItem(item.product.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {item.deliveryMethod === "pickup" ? (
                      <><ShoppingBag className="h-3 w-3" /> Retrait en boutique</>
                    ) : (
                      <><Truck className="h-3 w-3" /> Livraison</>
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border text-foreground hover:bg-secondary"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="flex h-7 w-7 items-center justify-center rounded-md border text-foreground hover:bg-secondary"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="font-display font-bold text-accent">{formatCFA(item.product.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}

            {/* Buyer Info Form */}
            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-display text-lg font-bold">Vos informations</h3>
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="buyer-name">Nom complet *</Label>
                  <Input id="buyer-name" placeholder="Votre nom" value={buyerName} onChange={e => setBuyerName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="buyer-phone">Téléphone *</Label>
                  <Input id="buyer-phone" placeholder="+228..." value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} required pattern="^\+228[0-9]{8}$" title="Doit commencer par +228 suivi de 8 chiffres" />
                </div>
                <div className="space-y-2">
                  <Label>Quartier de livraison *</Label>
                  <Select value={buyerNeighborhood} onValueChange={setBuyerNeighborhood}>
                    <SelectTrigger><SelectValue placeholder="Choisir un quartier" /></SelectTrigger>
                    <SelectContent>
                      {neighborhoods.map(n => (
                        <SelectItem key={n} value={n}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="rounded-xl border bg-card p-6">
            <h3 className="font-display text-lg font-bold">Résumé</h3>

            {/* Per-seller breakdown */}
            {(() => {
              const groups = items.reduce((acc, item) => {
                const name = item.product.sellerName;
                if (!acc[name]) acc[name] = { items: [], total: 0 };
                acc[name].items.push(item);
                acc[name].total += item.product.price * item.quantity;
                return acc;
              }, {} as Record<string, { items: typeof items; total: number }>);
              return Object.entries(groups).map(([seller, g]) => (
                <div key={seller} className="mt-3 rounded-lg border bg-muted/20 p-3">
                  <p className="text-xs font-semibold text-foreground">{seller}</p>
                  {g.items.map(i => (
                    <div key={i.product.id} className="mt-1 flex justify-between text-xs text-muted-foreground">
                      <span>{i.product.name} × {i.quantity}</span>
                      <span>{formatCFA(i.product.price * i.quantity)}</span>
                    </div>
                  ))}
                  <div className="mt-1 flex justify-between text-xs font-medium">
                    <span>Sous-total</span><span>{formatCFA(g.total)}</span>
                  </div>
                </div>
              ));
            })()}

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">{formatCFA(getTotal())}</span>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-display font-bold">Total</span>
                  <span className="font-display text-lg font-bold text-accent">{formatCFA(getGrandTotal())}</span>
                </div>
              </div>
            </div>

            <Button
              className="mt-6 w-full bg-accent text-accent-foreground hover:bg-accent/90"
              size="lg"
              onClick={handleCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? "Traitement..." : "Commander & Payer"}
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              💡 Paiement sécurisé — Fonds en séquestre jusqu'à confirmation de réception
            </p>
            <div className="mt-2 flex items-center justify-center gap-1 text-xs text-muted-foreground">
              <MessageCircle className="h-3 w-3" /> Le vendeur sera notifié par WhatsApp
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
