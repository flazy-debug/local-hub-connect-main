import * as React from "react";
import { ShoppingBag, ChevronRight, Truck } from "lucide-react";
import { useCart } from "@/lib/cart-store";
import { formatCFA } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { getDeliveryFee } from "@/lib/delivery-logic";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export function StickyCheckout() {
  const { items, getTotal } = useCart();
  const { userNeighborhood } = useAuth();
  
  if (items.length === 0) return null;

  const subtotal = getTotal();
  const deliveryFee = userNeighborhood ? getDeliveryFee(userNeighborhood) : 0;
  const isDelivery = items.some(i => i.deliveryMethod === "delivery");
  const total = subtotal + (isDelivery ? deliveryFee : 0);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:hidden animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="container p-0">
        <Link 
          to="/panier"
          className="flex items-center justify-between bg-[#142642] text-white p-5 rounded-[2rem] shadow-2xl shadow-[#142642]/40 active:scale-95 transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="relative h-12 w-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <ShoppingBag className="h-6 w-6 text-white" />
              <span className="absolute -top-2 -right-2 bg-accent text-white text-[10px] font-black h-5 w-5 rounded-full flex items-center justify-center border-2 border-[#142642]">
                {items.length}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-none mb-1">Voir mon Panier</span>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight">{formatCFA(total)}</span>
                {isDelivery && userNeighborhood && (
                  <div className="flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-full">
                    <Truck className="h-2.5 w-2.5 text-accent" />
                    <span className="text-[8px] font-bold text-accent uppercase">Inclus</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
            <ChevronRight className="h-5 w-5 text-white" />
          </div>
        </Link>
      </div>
      {/* Visual safe area spacing for iOS notched phones */}
      <div className="h-safe-area-bottom w-full bg-transparent" />
    </div>
  );
}
