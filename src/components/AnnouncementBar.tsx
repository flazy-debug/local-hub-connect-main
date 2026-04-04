import { motion } from "framer-motion";
import { Sparkles, Truck } from "lucide-react";

export default function AnnouncementBar() {
  return (
    <div className="bg-emerald-dark text-white overflow-hidden py-2 relative z-50">
      <motion.div 
        initial={{ x: "100%" }}
        animate={{ x: "-100%" }}
        transition={{ 
          duration: 20, 
          repeat: Infinity, 
          ease: "linear" 
        }}
        className="flex items-center gap-12 whitespace-nowrap text-[11px] font-black uppercase tracking-widest letter-spacing-2"
      >
        <span className="flex items-center gap-2">
          <Truck className="h-3 w-3 text-emerald-300" /> 
          Livraison Gratuite pour toute commande &gt; 25.000 CFA
        </span>
        <span className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-emerald-300" />
          -10% sur votre première commande avec le code: EPUREV2
        </span>
        <span className="flex items-center gap-2">
          <Truck className="h-3 w-3 text-emerald-300" /> 
          Livraison Gratuite pour toute commande &gt; 25.000 CFA
        </span>
        <span className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-emerald-300" />
          -10% sur votre première commande avec le code: EPUREV2
        </span>
      </motion.div>
    </div>
  );
}
