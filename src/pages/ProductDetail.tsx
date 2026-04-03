import { useParams, Link, useNavigate } from "react-router-dom";
import { products as mockProducts, formatCFA, shops as mockShops, generateWhatsAppLink, neighborhoods } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, ShoppingBag, Truck, ArrowLeft, MessageCircle, Store, CheckCircle, Share2, ShieldCheck, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import WishlistButton from "@/components/WishlistButton";
import FollowButton from "@/components/FollowButton";
import VerificationBadge from "@/components/VerificationBadge";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { Product, Review } from "@/lib/types";

export default function ProductDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<(Product & { promoPrice?: number }) | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerWhatsapp, setSellerWhatsapp] = useState("");
  const [sellerSubscription, setSellerSubscription] = useState("STANDARD");
  const [partnerMarkup, setPartnerMarkup] = useState(0);
  const [isExemptFromCommission, setIsExemptFromCommission] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [deliveryZone, setDeliveryZone] = useState("Zone A");

  // Order form
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerNeighborhood, setBuyerNeighborhood] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (profile) {
      setBuyerName(profile.display_name || "");
      setBuyerPhone(profile.phone || "");
      setBuyerNeighborhood(profile.neighborhood || "");
    }
  }, [profile]);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: dbProduct } = await supabase
        .from("products").select("*").eq("id", id).single();

      if (dbProduct) {
        const { data: sellerProfile } = await (supabase
          .from("profiles") as any)
          .select("display_name, shop_name, whatsapp_number, verification_status, subscription_type, partner_markup_percent")
          .eq("user_id", dbProduct.seller_id).single();

        const mapped: Product & { promoPrice?: number } = {
          id: dbProduct.id, name: dbProduct.name, description: dbProduct.description || "",
          price: dbProduct.price,
          images: dbProduct.images?.length > 0 ? dbProduct.images : ["/placeholder.svg"],
          category: dbProduct.category,
          condition: dbProduct.condition as "neuf" | "occasion",
          stock: dbProduct.stock, sellerId: dbProduct.seller_id,
          sellerName: sellerProfile?.shop_name || sellerProfile?.display_name || "Vendeur",
          sellerType: sellerProfile?.shop_name ? "boutique" : "particulier",
          neighborhood: dbProduct.neighborhood, rating: 0, reviewCount: 0,
          pickupAvailable: dbProduct.pickup_available,
          deliveryAvailable: dbProduct.delivery_available,
          pickupAddress: dbProduct.pickup_address || undefined,
          sellerVerification: (sellerProfile as any)?.verification_status || "none",
           promoPrice: (dbProduct as any).promo_price || undefined,
           isBoosted: (dbProduct as any).is_boosted || false,
           videoUrl: (dbProduct as any).video_url || null,
           supplierPrice: (dbProduct as any).supplier_price || null,
         };
         setProduct(mapped);
         setSellerWhatsapp(sellerProfile?.whatsapp_number || "");
         const sub = (sellerProfile as any)?.subscription_type || "STANDARD";
         setSellerSubscription(sub);
         setIsExemptFromCommission(sub === "monthly_flat" || sub === "PRO" || sub === "partner" || sub === "PARTNER");
         setPartnerMarkup((sellerProfile as any)?.partner_markup_percent || 0);
        setDeliveryMethod(mapped.pickupAvailable ? "pickup" : "delivery");

        const { data: dbReviews } = await supabase
          .from("reviews").select("*").eq("product_id", id).order("created_at", { ascending: false });
        if (dbReviews) {
          setReviews(dbReviews.map((r: any) => ({
            id: r.id, productId: r.product_id, buyerName: r.buyer_name,
            rating: r.rating, comment: r.comment || "", createdAt: r.created_at,
          })));
        }
      } else {
        const mockProd = mockProducts.find(p => p.id === id);
        if (mockProd) { setProduct(mockProd); setDeliveryMethod(mockProd.pickupAvailable ? "pickup" : "delivery"); }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  if (loading) return <div className="container py-20 text-center"><p className="text-muted-foreground">Chargement...</p></div>;
  if (!product) return (
    <div className="container py-20 text-center">
      <p className="text-lg text-muted-foreground">Produit introuvable</p>
      <Link to="/catalogue" className="mt-4 inline-block text-accent hover:underline">Retour au catalogue</Link>
    </div>
  );

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : product.rating.toString();
  
  // Calculate final price for PARTNER
  const isPartner = sellerSubscription === "PARTNER" || sellerSubscription === "partner";
  const calculatedPrice = (isPartner && (product as any).supplierPrice)
    ? Math.round((product as any).supplierPrice * (1 + partnerMarkup / 100))
    : product.price;

  const displayPrice = product.promoPrice || calculatedPrice;

  const handleOrder = async () => {
    if (!buyerName.trim() || !buyerPhone.trim() || !buyerNeighborhood) {
      toast.error("Veuillez remplir tous les champs obligatoires."); return;
    }
    if (!user) { toast.error("Veuillez vous connecter."); navigate("/auth"); return; }

    setIsProcessing(true);
    try {
      // 4% Reseau + 10% Commission (sauf PRO et PARTNER)
      const isExempt = sellerSubscription === "monthly_flat" || sellerSubscription === "partner" || sellerSubscription === "PRO" || sellerSubscription === "PARTNER";
      const commissionRate = isExempt ? 0 : 0.10;
      const GATEWAY_FEE_RATE = 0.04;
      
      const zoneFees: Record<string, number> = { "Zone A": 500, "Zone B": 1000, "Zone C": 1500, "Zone D": 2000, "Zone E": 2500 };
      const dFee = deliveryMethod === "delivery" ? (zoneFees[deliveryZone] || 0) : 0;
      
      const grandTotal = displayPrice + dFee;
      const networkFee = Math.round(displayPrice * GATEWAY_FEE_RATE);
      const platformComm = Math.round(displayPrice * commissionRate);
      const totalCommission = networkFee + platformComm;
      const sellerPayout = displayPrice - totalCommission;

      const { data: orderData, error: orderError } = await supabase
        .from("orders").insert({
          buyer_id: user.id, seller_id: product.sellerId,
          items: [{ product_id: product.id, name: product.name, quantity: 1, price: displayPrice }],
          total: grandTotal, delivery_method: deliveryMethod,
          buyer_name: buyerName, buyer_phone: buyerPhone,
          buyer_neighborhood: buyerNeighborhood, 
          delivery_zone: deliveryZone,
          delivery_fee: dFee,
          status: "paid",
        }).select().single();
      if (orderError) throw orderError;

      await supabase.from("transactions").insert({
        order_id: (orderData as any).id, 
        seller_id: product.sellerId,
        amount_total: grandTotal, 
        commission_fee: totalCommission,
        gateway_fee: networkFee,
        platform_commission: platformComm,
        seller_payout: sellerPayout,
        status: "escrow",
      });

      // WhatsApp notification
      if (sellerWhatsapp) {
        const link = generateWhatsAppLink(sellerWhatsapp, {
          id: (orderData as any).order_number, items: [{ name: product.name, quantity: 1, price: displayPrice }],
          total: grandTotal, deliveryMethod, neighborhood: buyerNeighborhood, buyerName, buyerPhone,
        });
        window.open(link, "_blank");
      }

      toast.success("Commande créée avec succès !");
      navigate("/suivi");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la commande.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.name || "VOIKET",
          text: `Découvrez ${product?.name} sur VOIKET !`,
          url: window.location.href,
        });
      } catch (err) { console.log("Error sharing", err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container">
        <Link to="/catalogue" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Retour au catalogue
        </Link>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Images */}
          <div>
            <div className="aspect-square overflow-hidden rounded-xl border bg-secondary">
              <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover" />
            </div>
            {product.images.length > 1 && (
              <div className="mt-3 flex gap-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <div key={i} className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border bg-secondary">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
            
            {/* Video Support */}
            {(product as any).videoUrl && (
              <div className="mt-4 overflow-hidden rounded-xl border bg-secondary">
                <video 
                  src={(product as any).videoUrl} 
                  controls 
                  className="aspect-video w-full object-cover"
                  poster={product.images[0]}
                />
                <div className="bg-accent/10 p-2 text-center text-[10px] font-bold text-accent uppercase tracking-wider">
                  🎬 Démonstration Vidéo
                </div>
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <div className="flex items-center gap-2">
              <Badge variant={product.condition === "neuf" ? "default" : "secondary"} className={product.condition === "neuf" ? "bg-success text-success-foreground" : ""}>
                {product.condition === "neuf" ? "Neuf" : "Occasion"}
              </Badge>
              <Badge variant="outline">{product.sellerType === "boutique" ? "Boutique" : "Particulier"}</Badge>
              {product.isBoosted && (
                <Badge className="bg-accent animate-pulse">🔥 Sponsorisé</Badge>
              )}
            </div>

            <h1 className="mt-3 font-display text-2xl font-bold md:text-3xl">{product.name}</h1>

            <div className="mt-2 flex items-center gap-3">
              <div className="flex items-center gap-1"><Star className="h-4 w-4 fill-accent text-accent" /><span className="font-medium">{avgRating}</span></div>
              <span className="text-sm text-muted-foreground">({reviews.length || product.reviewCount} avis)</span>
              <span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="h-3 w-3" /> {product.neighborhood}</span>
            </div>

            {product.promoPrice ? (
              <div className="mt-4 flex items-center gap-3">
                <p className="font-display text-3xl font-black text-accent tracking-tighter">{formatCFA(product.promoPrice)}</p>
                <p className="text-lg text-muted-foreground line-through opacity-50">{formatCFA(product.price)}</p>
                <Badge className="bg-destructive/10 text-destructive border-none font-bold">-{Math.round((1 - product.promoPrice / product.price) * 100)}%</Badge>
              </div>
            ) : (
              <p className="mt-4 font-display text-4xl font-black text-accent tracking-tighter">
                {formatCFA(calculatedPrice)}
                {isPartner && <span className="ml-2 text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">(Prix Partenaire)</span>}
              </p>
            )}

            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

            {/* Delivery Options */}
            <div className="mt-6 space-y-2">
              <p className="text-sm font-semibold">Mode de récupération :</p>
              <div className="flex gap-2">
                {product.pickupAvailable && (
                  <button onClick={() => setDeliveryMethod("pickup")}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all ${deliveryMethod === "pickup" ? "border-accent bg-accent/10 text-accent" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
                    <ShoppingBag className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">Retrait en boutique</p>
                      {product.pickupAddress && <p className="text-xs opacity-70">{product.pickupAddress}</p>}
                    </div>
                  </button>
                )}
                {product.deliveryAvailable && (
                  <button onClick={() => setDeliveryMethod("delivery")}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm transition-all ${deliveryMethod === "delivery" ? "border-accent bg-accent/10 text-accent" : "bg-card text-muted-foreground hover:bg-secondary"}`}>
                    <Truck className="h-4 w-4" />
                    <div className="text-left">
                      <p className="font-medium">Livraison à domicile</p>
                      <p className="text-xs opacity-70">Frais selon quartier</p>
                    </div>
                  </button>
                )}
              </div>
            </div>

            {/* Order CTA - PRO: WhatsApp, Commission: Direct order */}
            {isExemptFromCommission ? (
              /* PRO/Partner sellers: WhatsApp order */
              <div className="mt-6">
                {sellerWhatsapp ? (
                  <a
                    href={generateWhatsAppLink(sellerWhatsapp, {
                      id: "nouveau", items: [{ name: product.name, quantity: 1, price: displayPrice }],
                      total: displayPrice, deliveryMethod, neighborhood: product.neighborhood,
                      buyerName: profile?.display_name || "", buyerPhone: profile?.phone || "",
                    })}
                    target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-3 rounded-2xl bg-success hover:bg-success/90 px-6 py-4 font-black text-white text-lg shadow-xl shadow-success/20 transition-all active:scale-95"
                  >
                    <MessageCircle className="h-6 w-6" /> Commander par WhatsApp
                  </a>
                ) : (
                  <Button size="lg" disabled className="w-full rounded-2xl h-14 font-black">Vendeur non joignable</Button>
                )}
                <div className="mt-4 flex justify-center gap-4">
                  <WishlistButton productId={product.id} size="md" />
                  <Button variant="outline" size="icon" onClick={handleShare} className="h-12 w-12 rounded-xl border-primary/10">
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
                {isPartner && (
                  <div className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/10 flex items-start gap-2">
                    <div className="h-5 w-5 rounded-full bg-accent/20 flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="h-3 w-3 text-accent" />
                    </div>
                    <p className="text-[10px] text-accent/80 leading-tight">
                      <span className="font-bold">PRIX DIRECT :</span> En tant que Partenaire Officiel, le vendeur vous propose des prix grossistes avec une marge réduite et sans commission plateforme.
                    </p>
                  </div>
                )}
              </div>
            ) : !showOrderForm ? (
              <div className="mt-6 flex gap-3">
                <Button size="lg" className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => setShowOrderForm(true)}>
                  Commander maintenant
                </Button>
                <div className="flex h-12 w-12 items-center justify-center">
                  <WishlistButton productId={product.id} size="md" />
                </div>
              </div>
            ) : (
              /* Inline Order Form - Commission sellers only */
              <Card className="mt-6 space-y-6 border-none bg-white/50 backdrop-blur-sm p-6 shadow-premium rounded-3xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-accent"></div>
                <h3 className="font-display text-xl font-black text-[#142642]">Finaliser ma commande</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nom complet</Label>
                    <Input placeholder="Votre nom" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="h-12 rounded-2xl border-muted/20 bg-white/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Téléphone WhatsApp</Label>
                    <Input type="tel" inputMode="tel" placeholder="+228..." value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="h-12 rounded-2xl border-muted/20 bg-white/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Quartier</Label>
                    <Select value={buyerNeighborhood} onValueChange={setBuyerNeighborhood}>
                      <SelectTrigger className="h-12 rounded-2xl border-muted/20 bg-white/50">
                        <SelectValue placeholder="Choisir" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-premium">
                        {neighborhoods.map(n => <SelectItem key={n} value={n} className="rounded-xl my-0.5">{n}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-2xl bg-secondary/20 p-4 space-y-3 shadow-inner">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium uppercase tracking-tight">Prix Unitaire</span>
                    <span className="font-bold">{formatCFA(displayPrice)}</span>
                  </div>
                  {deliveryMethod === "delivery" && (
                    <div className="space-y-3 pt-3 border-t border-muted/20">
                       <div className="flex justify-between items-center">
                         <Label className="text-[10px] uppercase font-black text-primary tracking-widest">Zone Lomé</Label>
                         <Select value={deliveryZone} onValueChange={setDeliveryZone}>
                           <SelectTrigger className="h-8 w-40 text-[10px] font-bold rounded-full bg-white/50 border-none shadow-sm">
                             <SelectValue placeholder="Zone" />
                           </SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-premium">
                             <SelectItem value="Zone A" className="rounded-xl">Zone A (Centre - 500F)</SelectItem>
                             <SelectItem value="Zone B" className="rounded-xl">Zone B (Adido - 1000F)</SelectItem>
                             <SelectItem value="Zone C" className="rounded-xl">Zone C (Bagui - 1500F)</SelectItem>
                             <SelectItem value="Zone D" className="rounded-xl">Zone D (Agoé - 2000F)</SelectItem>
                             <SelectItem value="Zone E" className="rounded-xl">Zone E (Davié - 2500F)</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div className="flex justify-between text-[10px] font-black italic text-success uppercase tracking-tighter">
                         <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Frais de zone</span>
                         <span>+{formatCFA(deliveryMethod === "delivery" ? ({"Zone A": 500, "Zone B": 1000, "Zone C": 1500, "Zone D": 2000, "Zone E": 2500}[deliveryZone] || 0) : 0)}</span>
                       </div>
                    </div>
                  )}
                  <div className="flex justify-between items-end border-t border-muted/20 pt-3">
                    <span className="text-xs font-black uppercase tracking-widest text-[#142642]">Total Final</span>
                    <span className="text-2xl font-black text-accent tracking-tighter leading-none">{formatCFA(displayPrice + (deliveryMethod === "delivery" ? ({"Zone A": 500, "Zone B": 1000, "Zone C": 1500, "Zone D": 2000, "Zone E": 2500}[deliveryZone] || 0) : 0))}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-2">
                  <Button onClick={handleOrder} disabled={isProcessing} className="w-full bg-accent hover:bg-accent/90 text-white h-14 rounded-2xl font-bold text-lg shadow-xl shadow-accent/20 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" /> {isProcessing ? "Traitement..." : "Confirmer ma commande"}
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 rounded-2xl h-12 border-primary/10 hover:bg-primary/5 text-primary text-xs font-bold uppercase tracking-widest" onClick={() => setShowOrderForm(false)}>
                      Annuler
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare} className="h-12 w-12 rounded-2xl border-primary/10 text-primary hover:bg-primary/5 shadow-sm">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {/* Seller Info */}
            <div className="mt-6 rounded-xl border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary"><Store className="h-5 w-5 text-primary-foreground" /></div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold">{product.sellerName}</p>
                    <VerificationBadge status={product.sellerVerification} />
                  </div>
                  <p className="text-xs text-muted-foreground">{product.sellerType === "boutique" ? "Boutique" : "Vendeur particulier"}</p>
                </div>
                <div className="ml-auto"><FollowButton sellerId={product.sellerId} size="sm" /></div>
              </div>
              {/* Only show WhatsApp contact for PRO sellers */}
              {sellerSubscription === "PRO" && sellerWhatsapp && (
                <a href={`https://wa.me/${sellerWhatsapp.replace("+", "")}`} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-2 rounded-lg bg-success/10 px-4 py-2 text-sm font-medium text-success transition-colors hover:bg-success/20">
                  <MessageCircle className="h-4 w-4" /> Contacter sur WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Reviews */}
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold">Avis des acheteurs</h2>
          {reviews.length > 0 ? (
            <div className="mt-4 space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-xl border bg-card p-4">
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-accent text-accent" : "text-muted"}`} />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{review.buyerName}</span>
                    <span className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Aucun avis pour ce produit</p>
          )}
        </section>
      </div>
    </div>
  );
}
