import { Link, useNavigate } from "react-router-dom";
import { Product } from "@/lib/types";
import { formatCFA } from "@/lib/utils";
import { User, ArrowRight, MapPin } from "lucide-react";
import { motion } from "framer-motion";

export default function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      onClick={() => navigate(`/produit/${product.id}`)}
      className="group card-lift h-full cursor-pointer flex flex-col"
    >
      {/* Product Image Wrapper */}
      <div className="relative aspect-[4/5] overflow-hidden p-3 pb-0">
        <div className="relative h-full w-full overflow-hidden rounded-[1.75rem] bg-slate-50/50">
          <img
            src={product.images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop"}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          
          {/* Shop Badge (Floating) */}
          <div className="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 z-20">
            <div className="bg-white/90 backdrop-blur-xl text-primary text-[9px] font-black py-2.5 px-4 rounded-2xl flex items-center justify-between border-none shadow-[0_8px_32px_rgba(0,0,0,0.05)]">
              <span className="truncate uppercase tracking-wider">{product.sellerName || "Épure Boutique"}</span>
              <div className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
            </div>
          </div>

          {/* New/Promo Badge */}
          {product.promo_price && (
            <div className="absolute top-4 left-4 bg-primary text-white text-[9px] font-black px-4 py-2 rounded-full shadow-lg z-20 uppercase tracking-widest">
              Elite
            </div>
          )}

          {/* Neighborhood Badge (Local Trust) */}
          <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md text-slate-600 text-[9px] font-black px-4 py-2 rounded-full z-20 flex items-center gap-2">
            <MapPin className="h-3 w-3 text-primary/60" />
            <span className="uppercase tracking-[0.1em]">{product.neighborhood || "Lomé"}</span>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="flex flex-col p-6 pt-5 space-y-4 flex-1">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5">
            <span className="w-1 h-1 rounded-full bg-primary/40" />
            {product.category}
          </div>
          <h3 className="line-clamp-2 text-base font-black tracking-tight text-slate-900 group-hover:text-primary transition-colors leading-tight font-display">
            {product.name}
          </h3>
        </div>
        
        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {product.promo_price ? (
              <>
                <span className="text-[10px] text-slate-400 line-through font-bold mb-0.5">
                  {formatCFA(product.price)}
                </span>
                <span className="text-xl font-black text-slate-900 tracking-tight font-display">
                  {formatCFA(product.promo_price)}
                </span>
              </>
            ) : (
              <span className="text-xl font-black text-slate-900 tracking-tight font-display">
                {formatCFA(product.price)}
              </span>
            )}
          </div>
          
          <div className="h-11 w-11 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all transform group-hover:rotate-[-45deg] group-hover:scale-110">
             <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
