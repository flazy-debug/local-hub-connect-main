import { useParams, Link, useNavigate } from "react-router-dom";
import { products as mockProducts, formatCFA, shops as mockShops, generateWhatsAppLink, neighborhoods } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, MapPin, ShoppingBag, Truck, ArrowLeft, MessageCircle, Store, CheckCircle, Share2 } from "lucide-react";
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
         setSellerSubscription((sellerProfile as any)?.subscription_type || "STANDARD");
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
  const calculatedPrice = (sellerSubscription === "PARTNER" && (product as any).supplierPrice)
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
      // 4% Reseau + 10% Commission (sauf PRO)
      const commissionRate = sellerSubscription === "PRO" ? 0 : 0.10;
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
                <p className="font-display text-3xl font-bold text-accent">{formatCFA(product.promoPrice)}</p>
                <p className="text-lg text-muted-foreground line-through">{formatCFA(product.price)}</p>
                <Badge className="bg-destructive/10 text-destructive">-{Math.round((1 - product.promoPrice / product.price) * 100)}%</Badge>
              </div>
            ) : (
              <p className="mt-4 font-display text-3xl font-bold text-accent">
                {formatCFA(calculatedPrice)}
                {sellerSubscription === "PARTNER" && <span className="ml-2 text-xs font-normal text-muted-foreground">(Prix Direct Partenaire)</span>}
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
            {sellerSubscription === "PRO" ? (
              /* PRO sellers: WhatsApp order */
              <div className="mt-6">
                {sellerWhatsapp ? (
                  <a
                    href={generateWhatsAppLink(sellerWhatsapp, {
                      id: "nouveau", items: [{ name: product.name, quantity: 1, price: displayPrice }],
                      total: displayPrice, deliveryMethod, neighborhood: product.neighborhood,
                      buyerName: profile?.display_name || "", buyerPhone: profile?.phone || "",
                    })}
                    target="_blank" rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-success px-6 py-3 font-semibold text-success-foreground transition-colors hover:bg-success/90"
                  >
                    <MessageCircle className="h-5 w-5" /> Commander via WhatsApp
                  </a>
                ) : (
                  <Button size="lg" disabled className="w-full">Vendeur non joignable</Button>
                )}
                <div className="mt-3 flex justify-center">
                  <WishlistButton productId={product.id} size="md" />
                </div>
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
              <div className="mt-6 space-y-4 rounded-xl border bg-card p-5">
                <h3 className="font-display font-semibold">Finaliser la commande</h3>
                <div className="space-y-2"><Label>Nom complet *</Label><Input placeholder="Votre nom" value={buyerName} onChange={e => setBuyerName(e.target.value)} /></div>
                <div className="space-y-2"><Label>Téléphone *</Label><Input placeholder="+228..." value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} /></div>
                <div className="space-y-2">
                  <Label>Quartier *</Label>
                  <Select value={buyerNeighborhood} onValueChange={setBuyerNeighborhood}>
                    <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                    <SelectContent>{neighborhoods.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">Prix</span><span>{formatCFA(displayPrice)}</span></div>
                  {deliveryMethod === "delivery" && (
                    <div className="space-y-2 mt-2 border-t pt-2">
                       <Label className="text-[10px] uppercase font-bold text-muted-foreground">Zone de livraison Lomé</Label>
                       <Select value={deliveryZone} onValueChange={setDeliveryZone}>
                         <SelectTrigger className="h-8 text-xs">
                           <SelectValue placeholder="Zone" />
                         </SelectTrigger>
                         <SelectContent>
                           <SelectItem value="Zone A">Zone A (Centre-Ville - 500 F)</SelectItem>
                           <SelectItem value="Zone B">Zone B (Adidogomé - 1000 F)</SelectItem>
                           <SelectItem value="Zone C">Zone C (Baguida - 1500 F)</SelectItem>
                           <SelectItem value="Zone D">Zone D (Agoé - 2000 F)</SelectItem>
                           <SelectItem value="Zone E">Zone E (Davié - 2500 F)</SelectItem>
                         </SelectContent>
                       </Select>
                       <div className="flex justify-between text-xs font-medium italic"><span>Frais zone</span><span>+{formatCFA(deliveryMethod === "delivery" ? ({"Zone A": 500, "Zone B": 1000, "Zone C": 1500, "Zone D": 2000, "Zone E": 2500}[deliveryZone] || 0) : 0)}</span></div>
                    </div>
                  )}
                  <div className="flex justify-between border-t pt-1 font-bold text-lg"><span>Total à payer</span><span className="text-accent">{formatCFA(displayPrice + (deliveryMethod === "delivery" ? ({"Zone A": 500, "Zone B": 1000, "Zone C": 1500, "Zone D": 2000, "Zone E": 2500}[deliveryZone] || 0) : 0))}</span></div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleOrder} disabled={isProcessing} className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20">
                    <CheckCircle className="mr-2 h-4 w-4" /> {isProcessing ? "Traitement..." : "Confirmer la commande"}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare} className="shrink-0 border-accent/20 text-accent hover:bg-accent/5 transition-all">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setShowOrderForm(false)}>Annuler</Button>
                </div>
              </div>
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
