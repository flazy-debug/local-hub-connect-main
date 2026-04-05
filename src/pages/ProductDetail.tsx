import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Product, Review } from "@/lib/types";
import { NeighborhoodSelector } from "@/components/ui/NeighborhoodSelector";
import { RestaurantOptions } from "@/components/product/RestaurantOptions";
import { getDeliveryFee, getEstimatedDeliveryTime, isListingCategory, isDirectCheckout } from "@/lib/delivery-logic";
import { useCart } from "@/lib/cart-store";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Clock, ChefHat, Flame, Info, Star, MapPin, 
  ShoppingBag, Truck, ArrowLeft, Share2, 
  MessageCircle, Store, ShieldCheck, Package 
} from "lucide-react";
import { formatCFA, generateWhatsAppLink } from "@/lib/utils";
import { products as mockProducts } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import WishlistButton from "@/components/WishlistButton";
import VerificationBadge from "@/components/VerificationBadge";
import FollowButton from "@/components/FollowButton";

export default function ProductDetail() {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [product, setProduct] = useState<(Product & { promoPrice?: number, supplierPrice?: number, videoUrl?: string, isBoosted?: boolean }) | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [sellerWhatsapp, setSellerWhatsapp] = useState("");
  const [sellerSubscription, setSellerSubscription] = useState("STANDARD");
  const [partnerMarkup, setPartnerMarkup] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deliveryMethod, setDeliveryMethod] = useState<"pickup" | "delivery">("pickup");
  const [buyerNeighborhood, setBuyerNeighborhood] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { addItem } = useCart();

  const isRestaurant = product?.category === "restauration";
  const deliveryFee = buyerNeighborhood ? getDeliveryFee(buyerNeighborhood) : 0;
  const isListing = product ? isListingCategory(product.category) : false;
  const isDirect = product ? isDirectCheckout(product.category) : false;

  useEffect(() => {
    if (profile) {
      setBuyerName(profile.display_name || "");
      setBuyerPhone(profile.phone || "");
      if (profile.neighborhood) setBuyerNeighborhood(profile.neighborhood);
    }
  }, [profile]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const { data: dbProduct, error: prodError } = await supabase
        .from("products").select("*").eq("id", id).single();

      if (dbProduct) {
        const { data: sellerProfile } = await (supabase
          .from("profiles") as any)
          .select("display_name, shop_name, whatsapp_number, verification_status, subscription_type, partner_markup_percent")
          .eq("user_id", dbProduct.seller_id).single();

        const mapped: Product & { promoPrice?: number, supplierPrice?: number, videoUrl?: string, isBoosted?: boolean } = {
          id: dbProduct.id, 
          name: dbProduct.name, 
          description: dbProduct.description || "",
          price: dbProduct.price,
          images: dbProduct.images?.length > 0 ? dbProduct.images : ["/placeholder.svg"],
          category: dbProduct.category,
          condition: dbProduct.condition as "neuf" | "occasion",
          stock: dbProduct.stock, 
          sellerId: dbProduct.seller_id,
          sellerName: sellerProfile?.shop_name || sellerProfile?.display_name || "Vendeur",
          sellerType: sellerProfile?.shop_name ? "boutique" : "particulier",
          neighborhood: dbProduct.neighborhood, 
          rating: 0, 
          reviewCount: 0,
          pickupAvailable: dbProduct.pickup_available,
          deliveryAvailable: dbProduct.delivery_available,
          pickupAddress: dbProduct.pickup_address || undefined,
          sellerVerification: (sellerProfile as any)?.verification_status || "none",
          promoPrice: (dbProduct as any).promo_price || undefined,
          isBoosted: (dbProduct as any).is_boosted || false,
          videoUrl: (dbProduct as any).video_url || null,
          supplierPrice: (dbProduct as any).supplier_price || null,
          options: (dbProduct as any).options || null,
          transaction_type: (dbProduct as any).transaction_type || "vente",
          specifications: (dbProduct as any).specifications || {},
        };
        setProduct(mapped);
        setSellerWhatsapp(sellerProfile?.whatsapp_number || "");
        const sub = (sellerProfile as any)?.subscription_type || "STANDARD";
        setSellerSubscription(sub);
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
        if (mockProd) { 
          setProduct(mockProd); 
          setDeliveryMethod(mockProd.pickupAvailable ? "pickup" : "delivery"); 
        }
      }
      setLoading(false);
      
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

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) 
    : (product.rating || 0).toString();
  
  const isPartner = sellerSubscription === "PARTNER" || sellerSubscription === "partner";
  const calculatedPrice = (isPartner && product.supplierPrice)
    ? Math.round(product.supplierPrice * (1 + partnerMarkup / 100))
    : product.price;

  const displayPrice = product.promoPrice || calculatedPrice;
  const priceSuffix = product.transaction_type === 'location' ? "/ mois" : "";

  const handleOrder = async () => {
    if (!buyerName.trim() || !buyerPhone.trim() || !buyerNeighborhood) {
      toast.error("Veuillez remplir tous les champs obligatoires."); return;
    }
    
    if (isRestaurant && product.options?.variants) {
      const missing = (product.options as any).variants.filter((v: any) => v.required && !selectedOptions?.variants?.[v.name]);
      if (missing.length > 0) {
        toast.error(`Veuillez choisir : ${missing.map((m: any) => m.name).join(", ")}`);
        return;
      }
    }

    if (!user) { toast.error("Veuillez vous connecter."); navigate("/auth"); return; }

    setIsProcessing(true);
    try {
      const isExempt = ["monthly_flat", "partner", "PRO", "PARTNER"].includes(sellerSubscription.toUpperCase());
      const commissionRate = isExempt ? 0 : 0.10;
      const GATEWAY_FEE_RATE = 0.04;
      const dFee = deliveryMethod === "delivery" ? deliveryFee : 0;
      
      let finalItemPrice = displayPrice;
      if (selectedOptions?.extras && product.options?.extras) {
        const extraPrices = (product.options as any).extras
          .filter((e: any) => selectedOptions.extras.includes(e.name))
          .reduce((sum: number, e: any) => sum + e.price, 0);
        finalItemPrice += extraPrices;
      }

      const grandTotal = finalItemPrice + dFee;
      const networkFee = Math.round(finalItemPrice * GATEWAY_FEE_RATE);
      const platformComm = Math.round(finalItemPrice * commissionRate);
      const totalCommission = networkFee + platformComm;
      const sellerPayout = finalItemPrice - totalCommission;

      const { data: orderData, error: orderError } = await supabase
        .from("orders").insert({
          buyer_id: user.id, seller_id: product.sellerId,
          items: [{ 
            product_id: product.id, 
            name: product.name, 
            quantity: 1, 
            price: finalItemPrice,
            options: selectedOptions 
          }],
          total: grandTotal, 
          delivery_method: deliveryMethod,
          buyer_name: buyerName, 
          buyer_phone: buyerPhone,
          buyer_neighborhood: buyerNeighborhood, 
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

      if (sellerWhatsapp) {
        const link = generateWhatsAppLink(sellerWhatsapp, {
          id: (orderData as any).order_number, 
          items: [{ 
            name: product.name, 
            quantity: 1, 
            price: finalItemPrice,
            options: selectedOptions 
          }],
          total: grandTotal, 
          deliveryMethod, 
          neighborhood: buyerNeighborhood, 
          buyerName, 
          buyerPhone,
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
          title: product.name,
          text: `Découvrez ${product.name} sur Epuremarket !`,
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
          {/* Images Section */}
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
               <img src={product.images[0]} alt={product.name} className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105" />
            </div>

            <div className="grid grid-cols-4 gap-4">
              {product.images.slice(0, 4).map((img, i) => (
                <div key={i} className="aspect-square overflow-hidden rounded-3xl cursor-pointer hover:ring-2 ring-primary ring-offset-4 transition-all bg-white shadow-sm">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            
            {product.videoUrl && (
              <div className="overflow-hidden rounded-[2rem] bg-white shadow-lg relative group">
                <video src={product.videoUrl} controls className="aspect-video w-full object-cover" poster={product.images[0]} />
                <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md px-4 py-2 rounded-full text-white text-[9px] font-black uppercase tracking-widest">
                  🎥 Vidéo Produit
                </div>
              </div>
            )}
          </div>

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
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-6xl font-black text-primary tracking-tighter leading-none">{formatCFA(product.promoPrice)}</p>
                    {priceSuffix && <span className="text-xl font-bold text-slate-400 capitalize">{priceSuffix}</span>}
                  </div>
                  <p className="text-2xl text-slate-300 font-bold line-through mb-1">{formatCFA(product.price)}</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-baseline gap-2">
                    <p className="font-display text-6xl font-black text-primary tracking-tighter leading-none">{formatCFA(calculatedPrice)}</p>
                    {priceSuffix && <span className="text-xl font-bold text-slate-400 capitalize">{priceSuffix}</span>}
                  </div>
                  {product.category.toLowerCase().includes('service') && <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Tarif de base / Déplacement</p>}
                  {isPartner && <p className="text-[10px] font-black text-primary/40 uppercase tracking-widest">Tarif Partenaire Privilégié</p>}
                </div>
              )}

              {isRestaurant && (
                <div className="flex flex-wrap gap-4 py-4">
                  <div className="flex items-center gap-3 bg-secondary/10 border border-secondary/20 px-5 py-2.5 rounded-2xl shadow-sm">
                    <Clock className="h-5 w-5 text-secondary animate-pulse" />
                    <span className="text-sm font-black text-secondary uppercase tracking-tight">Prêt en 20-35 min</span>
                  </div>
                  <div className="flex items-center gap-3 bg-accent border border-accent/20 px-5 py-2.5 rounded-2xl shadow-lg shadow-accent/20">
                    <Flame className="h-5 w-5 text-white" />
                    <span className="text-sm font-black text-white uppercase tracking-tight">Coup de ❤️ Populaire</span>
                  </div>
                </div>
              )}

              <p className="text-slate-500 font-medium leading-relaxed text-lg pt-4 border-t border-slate-50">{product.description}</p>
            </div>

            {isRestaurant && product.options && (
              <RestaurantOptions options={product.options as any} onUpdate={setSelectedOptions} className="pt-4" />
            )}

            {isListing && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6 pb-4">
                  <div className="p-6 rounded-[2rem] bg-white shadow-sm space-y-2 group hover:bg-primary transition-colors duration-500">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white/60">Emplacement</span>
                    <p className="text-lg font-black text-slate-900 group-hover:text-white">{product.neighborhood}</p>
                  </div>
                  <div className="p-6 rounded-[2rem] bg-white shadow-sm space-y-2 group group-hover:bg-primary transition-colors duration-500">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest group-hover:text-white/60">Rubrique</span>
                    <p className="text-lg font-black text-slate-900 uppercase group-hover:text-white">{product.category}</p>
                  </div>
                </div>

                {/* Caractéristiques Section */}
                <div className="p-8 rounded-[2.5rem] bg-slate-50/50 border border-slate-100 space-y-6">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Caractéristiques</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {product.category === "immobilier" ? (
                      <>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
                          <span className="text-xl">🏠</span>
                          <span className="text-xs font-black text-slate-900 uppercase">{product.specifications?.rooms || "—"} Pièces</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
                          <span className="text-xl">📐</span>
                          <span className="text-xs font-black text-slate-900 uppercase">{product.specifications?.surface || "—"} m²</span>
                        </div>
                      </>
                    ) : product.category === "véhicules" || product.category === "vehicules" ? (
                      <>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
                          <span className="text-xl">🚗</span>
                          <span className="text-xs font-black text-slate-900 uppercase">{product.specifications?.fuel || "Essence"}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
                          <span className="text-xl">🕹️</span>
                          <span className="text-xs font-black text-slate-900 uppercase capitalize">{product.specifications?.transmission || "Manuelle"}</span>
                        </div>
                        {product.specifications?.km && (
                          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
                            <span className="text-xl">🛣️</span>
                            <span className="text-xs font-black text-slate-900 uppercase">{product.specifications.km} KM</span>
                          </div>
                        )}
                        {product.specifications?.year && (
                          <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
                            <span className="text-xl">📅</span>
                            <span className="text-xs font-black text-slate-900 uppercase">{product.specifications.year}</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
                          <ShieldCheck className="h-5 w-5 text-primary/40" />
                          <span className="text-xs font-black text-slate-900 uppercase">Vérifié</span>
                        </div>
                        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl shadow-sm">
                          <Package className="h-5 w-5 text-primary/40" />
                          <span className="text-xs font-black text-slate-900 uppercase">Premium</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {isDirect && !showOrderForm && (
              <div className="space-y-6">
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
            )}

            <div className="pt-8 border-t border-slate-50">
              {isListing ? (
                <div className="space-y-6">
                  {sellerWhatsapp ? (
                    <div className="flex flex-col gap-3">
                      <Button 
                        size="lg"
                        onClick={() => window.open(generateWhatsAppLink(sellerWhatsapp, { 
                          id: product.name, 
                          items: [{ name: product.name, quantity: 1, price: displayPrice }],
                          total: displayPrice,
                          deliveryMethod: "pickup",
                          neighborhood: product.neighborhood || "",
                          buyerName: profile?.display_name || "Client",
                          buyerPhone: profile?.phone || ""
                        }), "_blank")}
                        className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white h-20 rounded-full font-black uppercase text-xl shadow-[0_20px_40px_rgba(37,211,102,0.2)] transition-all active:scale-95"
                      >
                        <MessageCircle className="mr-3 h-7 w-7" /> Contacter sur WhatsApp
                      </Button>
                      <Button 
                        variant="ghost"
                        onClick={() => window.location.href = `tel:${sellerWhatsapp}`} 
                        className="w-full h-16 rounded-full font-black text-slate-900 uppercase text-xs tracking-[0.2em] hover:bg-slate-50"
                      >
                        Appeler le Vendeur
                      </Button>
                    </div>
                  ) : (
                    <Button size="lg" disabled className="w-full rounded-full h-20 font-black text-xl bg-slate-100 text-slate-400 border-none shadow-none">
                      Momentanément indisponible
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleShare} className="w-full h-16 rounded-full border-2 border-slate-100 font-black text-xs uppercase tracking-widest gap-3">
                    <Share2 className="h-5 w-5" /> Partager l'offre
                  </Button>
                </div>
              ) : !showOrderForm ? (
                <div className="space-y-6">
                  {product.category.toLowerCase().includes('service') ? (
                    <Button 
                      size="lg"
                      onClick={() => window.open(generateWhatsAppLink(sellerWhatsapp, { 
                        id: "DEVIS-" + product.name, 
                        items: [{ name: product.name, quantity: 1, price: displayPrice }],
                        total: displayPrice,
                        deliveryMethod: "pickup",
                        neighborhood: product.neighborhood || "",
                        buyerName: profile?.display_name || "Client",
                        buyerPhone: profile?.phone || ""
                      }), "_blank")}
                      className="w-full bg-primary hover:bg-primary/90 text-white h-20 rounded-full font-black uppercase text-xl shadow-2xl shadow-primary/20 transition-all hover:scale-[1.02]"
                    >
                      <MessageCircle className="mr-3 h-7 w-7" /> Demander un Devis (WhatsApp)
                    </Button>
                  ) : (
                    <Button size="lg" className="w-full h-20 bg-primary hover:bg-primary-dark rounded-full font-black text-xl shadow-xl transition-all" onClick={() => setShowOrderForm(true)}>
                      Finaliser la Commande
                    </Button>
                  )}
                  <Button variant="outline" onClick={handleShare} className="w-full h-16 rounded-full border-2 border-slate-100 font-black text-xs uppercase tracking-widest gap-3">
                    <Share2 className="h-5 w-5" /> Partager l'offre
                  </Button>
                </div>
              ) : (
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
                      <Input placeholder="Votre identité" value={buyerName} onChange={e => setBuyerName(e.target.value)} className="h-16 rounded-2xl border-none bg-slate-50 px-6 font-bold text-lg" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Numéro WhatsApp</Label>
                      <Input type="tel" placeholder="+228" value={buyerPhone} onChange={e => setBuyerPhone(e.target.value)} className="h-16 rounded-2xl border-none bg-slate-50 px-6 font-bold text-lg" />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Où voulez-vous être livré ?</Label>
                      <NeighborhoodSelector value={buyerNeighborhood} onSelect={setBuyerNeighborhood} placeholder="Rechercher mon quartier..." />
                    </div>
                  </div>

                  <div className="p-8 rounded-[2rem] bg-primary/2 space-y-6 border border-primary/5">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                        <span>Sous-total</span>
                        <span>{formatCFA(displayPrice)}</span>
                      </div>
                      {deliveryMethod === "delivery" && buyerNeighborhood && (
                        <div className="flex justify-between items-center text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <span>Livraison ({getEstimatedDeliveryTime(buyerNeighborhood)})</span>
                          <span className="text-primary">{formatCFA(deliveryFee)}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-primary/5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prix Total</span>
                      <span className="text-3xl font-black text-primary font-display tracking-tighter">
                        {formatCFA(displayPrice + (deliveryMethod === "delivery" ? deliveryFee : 0))}
                      </span>
                    </div>
                    <Button onClick={handleOrder} disabled={isProcessing} className="w-full h-16 bg-primary hover:bg-primary-dark rounded-full font-black text-lg transition-all shadow-lg shadow-primary/20">
                      {isProcessing ? "Finalisation..." : "🔒 Valider l'achat"}
                    </Button>
                    <button onClick={() => setShowOrderForm(false)} className="w-full text-center text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-primary transition-colors">
                      Modifier la commande
                    </button>
                  </div>
                </Card>
              )}
            </div>

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
                <div key={review.id} className="p-10 rounded-[3rem] bg-white shadow-sm border border-slate-50 space-y-6">
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
