import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    id: 1,
    title: "Art de Vivre Gourmand",
    subtitle: "Cuisine & Design Moderne",
    description: "Équipez votre maison avec élégance. Ustensiles premium et saveurs authentiques pour des moments inoubliables.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1600&auto=format&fit=crop",
    accent: "text-white",
    bg: "bg-black/40",
    icon: <Zap className="h-6 w-6" />,
    badge: "Saveurs d'Excellence"
  },
  {
    id: 2,
    title: "Mode & Luxe",
    subtitle: "Showroom Élite",
    description: "Affirmez votre style avec notre sélection exclusive. Des pièces uniques pour un look sophistiqué et intemporel.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop",
    accent: "text-white",
    icon: <Sparkles className="h-6 w-6" />,
    badge: "Collection Elite"
  },
  {
    id: 3,
    title: "Électronique Premium",
    subtitle: "High-Tech Discovery",
    description: "Découvrez les dernières innovations mondiales. Smartphones, ordinateurs et gadgets haute performance au meilleur prix.",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1600&auto=format&fit=crop",
    accent: "text-white",
    icon: <ShoppingBag className="h-6 w-6" />,
    badge: "Innovation Tech"
  }
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prev = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(next, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-[600px] overflow-hidden bg-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 bg-cover bg-center flex items-center justify-center"
          style={{ backgroundImage: `url(${slides[current].image})` }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-[blur-1px]" />

          {/* Centered Content */}
          <div className="relative z-10 w-full max-w-5xl px-6 md:px-10 flex flex-col items-center justify-center text-center space-y-8">
             <motion.div
               initial={{ opacity: 0, y: 30 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-sm border border-black/5"
             >
               <span className={`${slides[current].accent}`}>
                 {slides[current].icon}
               </span>
               <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-800">
                 {slides[current].badge}
               </span>
             </motion.div>

              <div className="space-y-4">
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-white/80 text-sm md:text-xl font-black uppercase tracking-[0.4em]"
                >
                  {slides[current].subtitle}
                </motion.p>
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-4xl md:text-8xl font-black text-white tracking-tighter leading-[0.95]"
                >
                  {slides[current].title}
                </motion.h1>
              </div>

             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 }}
               className="text-white/90 text-lg md:text-2xl max-w-2xl leading-relaxed font-medium"
             >
               {slides[current].description}
             </motion.p>

             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.6 }}
               className="flex flex-col md:flex-row items-center justify-center gap-4 w-full md:w-auto"
             >
               <Button className="w-full md:w-auto h-16 px-12 rounded-full bg-primary text-white font-black text-lg hover:scale-105 transition-transform shadow-2xl shadow-primary/40 uppercase tracking-widest">
                 Démarrer mes achats
               </Button>
               <Button variant="outline" className="w-full md:w-auto h-16 px-12 rounded-full border-2 border-white/20 bg-white/10 backdrop-blur-md text-white font-black text-lg hover:bg-white/20 transition-all uppercase tracking-widest">
                 Tous les produits
               </Button>
             </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
      {/* Controls */}
      <div className="absolute bottom-10 left-10 md:left-20 flex gap-3 z-20">
        <button onClick={prev} className="h-12 w-12 rounded-full border-2 border-slate-900/10 flex items-center justify-center hover:bg-white transition-colors">
          <ChevronLeft className="h-6 w-6 text-slate-900" />
        </button>
        <button onClick={next} className="h-12 w-12 rounded-full border-2 border-slate-900/10 flex items-center justify-center hover:bg-white transition-colors">
          <ChevronRight className="h-6 w-6 text-slate-900" />
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-10 right-10 md:right-20 flex gap-2 z-20">
        {slides.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-slate-900' : 'w-2 bg-slate-900/20'}`} 
          />
        ))}
      </div>
    </div>
  );
}
