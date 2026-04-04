import { MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

export default function StickyWhatsApp() {
  const location = useLocation();
  const phoneNumber = "+22899797499";
  
  // Get a readable page title based on the pathname
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/") return "Accueil";
    if (path === "/tous-les-produits") return "Tous les produits";
    if (path.includes("/boutique/")) return "Boutique d'un vendeur";
    if (path.includes("/dashboard")) return "Mon Tableau de Bord";
    if (path === "/pricing") return "Tarifs PRO";
    return "la plateforme";
  };

  const message = encodeURIComponent(`Bonjour Epuremarket, j'ai une question sur ${getPageTitle()}.`);
  const whatsappUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${message}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1, y: [0, -5, 0] }}
      transition={{ 
        duration: 0.5,
        y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
      }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#10B981] text-white shadow-xl shadow-emerald-500/30 md:bottom-10"
      aria-label="Contacter le support WhatsApp"
    >
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-800 shadow-lg md:flex hidden border border-slate-50">
        Besoin d'aide ?
      </div>
      <MessageSquare className="h-7 w-7 fill-white/10" />
      <span className="absolute -top-1 -right-1 flex h-5 w-5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75"></span>
        <span className="relative inline-flex h-5 w-5 rounded-full bg-orange-500 border-2 border-white"></span>
      </span>
    </motion.a>
  );
}
