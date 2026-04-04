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
  
  // V1.1 Listing logic
  const isListingCategory = ["immobilier", "vehicules", "emploi-services", "auto", "location-voiture"].includes(product?.category || "");
  const isDirectCheckout = !isListingCategory;

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
      
      // Special Redirection for Voiket (Car Rental)
      if (dbProduct && dbProduct.category === "location-voiture") {
        window.open("https://voiket.com", "_blank");
        navigate("/tous-les-produits");
      }
    };
    fetchProduct();
  }, [id, navigate]);

  if (loading) return <div className="container py-20 text-center"><p className="text-muted-foreground">Chargement...</p></div>;
  if (!product) return (
    <div className="container py-20 text-center">
      <p className="text-lg text-muted-foreground">Produit introuvable</p>
      <Link to="/tous-les-produits" className="mt-4 inline-block text-primary hover:underline">Retour aux produits</Link>
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
          title: product?.name || "Epuremarket",
          text: `Découvrez ${product?.name} sur Epuremarket !`,
          url: window.location.href,
        });
      } catch (err) { console.log("Error sharing", err); }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="container pt-8 text-slate-900">
        <Link to="/tous-les-produits" className="mb-10 inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors group">
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Retour à la collection
        </Link>

        <div className="grid gap-16 lg:grid-cols-12">
          {/* Images Section - Asymmetric Layout */}
          <div className="lg:col-span-7 space-y-8">
            <div className="relative aspect-[4/5] md:aspect-square overflow-hidden rounded-[2.5rem] bg-white shadow-[0_32px_64px_rgba(20,27,43,0.06)] group">
               {product.isBoosted && (
                 <div className="absolute top-6 left-6 z-20 bg-primary px-5 py-2 rounded-full text-white text-[10px] font-black uppercase tracking-widest shadow-xl animate-pulse">
                   ★ Sélection Elite
                 </div>
               )}
               <div className="absolute top-6 right-6 z-20 scale-125">
                 <WishlistButton productId={product.id} />
               </div>
               <img 
                 src={product.images[0]} 
                 alt={product.name} 
                 className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" 
               />
            </div>

            {/* Thumbnail Gallery & Video */}
            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-3xl cursor-pointer hover:ring-2 ring-primary ring-offset-4 transition-all bg-white shadow-sm">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            
            {/* Video Support - Editorial Integration */}
            {(product as any).videoUrl && (
              <div className="overflow-hidden rounded-[2rem] bg-white shadow-lg relative group">
                <video 
                  src={(product as any).videoUrl} 
                  controls 
                  className="aspect-video w-full object-cover"
                  poster={product.images[0]}
                />
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-[9px] font-black uppercase tracking-widest">
                  🎥 Vidéo Produit
                </div>
              </div>
            )}
          </div>

          {/* Info Section - Editorial Panel */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="outline" className="rounded-full border-primary/20 text-primary text-[9px] font-black uppercase tracking-widest px-4 py-1.5">
                  {product.category}
                </Badge>
                <Badge className="bg-slate-900 text-white border-none text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">
                  {product.condition === "neuf" ? "Pièce Neuve" : "Excellente Occasion"}
                </Badge>
              </div>

              <div className="space-y-4">
                <h1 className="font-display text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1]">{product.name}</h1>
                <div className="flex items-center gap-6">
                   <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-1.5 rounded-full">
                     <Star className="h-4 w-4 fill-primary text-primary" />
                     <span className="font-black text-primary text-sm">{avgRating}</span>
                   </div>
                   <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{reviews.length || product.reviewCount} avis certifiés</span>
                   <span className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest"><MapPin className="h-4 w-4 text-primary/40" /> {product.neighborhood}</span>
                </div>
              </div>

              {product.promoPrice ? (
                <div className="flex items-end gap-6">
                  <p className="font-display text-6xl font-black text-primary tracking-tighter leading-none">{formatCFA(product.promoPrice)}</p>
                  <p className="text-2xl text-slate-300 font-bold line-through mb-1">{formatCFA(product.price)}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="font-display text-6xl font-black text-primary tracking-tighter leading-none">
                    {formatCFA(calculatedPrice)}
                  </p>
                  {isPartner && <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Tarif Partenaire Privilégié</p>}
                </div>
              )}

              <p className="text-slate-500 font-medium leading-relaxed text-lg pt-4 border-t border-slate-50">{product.description}</p>
            </div>

            {/* V1.1 Specifications - Clean UI */}
            {isListingCategory && (
              <div className="grid grid-cols-2 gap-6 pb-4">
                <div className="p-6 rounded-[2rem] bg-white shadow-sm space-y-2 group hover:bg-primary transition-colors duration-500">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white/60">Emplacement</span>
                  <p className="text-lg font-black text-slate-900 group-hover:text-white">{product.neighborhood}</p>
                </div>
                <div className="p-6 rounded-[2rem] bg-white shadow-sm space-y-2 group hover:bg-primary transition-colors duration-500">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white/60">Rubrique</span>
                  <p className="text-lg font-black text-slate-900 uppercase group-hover:text-white">{product.category}</p>
                </div>
              </div>
            )}

            {/* Order Interface */}
            {isDirectCheckout && !showOrderForm && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Options de Récupération</p>
                  <div className="grid grid-cols-2 gap-4">
                    {product.pickupAvailable && (
                      <button onClick={() => setDeliveryMethod("pickup")}
                        className={`flex flex-col items-start gap-3 rounded-[2rem] p-6 text-left transition-all duration-500 ${deliveryMethod === "pickup" ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white text-slate-500 shadow-sm hover:shadow-md"}`}>
                        <ShoppingBag className={`h-6 w-6 ${deliveryMethod === "pickup" ? "text-white" : "text-primary"}`} />
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">Retrait Boutique</p>
                          {product.pickupAddress && <p className="text-[10px] font-bold opacity-60 mt-1 uppercase tracking-widest">{product.pickupAddress}</p>}
                        </div>
                      </button>
                    )}
                    {product.deliveryAvailable && (
                      <button onClick={() => setDeliveryMethod("delivery")}
                        className={`flex flex-col items-start gap-3 rounded-[2rem] p-6 text-left transition-all duration-500 ${deliveryMethod === "delivery" ? "bg-primary text-white shadow-xl shadow-primary/20" : "bg-white text-slate-500 shadow-sm hover:shadow-md"}`}>
                        <Truck className={`h-6 w-6 ${deliveryMethod === "delivery" ? "text-white" : "text-primary"}`} />
                        <div>
                          <p className="font-black text-sm uppercase tracking-tight">Livraison Rapide</p>
                          <p className="text-[10px] font-bold opacity-60 mt-1 uppercase tracking-widest">Lomé & Périphérie</p>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-slate-50">
              {/* Interaction Logic */}
              {(isExemptFromCommission || isListingCategory) ? (
                /* PRO / Listing Logic */
                <div className="space-y-6">
                  {sellerWhatsapp ? (
                    <a
                      href={generateWhatsAppLink(sellerWhatsapp, {
                        id: "nouveau", items: [{ name: product.name, quantity: 1, price: displayPrice }],
                        total: displayPrice, deliveryMethod, neighborhood: product.neighborhood,
                        buyerName: profile?.display_name || "", buyerPhone: profile?.phone || "",
                      })}
                      target="_blank" rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-4 rounded-full bg-[#25D366] hover:bg-[#20bd5a] px-10 py-6 font-black text-white text-xl shadow-[0_20px_40px_rgba(37,211,102,0.2)] transition-all active:scale-95"
                    >
                      <MessageCircle className="h-7 w-7" /> Commander par WhatsApp
                    </a>
                  ) : (
                    <Button size="lg" disabled className="w-full rounded-full h-20 font-black text-xl opacity-50">Vendeur Indisponible</Button>
                  )}
                  <div className="flex gap-4">
                    <Button variant="outline" onClick={handleShare} className="flex-1 h-16 rounded-full border-2 border-slate-100 font-black text-xs uppercase tracking-widest gap-3 hover:bg-slate-50">
                      <Share2 className="h-5 w-5" /> Partager l'offre
                    </Button>
                  </div>
                </div>
              ) : !showOrderForm ? (
                /* Direct Purchase Logic */
                <div className="space-y-6">
                  <Button size="lg" className="w-full h-20 bg-primary hover:bg-primary-dark rounded-full font-black text-xl shadow-[0_20px_40px_rgba(109,40,217,0.2)] transition-all" onClick={() => setShowOrderForm(true)}>
                    Finaliser la Commande
                  </Button>
                  <Button variant="outline" onClick={handleShare} className="w-full h-16 rounded-full border-2 border-slate-100 font-black text-xs uppercase tracking-widest gap-3 hover:bg-slate-50">
                    <Share2 className="h-5 w-5" /> Partager l'offre
                  </Button>
                </div>
              ) : (
                /* Order Form - Quality Luxury UI */
                <Card className="border-none bg-white shadow-3xl rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8">
                     <Package className="h-20 w-20 text-primary/5 rotate-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-display text-3xl font-black text-slate-900 tracking-tight">Vos Détails</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Informations de livraison</p>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nom & Prénom</Label>
                      <Input placeholder="Votre identité" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="h-16 rounded-2xl border-none bg-slate-50 px-6 font-bold text-lg focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Numéro WhatsApp</Label>
                      <Input type="tel" placeholder="+228" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="h-16 rounded-2xl border-none bg-slate-50 px-6 font-bold text-lg focus-visible:ring-primary" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quartier de livraison</Label>
                      <Select value={buyerNeighborhood} onValueChange={setBuyerNeighborhood}>
                        <SelectTrigger className="h-16 rounded-2xl border-none bg-slate-50 px-6 font-bold text-lg">
                          <SelectValue placeholder="Sélectionner" />
                        </SelectTrigger>
                        <SelectContent className="rounded-3xl border-none shadow-2xl p-4">
                          {neighborhoods.map(n => <SelectItem key={n} value={n} className="rounded-xl py-4 font-bold">{n}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-primary/2 space-y-6 border border-primary/5">
                    <div className="flex justify-between items-center group">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix Total</span>
                      <span className="text-3xl font-black text-primary font-display tracking-tighter leading-none">{formatCFA(displayPrice + (deliveryMethod === "delivery" ? ({"Zone A": 500, "Zone B": 1000, "Zone C": 1500, "Zone D": 2000, "Zone E": 2500}[deliveryZone] || 0) : 0))}</span>
                    </div>
                    <Button onClick={handleOrder} disabled={isProcessing} className="w-full h-16 bg-primary hover:bg-primary-dark rounded-full font-black text-lg transition-all shadow-xl shadow-primary/20">
                      {isProcessing ? "Finalisation..." : "Valider l'achat"}
                    </Button>
                    <button onClick={() => setShowOrderForm(false)} className="w-full text-center text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-primary transition-colors">
                      Modifier la commande
                    </button>
                  </div>
                </Card>
              )}
            </div>

            {/* Seller Identity - Editorial Style */}
            <div className="p-8 rounded-[2.5rem] bg-white shadow-sm border border-slate-50 flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-[-4deg] group-hover:rotate-0 transition-transform">
                  <Store className="h-8 w-8 text-white" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black text-slate-900 tracking-tight">{product.sellerName}</p>
                    <VerificationBadge status={product.sellerVerification} />
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.sellerType === "boutique" ? "Boutique Officielle" : "Particulier Certifié"}</p>
                </div>
              </div>
              <FollowButton sellerId={product.sellerId} />
            </div>

            {/* Trust Badges - Soft Integration */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50">
                <ShieldCheck className="h-6 w-6 text-primary/40" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction <br/> Sécurisée</p>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/50">
                <Package className="h-6 w-6 text-primary/40" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Vendeur <br/> Vérifié</p>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section - Content First */}
        <section className="mt-32 pt-32 border-t border-slate-50">
          <div className="flex items-center justify-between mb-12">
            <div className="space-y-2">
              <h2 className="font-display text-4xl font-black text-slate-900 tracking-tight">Expériences Clients</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Retours d'achat certifiés</p>
            </div>
            <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-full shadow-sm">
              <Star className="h-5 w-5 fill-primary text-primary" />
              <span className="font-black text-primary text-xl leading-none font-display">{avgRating}</span>
              <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Score Global</span>
            </div>
          </div>

          {reviews.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {reviews.map((review) => (
                <div key={review.id} className="p-10 rounded-[3rem] bg-white shadow-sm hover:shadow-xl transition-all border border-slate-50 space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-primary text-primary" : "text-slate-100"}`} />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <p className="text-slate-500 font-medium text-lg italic leading-relaxed">"{review.comment}"</p>
                  <div className="flex items-center gap-3 pt-6 border-t border-slate-50">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-xs">
                      {review.buyerName.charAt(0)}
                    </div>
                    <span className="text-sm font-black text-slate-900 uppercase tracking-tighter">{review.buyerName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-24 rounded-[3rem] bg-slate-50/50 border-2 border-dashed border-slate-100">
              <MessageCircle className="h-16 w-16 text-slate-200 mx-auto mb-6" />
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Premier arrivé, premier à s'exprimer !</p>
              <p className="text-slate-300 font-medium mt-1">Soyez le premier à donner votre avis sur cette pièce.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

