import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PromoBannerProps {
  title: string;
  discount: string;
  description: string;
  image: string;
  color: string;
  className?: string;
}

export default function PromoBanner({ title, discount, description, image, color, className }: PromoBannerProps) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={cn(
        "relative overflow-hidden rounded-[40px] p-8 min-h-[320px] flex flex-col justify-end group cursor-pointer",
        color,
        className
      )}
    >
      <div className="absolute top-8 right-8 z-10">
        <span className="text-4xl md:text-6xl font-black opacity-20 tracking-tighter uppercase whitespace-nowrap">
          {discount}
        </span>
      </div>

      <div className="relative z-10 space-y-3">
        <h3 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
          {title}
        </h3>
        <p className="text-slate-600 font-medium text-sm md:text-base max-w-[200px]">
          {description}
        </p>
        <Button variant="link" className="p-0 h-auto font-black text-slate-900 gap-2 group-hover:gap-3 transition-all">
          En profiter <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="absolute top-0 right-0 w-1/2 h-full -z-0">
        <img 
          src={image} 
          alt="" 
          className="w-full h-full object-contain object-right-bottom transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop";
          }}
        />
      </div>
      
      {/* Decorative Blur */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full" />
    </motion.div>
  );
}
