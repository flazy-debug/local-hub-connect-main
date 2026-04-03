import { Product, Shop, Category, Order, Review } from "./types";

export const categories: Category[] = [
  { id: "restauration", name: "🍽️ Restaurants", icon: "UtensilsCrossed" },
  { id: "fast-food", name: "🍔 Fast-Food", icon: "Pizza" },
  { id: "epicerie", name: "🛒 Épicerie", icon: "ShoppingBasket" },
  { id: "mode", name: "👗 Mode & Vêtements", icon: "Shirt" },
  { id: "electronique", name: "📱 Électronique", icon: "Smartphone" },
  { id: "maison", name: "🏠 Maison & Déco", icon: "Home" },
  { id: "beaute", name: "✨ Beauté & Bien-être", icon: "Sparkles" },
  { id: "artisanat", name: "🎨 Artisanat Local", icon: "Palette" },
  { id: "services", name: "💼 Services Professionnels", icon: "Briefcase" },
];

export const neighborhoods = [
  "Agbalépédogan", "Adidogomé", "Bè", "Tokoin", "Nyékonakpoè",
  "Hédzranawoé", "Agoè", "Kégué", "Djidjolé", "Kodjoviakopé",
];

export const products: Product[] = [
  {
    id: "1",
    name: "Robe Wax Ankara Élégante",
    description: "Magnifique robe en tissu wax authentique, coupe moderne et ajustée. Idéale pour les cérémonies et événements.",
    price: 15000,
    images: ["/placeholder.svg"],
    category: "mode",
    condition: "neuf",
    stock: 8,
    sellerId: "shop1",
    sellerName: "Boutique Afi Mode",
    sellerType: "boutique",
    neighborhood: "Tokoin",
    rating: 4.7,
    reviewCount: 23,
    pickupAvailable: true,
    deliveryAvailable: true,
    pickupAddress: "Marché de Tokoin, Stand 42",
  },
  {
    id: "2",
    name: "Samsung Galaxy A14 - Occasion",
    description: "Samsung Galaxy A14 en très bon état, batterie 90%, livré avec chargeur. Débloqué tout opérateur.",
    price: 55000,
    images: ["/placeholder.svg"],
    category: "electronique",
    condition: "occasion",
    stock: 1,
    sellerId: "user1",
    sellerName: "Kofi M.",
    sellerType: "particulier",
    neighborhood: "Agbalépédogan",
    rating: 4.2,
    reviewCount: 5,
    pickupAvailable: true,
    deliveryAvailable: false,
    pickupAddress: "Agbalépédogan, près du carrefour GTA",
  },
  {
    id: "3",
    name: "Beurre de Karité Bio 500g",
    description: "Beurre de karité 100% naturel et non raffiné. Idéal pour la peau et les cheveux.",
    price: 3500,
    images: ["/placeholder.svg"],
    category: "beaute",
    condition: "neuf",
    stock: 25,
    sellerId: "shop2",
    sellerName: "Nature & Beauté TG",
    sellerType: "boutique",
    neighborhood: "Hédzranawoé",
    rating: 4.9,
    reviewCount: 67,
    pickupAvailable: true,
    deliveryAvailable: true,
    pickupAddress: "Hédzranawoé, à côté de la pharmacie",
  },
  {
    id: "4",
    name: "Table Basse en Bois Recyclé",
    description: "Table basse artisanale fabriquée à partir de bois recyclé. Pièce unique, finition vernis.",
    price: 45000,
    images: ["/placeholder.svg"],
    category: "artisanat",
    condition: "neuf",
    stock: 2,
    sellerId: "shop3",
    sellerName: "ArtiBois Togo",
    sellerType: "boutique",
    neighborhood: "Adidogomé",
    rating: 4.5,
    reviewCount: 12,
    pickupAvailable: true,
    deliveryAvailable: true,
  },
  {
    id: "5",
    name: "Jus de Bissap Naturel (Pack 6)",
    description: "Pack de 6 bouteilles de jus de bissap fait maison, sans conservateurs, 33cl chacune.",
    price: 6000,
    images: ["/placeholder.svg"],
    category: "alimentation",
    condition: "neuf",
    stock: 15,
    sellerId: "shop4",
    sellerName: "Saveurs du Togo",
    sellerType: "boutique",
    neighborhood: "Bè",
    rating: 4.8,
    reviewCount: 34,
    pickupAvailable: true,
    deliveryAvailable: true,
    pickupAddress: "Bè Kpota, maison blanche face à l'école",
  },
  {
    id: "6",
    name: "Écouteurs Bluetooth JBL - Occasion",
    description: "Écouteurs JBL Tune 510BT, bon état, son excellent. Vendu sans boîte.",
    price: 12000,
    images: ["/placeholder.svg"],
    category: "electronique",
    condition: "occasion",
    stock: 1,
    sellerId: "user2",
    sellerName: "Amavi K.",
    sellerType: "particulier",
    neighborhood: "Kégué",
    rating: 4.0,
    reviewCount: 3,
    pickupAvailable: true,
    deliveryAvailable: false,
  },
];

export const shops: Shop[] = [
  {
    id: "shop1",
    name: "Boutique Afi Mode",
    description: "Mode africaine moderne pour femmes et hommes",
    image: "/placeholder.svg",
    neighborhood: "Tokoin",
    whatsappNumber: "+22890123456",
    productCount: 45,
    rating: 4.7,
  },
  {
    id: "shop2",
    name: "Nature & Beauté TG",
    description: "Produits de beauté naturels et bio du Togo",
    image: "/placeholder.svg",
    neighborhood: "Hédzranawoé",
    whatsappNumber: "+22891234567",
    productCount: 32,
    rating: 4.9,
  },
  {
    id: "shop3",
    name: "ArtiBois Togo",
    description: "Meubles et objets décoratifs en bois artisanal",
    image: "/placeholder.svg",
    neighborhood: "Adidogomé",
    whatsappNumber: "+22892345678",
    productCount: 18,
    rating: 4.5,
  },
  {
    id: "shop4",
    name: "Saveurs du Togo",
    description: "Produits alimentaires locaux et boissons naturelles",
    image: "/placeholder.svg",
    neighborhood: "Bè",
    whatsappNumber: "+22893456789",
    productCount: 27,
    rating: 4.8,
  },
];

export const sampleOrders: Order[] = [
  {
    id: "CMD-2024-001",
    items: [],
    total: 21000,
    commission: 2100,
    sellerPayout: 18900,
    status: "shipped",
    buyerName: "Essi A.",
    buyerPhone: "+22894567890",
    buyerNeighborhood: "Djidjolé",
    createdAt: "2024-01-15T10:30:00Z",
  },
];

export const sampleReviews: Review[] = [
  {
    id: "r1",
    productId: "1",
    buyerName: "Marie D.",
    rating: 5,
    comment: "Très belle robe, la qualité du tissu est exceptionnelle. Livraison rapide !",
    createdAt: "2024-01-10T14:00:00Z",
  },
  {
    id: "r2",
    productId: "1",
    buyerName: "Akouvi T.",
    rating: 4,
    comment: "Joli modèle, mais la taille est un peu grande. Bonne communication avec la boutique.",
    createdAt: "2024-01-08T09:30:00Z",
  },
];

export function formatCFA(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "0 CFA";
  }
  return new Intl.NumberFormat("fr-FR").format(amount) + " CFA";
}

export function generateWhatsAppLink(phone: string, order: {
  id: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  deliveryMethod: string;
  neighborhood: string;
  buyerName: string;
  buyerPhone: string;
}): string {
  const message = `🛒 *Nouvelle Commande sur Epuremarket* 🚀

📋 *Détails de la commande :*
🆔 ID : #${order.id}
📦 Produit(s) :
${order.items.map(i => `  • ${i.name} x${i.quantity} — ${new Intl.NumberFormat("fr-FR").format(i.price)} CFA`).join("\n")}

💰 *Montant total :* ${new Intl.NumberFormat("fr-FR").format(order.total)} CFA
🟢 *Statut :* Payé (Fonds sécurisés)

🚚 *Mode :* ${order.deliveryMethod === "delivery" ? "Livraison à domicile" : "Retrait en boutique"}
📍 *Quartier :* ${order.neighborhood}
👤 *Client :* ${order.buyerName}
📞 *Contact :* ${order.buyerPhone}

⚡ *Action requise :* Préparez le colis et marquez "Expédié" dans votre tableau de bord.
💡 L'argent sera débloqué dès confirmation de réception par le client.`;

  return `https://wa.me/${phone.replace("+", "")}?text=${encodeURIComponent(message)}`;
}
