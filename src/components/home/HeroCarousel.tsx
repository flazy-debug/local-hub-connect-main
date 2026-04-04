import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingBag, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    id: 1,
    title: "Électronique Premium",
    subtitle: "Elite Tech Discovery",
    description: "Découvrez les dernières innovations mondiales. Smartphones, ordinateurs et gadgets haute performance au meilleur prix.",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=1000&auto=format&fit=crop",
    accent: "text-blue-600",
    bg: "bg-blue-50/50",
    icon: <Zap className="h-6 w-6" />,
    badge: "Nouveauté Tech"
  },
  {
    id: 2,
    title: "Mode & Luxe",
    subtitle: "Style & Élégance Collective",
    description: "Affirmez votre style avec notre sélection exclusive. Des pièces uniques pour un look sophistiqué et intemporel.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop",
    accent: "text-emerald-600",
    bg: "bg-emerald-50/50",
    icon: <Sparkles className="h-6 w-6" />,
    badge: "Collection Elite"
  },
  {
    id: 3,
    title: "Cuisine & Design",
    subtitle: "Art de Vivre Gourmand",
    description: "Équipez votre maison avec élégance. Ustensiles premium et saveurs authentiques pour des moments inoubliables.",
    image: "https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=1000&auto=format&fit=crop",
    accent: "text-amber-600",
    bg: "bg-amber-50/50",
    icon: <ShoppingBag className="h-6 w-6" />,
    badge: "Saveurs d'Excellence"
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
          className={`absolute inset-0 flex flex-col md:flex-row items-center px-10 md:px-20 ${slides[current].bg}`}
        >
          {/* Text Content */}
          <div className="flex-1 space-y-6 z-10 py-10 md:py-0">
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

             <div className="space-y-2">
               <motion.p 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3 }}
                 className={`text-sm md:text-md font-bold uppercase tracking-[0.3em] ${slides[current].accent}`}
               >
                 {slides[current].subtitle}
               </motion.p>
               <motion.h1 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-[0.9]"
               >
                 {slides[current].title}
               </motion.h1>
             </div>

             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.5 }}
               className="text-slate-600 text-lg max-w-xl leading-relaxed"
             >
               {slides[current].description}
             </motion.p>

             <motion.div
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.6 }}
               className="flex flex-wrap gap-4"
             >
               <Button className="h-14 px-10 rounded-2xl bg-slate-900 text-white font-bold text-lg hover:scale-105 transition-transform shadow-xl shadow-slate-900/20">
                 Acheter maintenant
               </Button>
               <Button variant="outline" className="h-14 px-10 rounded-2xl border-2 border-slate-900/10 font-bold text-lg hover:bg-white/50 transition-all">
                 Tous les produits
               </Button>
             </motion.div>
          </div>

          {/* Image Content */}
          <div className="flex-1 relative h-full w-full flex items-center justify-center mt-8 md:mt-0">
             <motion.div
               initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
               animate={{ opacity: 1, scale: 1, rotate: 0 }}
               transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
               className="relative z-10 w-full max-w-md aspect-square rounded-[40px] overflow-hidden shadow-2xl"
             >
               <img 
                 src={slides[current].image} 
                 alt={slides[current].title}
                 className="w-full h-full object-cover"
               />
             </motion.div>
             {/* Decorative element */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/30 rounded-full blur-3xl -z-0" />
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
