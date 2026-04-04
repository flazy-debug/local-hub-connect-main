import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShoppingBag, 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Truck, 
  Star,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ProductCard from "@/components/ProductCard";
import AnnouncementBar from "@/components/AnnouncementBar";
import HeroCarousel from "@/components/home/HeroCarousel";
import PromoBanner from "@/components/home/PromoBanner";
import { motion } from "framer-motion";
import { categories } from "@/lib/mock-data";
import { useProducts } from "@/hooks/useProducts";
import { formatCFA } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const { products, loading } = useProducts();

  const featuredProducts = products?.filter(p => (p as any).isBoosted).slice(0, 8) || [];
  const latestProducts = products?.slice(0, 12) || [];

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementBar />
      
      {/* Hero Section - Full Width */}
      <section className="w-full">
        <HeroCarousel />
      </section>

      {/* Categories Section (Moved to Top for V1.1) */}
      <section className="py-20 bg-background relative overflow-hidden">
        <div className="container relative z-10">
          <div className="mb-14 flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight font-display">
                Nos <span className="text-primary">Univers</span>
              </h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">L'excellence dans chaque catégorie</p>
            </div>
            <Link to="/tous-les-produits">
              <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest text-slate-900 gap-3 rounded-full hover:bg-primary/5 px-6">
                Explorer <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-4 md:grid-cols-8 gap-5 md:gap-10">
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                whileHover={{ y: -8 }}
                className="group cursor-pointer flex flex-col items-center space-y-4"
                onClick={() => cat.id === 'location-voiture' ? window.open('https://voiket.com', '_blank') : navigate(`/tous-les-produits?category=${cat.id}`)}
              >
                <div className="h-20 w-20 md:h-24 md:w-24 bg-white rounded-full shadow-[0_12px_24px_rgba(20,27,43,0.04)] border-none flex items-center justify-center text-4xl transition-all duration-500 group-hover:shadow-[0_20px_48px_rgba(109,40,217,0.15)] group-hover:bg-primary group-hover:text-white">
                   {cat.icon === 'Car' ? '🚗' : cat.icon === 'Building' ? '🏢' : cat.icon === 'Smartphone' ? '📱' : cat.icon === 'Shirt' ? '👕' : cat.icon === 'Home' ? '🏠' : cat.icon === 'Briefcase' ? '💼' : cat.icon === 'Key' ? '🔑' : '✨'}
                </div>
                <h3 className="font-black text-slate-500 tracking-tight text-[11px] uppercase text-center group-hover:text-primary transition-colors">
                  {cat.name}
                </h3>
              </motion.div>
            ))}
          </div>
        </div>
        {/* Background Accent */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/2 rounded-full blur-[100px] translate-x-1/2 -translate-y-1/2" />
      </section>
      
      <main className="pb-32">
        {/* Featured Products - Tonal Shift Background */}
        <section className="py-24 bg-slate-50/50">
          <div className="container">
            <div className="flex items-center justify-between mb-12">
              <div className="space-y-2">
                <h2 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tight font-display">
                  Top <span className="text-primary">Boost</span>
                </h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Les meilleures opportunités sélectionnées</p>
              </div>
              <Link to="/tous-les-produits">
                <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest text-primary gap-3 rounded-full hover:bg-primary/5 px-6">
                  Voir tout <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
              {loading && featuredProducts.length === 0 && Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[400px] bg-slate-100 rounded-[2.5rem] animate-pulse" />
              ))}
            </div>
          </div>
        </section>

        {/* Voiket Banner - Editorial Integration */}
        <section className="py-12 container">
           <div 
             onClick={() => window.open("https://voiket.com", "_blank")}
             className="cursor-pointer group relative bg-primary rounded-[3rem] p-10 md:p-20 overflow-hidden shadow-2xl transition-all hover:scale-[1.005]"
           >
             <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="text-center md:text-left space-y-6">
                  <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-full text-white text-[10px] font-black uppercase tracking-widest">
                    🚗 Location d'Excellence
                  </div>
                  <h2 className="text-4xl md:text-7xl font-black text-white tracking-tight leading-none font-display">
                    Besoin de <br/> liberté ?
                  </h2>
                  <p className="text-white/60 text-lg md:text-xl font-bold max-w-md">
                    <span className="text-white">Voiket.com</span> : La référence de location de voiture au Togo.
                  </p>
                  <Button className="bg-white text-primary hover:bg-slate-50 rounded-full h-16 px-12 font-black text-lg shadow-xl shadow-black/10">
                    Louer sur Voiket
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute -inset-10 bg-white/20 blur-[100px] rounded-full animate-pulse" />
                  <img 
                    src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=800&auto=format&fit=crop" 
                    alt="Voiket Car" 
                    className="relative z-10 h-64 md:h-80 object-contain drop-shadow-[0_32px_64px_rgba(0,0,0,0.5)] transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
             </div>
           </div>
        </section>

        {/* Latest Arrivals */}
        <section className="py-32 container">
          <div className="flex items-center justify-between mb-14">
            <div className="space-y-2">
              <h2 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tight font-display">
                Nouveautés
              </h2>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Derniers arrivages des boutiques</p>
            </div>
            <Link to="/tous-les-produits">
              <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest text-slate-900 gap-3 rounded-full hover:bg-primary/5 px-6">
                Découvrir <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {latestProducts.slice(0, 12).map((product, i) => (
              <motion.div 
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </section>

        {/* Populaires - Tonal Shift */}
        <section className="py-32 bg-primary/2">
           <div className="container">
             <div className="flex items-center justify-between mb-14">
               <div className="space-y-2">
                 <h2 className="text-3xl md:text-6xl font-black text-slate-900 tracking-tight font-display">
                   Tendances
                 </h2>
                 <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Les produits les plus demandés</p>
               </div>
               <Link to="/tous-les-produits">
                 <Button variant="ghost" className="font-black text-[10px] uppercase tracking-widest text-primary gap-3 rounded-full hover:bg-primary/5 px-6">
                   Voir tout <ArrowRight className="h-5 w-5" />
                 </Button>
               </Link>
             </div>
             
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
               {products?.slice(4, 12).map(product => (
                 <ProductCard key={product.id} product={product} />
               ))}
             </div>
           </div>
        </section>

        {/* Branding Banner - High Impact */}
        <section className="py-24 container">
           <div className="bg-primary rounded-[4rem] p-16 md:p-32 text-center space-y-12 relative overflow-hidden shadow-3xl">
             <div className="relative z-10 max-w-5xl mx-auto space-y-10">
                <h2 className="text-4xl md:text-9xl font-black text-white tracking-widest uppercase leading-[0.8] font-display">
                  Epure <br /> Market
                </h2>
                <div className="space-y-6">
                  <p className="text-white/60 text-xl md:text-3xl font-bold max-w-3xl mx-auto leading-relaxed">
                    Le Marché Digital <span className="text-white">Premium</span>.<br /> Boutiques, Food & Services de Confiance.
                  </p>
                  <div className="pt-10 flex flex-wrap justify-center gap-6">
                    <Link to="/vendeur/login">
                      <Button size="lg" className="rounded-full bg-white text-primary hover:bg-slate-50 px-12 h-20 font-black text-xl shadow-2xl transition-all hover:scale-105 active:scale-95">
                        Ouvrir ma boutique
                      </Button>
                    </Link>
                    <Link to="/boutiques">
                      <Button size="lg" variant="outline" className="rounded-full border-2 border-white/20 text-white hover:bg-white/10 px-12 h-20 font-black text-xl backdrop-blur-md">
                        Visiter les boutiques
                      </Button>
                    </Link>
                  </div>
                </div>
             </div>
             {/* Abstract Shapes - Quiet Luxury */}
             <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
             <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-white/5 blur-[120px] rounded-full -translate-x-1/3 translate-y-1/3" />
           </div>
        </section>

        {/* Trust Badges - Soft UI Style */}
        <section className="py-32 border-none">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-20 text-center">
              {[
                { icon: ShieldCheck, text: "Sécurité Totale", sub: "Vos transactions sont protégées" },
                { icon: Truck, text: "Livraison Expert", sub: "Un service rapide & soigné" },
                { icon: Star, text: "Vendeurs Certifiés", sub: "Nous vérifions chaque partenaire" },
              ].map((feature, i) => (
                <div key={i} className="space-y-6 group">
                  <div className="h-24 w-24 bg-white shadow-[0_12px_48px_rgba(20,27,43,0.06)] rounded-[2.5rem] flex items-center justify-center mx-auto transition-all duration-500 group-hover:bg-primary group-hover:translate-y-[-10px]">
                    <feature.icon className="h-10 w-10 text-primary transition-colors duration-500 group-hover:text-white" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-black text-slate-900 font-display tracking-tight">{feature.text}</h4>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{feature.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Index;
