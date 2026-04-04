import { Link } from "react-router-dom";
import { Shop } from "@/lib/types";
import { MapPin, Package, Users } from "lucide-react";
import VerificationBadge from "@/components/VerificationBadge";

export default function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Link to={`/boutique/${shop.id}`} className="group block">
      <div className="flex items-center gap-6 rounded-[2rem] border-none bg-white p-5 transition-all duration-500 shadow-soft hover:shadow-premium hover:-translate-y-1">
        <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-slate-50 shadow-inner group-hover:scale-105 transition-transform duration-500">
          <img src={shop.image} alt={shop.name} className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display font-black text-primary text-xl uppercase tracking-tighter group-hover:text-accent transition-colors">{shop.name}</h3>
            <VerificationBadge status={shop.verificationStatus} />
          </div>
          <p className="text-sm font-medium text-slate-400 line-clamp-1 mb-3 italic">"{shop.description || "Collection exclusive"}"</p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><MapPin className="h-3 w-3 text-accent/50" />{shop.neighborhood}</span>
            <span className="flex items-center gap-1.5 border-l border-slate-100 pl-4"><Package className="h-3 w-3 text-accent/50" />{shop.productCount} Articles</span>
            {(shop.followerCount ?? 0) > 0 && (
              <span className="flex items-center gap-1.5 border-l border-slate-100 pl-4"><Users className="h-3 w-3 text-accent/50" />{shop.followerCount} Curateurs</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
