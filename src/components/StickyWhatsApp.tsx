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
    if (path === "/catalogue") return "Catalogue";
    if (path.includes("/boutique/")) return "Boutique d'un vendeur";
    if (path.includes("/dashboard")) return "Mon Tableau de Bord";
    if (path === "/pricing") return "Tarifs PRO";
    return "la plateforme";
  };

  const message = encodeURIComponent(`Bonjour VoiketMarket, j'ai une question sur ${getPageTitle()}.`);
  const whatsappUrl = `https://wa.me/${phoneNumber.replace("+", "")}?text=${message}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-20 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-green-500/20 md:bottom-10"
      aria-label="Contacter le support WhatsApp"
    >
      <div className="absolute -left-32 top-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-slate-800 shadow-sm md:flex hidden">
        Besoin d'aide ?
      </div>
      <MessageSquare className="h-7 w-7" />
      <span className="absolute -top-1 -right-1 flex h-4 w-4">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
        <span className="relative inline-flex h-4 w-4 rounded-full bg-white/20"></span>
      </span>
    </motion.a>
  );
}
