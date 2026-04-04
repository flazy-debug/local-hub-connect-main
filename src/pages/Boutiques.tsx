import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, MapPin, Search } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Shop } from "@/lib/types";
import { shops as mockShops } from "@/lib/mock-data";
import PageTransition from "@/components/PageTransition";
import PullToRefresh from "@/components/PullToRefresh";

export default function Boutiques() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchShops = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, shop_name, shop_description, avatar_url, neighborhood, whatsapp_number, verification_status, subscription_type")
        .not("shop_name", "is", null);

      if (error) throw error;

      if (data && data.length > 0) {
        // Get product counts per seller
        const sellerIds = data.map(p => p.user_id);
        const { data: products } = await supabase
          .from("products")
          .select("seller_id")
          .eq("is_active", true)
          .in("seller_id", sellerIds);

        const productCounts = new Map<string, number>();
        (products || []).forEach(p => {
          productCounts.set(p.seller_id, (productCounts.get(p.seller_id) || 0) + 1);
        });

        const { data: follows } = await supabase
          .from("follows")
          .select("seller_id")
          .in("seller_id", sellerIds);

        const followerCounts = new Map<string, number>();
        (follows || []).forEach(f => {
          followerCounts.set(f.seller_id, (followerCounts.get(f.seller_id) || 0) + 1);
        });

        const mapped: Shop[] = data
          .map(p => ({
            id: p.user_id,
            name: p.shop_name!,
            description: p.shop_description || "",
            image: p.avatar_url || "/placeholder.svg",
            neighborhood: p.neighborhood || "",
            whatsappNumber: p.whatsapp_number || "",
            productCount: productCounts.get(p.user_id) || 0,
            rating: 0,
            followerCount: followerCounts.get(p.user_id) || 0,
            verificationStatus: (p as any).verification_status || "none",
            subscriptionType: (p as any).subscription_type || "STANDARD"
          }));

        // Prioritize PARTNER and PRO, then sort by product count
        mapped.sort((a, b) => {
          const typeOrder: Record<string, number> = { PARTNER: 0, PRO: 1, BOOSTED: 2, STANDARD: 3 };
          const aOrder = typeOrder[a.subscriptionType as string] ?? 3;
          const bOrder = typeOrder[b.subscriptionType as string] ?? 3;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return b.productCount - a.productCount;
        });

        setShops(mapped);
      } else {
        setShops(mockShops);
      }
    } catch (err) {
      console.error("Error fetching shops:", err);
      setShops(mockShops);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchShops(); }, []);

  const handleRefresh = async () => { await fetchShops(); };

  const filtered = useMemo(() => {
    if (!search) return shops;
    const q = search.toLowerCase();
    return shops.filter(s =>
      s.name.toLowerCase().includes(q) || s.neighborhood.toLowerCase().includes(q)
    );
  }, [search, shops]);

  return (
    <PageTransition>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-[#f9f9ff] py-20 pb-40">
          <div className="container px-6 md:px-12">
            
            {/* Editorial Header */}
            <header className="max-w-4xl mb-24 relative">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-px w-12 bg-primary/20" />
                  <span className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Répertoire d'Excellence</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-display font-black text-slate-900 tracking-tighter leading-[0.9]">
                  L'univers <br/> 
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light italic">Epuremarket</span>
                </h1>
                <p className="max-w-xl text-slate-500 font-medium text-xl leading-relaxed italic">
                  Explorez notre sélection de boutiques partenaires, curatorées pour leur authenticité et leur sens du style.
                </p>
              </motion.div>

              {/* Minimalist Search Overlay */}
              <div className="mt-16 max-w-2xl relative group">
                <div className="absolute inset-0 bg-white/40 blur-2xl rounded-[3rem] -z-10 group-focus-within:bg-primary/5 transition-all" />
                <Search className="absolute left-8 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Rechercher une pièce, un créateur ou un lieu..."
                  className="h-20 pl-16 pr-8 rounded-full border-none bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-200/40 text-lg font-medium focus-visible:ring-primary/10 transition-all placeholder:text-slate-300"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </header>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-[4/5] rounded-[4rem] bg-slate-50 animate-pulse" />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
                {filtered.map((shop, index) => (
                  <motion.div
                    key={shop.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`group relative flex flex-col ${index % 2 === 1 ? 'md:mt-24' : ''}`}
                  >
                    {/* Visual Container */}
                    <Link to={`/boutique/${shop.id}`} className="relative block aspect-[4/5] overflow-hidden rounded-[4rem] mb-10 bg-slate-50 shadow-sm transition-all duration-700 group-hover:rounded-[3rem] group-hover:shadow-3xl group-hover:shadow-primary/10">
                      <img 
                        src={shop.image} 
                        alt={shop.name} 
                        className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      {/* Floating Badge */}
                      <div className="absolute top-8 right-8">
                        {shop.subscriptionType === 'PARTNER' ? (
                          <Badge className="bg-white/90 backdrop-blur-md text-primary border-none font-black px-5 py-2 text-[10px] uppercase tracking-widest rounded-full shadow-lg">
                            Partenaire Elite
                          </Badge>
                        ) : shop.subscriptionType === 'PRO' ? (
                          <Badge className="bg-primary text-white border-none font-black px-5 py-2 text-[10px] uppercase tracking-widest rounded-full shadow-lg">
                            Membre Pro
                          </Badge>
                        ) : null}
                      </div>

                      {/* Quick Action Overlay */}
                      <div className="absolute bottom-8 left-8 right-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                         <div className="bg-white/90 backdrop-blur-md p-6 rounded-3xl flex items-center justify-between shadow-2xl">
                           <div className="flex flex-col">
                             <span className="text-[10px] font-black text-primary uppercase tracking-widest">Voir la collection</span>
                             <span className="text-xl font-display font-black text-slate-900">{shop.productCount} Articles</span>
                           </div>
                           <div className="h-12 w-12 bg-primary rounded-2xl flex items-center justify-center text-white">
                             <ArrowRight className="h-6 w-6" />
                           </div>
                         </div>
                      </div>
                    </Link>

                    {/* Content Container */}
                    <div className="px-4 space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-3xl font-display font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">
                           {shop.name}
                         </h3>
                         {shop.verificationStatus === 'pro' && (
                           <div className="h-6 w-6 bg-primary/10 rounded-full flex items-center justify-center">
                             <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                           </div>
                         )}
                      </div>
                      
                      <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                        <MapPin className="h-3.5 w-3.5 text-primary/40" />
                        <span>{shop.neighborhood}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-200" />
                        <span>Vérifié</span>
                      </div>

                      <p className="text-slate-500 text-lg leading-relaxed font-medium italic line-clamp-2">
                        "{shop.description || "Une expérience shopping unique, redéfinie par l'élégance et la qualité."}"
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-40 rounded-[5rem] bg-white border border-slate-50 shadow-xl shadow-slate-200/20">
                <div className="h-32 w-32 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-10">
                  <Search className="h-12 w-12 text-slate-200" />
                </div>
                <h2 className="text-4xl font-display font-black text-slate-900 tracking-tight">Aucun résultat</h2>
                <p className="text-slate-400 mt-4 text-xl font-medium italic">Nous n'avons pas trouvé de boutique correspondant à votre recherche.</p>
                <Button 
                  onClick={() => setSearch("")}
                  variant="link" 
                  className="mt-8 text-primary font-black uppercase text-xs tracking-widest hover:no-underline"
                >
                  Réinitialiser l'exploration
                </Button>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>
    </PageTransition>
  );
}
