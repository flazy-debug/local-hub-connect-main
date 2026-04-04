import { Product, Shop, Category, Order, Review } from "./types";

export const categories: Category[] = [
  { id: "vehicules", name: "Véhicules", icon: "Car" },
  { id: "immobilier", name: "Immobilier", icon: "Building" },
  { id: "electronique", name: "Électronique", icon: "Smartphone" },
  { id: "mode-beaute", name: "Mode & Beauté", icon: "Shirt" },
  { id: "restauration", name: "Restauration", icon: "Utensils" },
  { id: "maison-jardin", name: "Maison & Jardin", icon: "Home" },
  { id: "emploi-services", name: "Emploi & Services", icon: "Briefcase" },
  { id: "location-voiture", name: "Location de Voiture", icon: "Key" },
];

export const neighborhoods = [
  "Agbalépédogan", "Adidogomé", "Bè", "Tokoin", "Nyékonakpoè",
  "Hédzranawoé", "Agoè", "Kégué", "Djidjolé", "Kodjoviakopé",
];

export const products: Product[] = [
  {
    id: "elite-1",
    name: "iPhone 15 Pro Max Titanium",
    description: "Le summum de la technologie Apple. Écran Super Retina XDR, puce A17 Pro ultra-puissante et système photo pro avancé.",
    price: 950000,
    images: ["https://images.unsplash.com/photo-1696446701796-da61225697cc?q=80&w=800&auto=format&fit=crop"],
    category: "electronique",
    condition: "neuf",
    stock: 5,
    sellerId: "shop-elite-1",
    sellerName: "Elite Digital",
    sellerType: "boutique",
    neighborhood: "Nyékonakpoè",
    rating: 4.9,
    reviewCount: 12,
    pickupAvailable: true,
    deliveryAvailable: true,
    isBoosted: true,
  },
  {
    id: "elite-2",
    name: "MacBook Pro M3 Max 16\"",
    description: "La puissance à l'état pur pour les professionnels. 32GB RAM, 1TB SSD. Performances graphiques révolutionnaires.",
    price: 2450000,
    images: ["https://images.unsplash.com/photo-1517336714460-d15023521ad4?q=80&w=800&auto=format&fit=crop"],
    category: "electronique",
    condition: "neuf",
    stock: 3,
    sellerId: "shop-elite-1",
    sellerName: "Elite Digital",
    sellerType: "boutique",
    neighborhood: "Nyékonakpoè",
    rating: 5.0,
    reviewCount: 8,
    pickupAvailable: true,
    deliveryAvailable: true,
    isBoosted: true,
  },
  {
    id: "elite-3",
    name: "Sneakers Luxury Edition Black",
    description: "Un mélange parfait de confort et de style haute couture. Fabriquées à la main avec les meilleurs matériaux.",
    price: 125000,
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=800&auto=format&fit=crop"],
    category: "mode-beaute",
    condition: "neuf",
    stock: 12,
    sellerId: "shop-elite-2",
    sellerName: "Luxe & Style",
    sellerType: "boutique",
    neighborhood: "Hédzranawoé",
    rating: 4.8,
    reviewCount: 25,
    pickupAvailable: true,
    deliveryAvailable: true,
    isBoosted: true,
  },
  {
    id: "elite-4",
    name: "Villa Moderne Vue Océan",
    description: "Villa d'exception avec 4 chambres, piscine à débordement et finissions haut de gamme. Située dans un quartier calme.",
    price: 450000000,
    images: ["https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=800&auto=format&fit=crop"],
    category: "immobilier",
    condition: "neuf",
    stock: 1,
    sellerId: "shop-elite-3",
    sellerName: "Epure Immo",
    sellerType: "boutique",
    neighborhood: "Agoè",
    rating: 5.0,
    reviewCount: 4,
    pickupAvailable: false,
    deliveryAvailable: false,
    isBoosted: true,
  },
  {
    id: "elite-5",
    name: "Plateau Sushi Prestige (36pcs)",
    description: "Sélection des meilleurs sushis, sashimis et makis préparés avec du poisson frais du jour. Servis avec gingembre et wasabi.",
    price: 35000,
    images: ["https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=800&auto=format&fit=crop"],
    category: "restauration",
    condition: "neuf",
    stock: 100,
    sellerId: "shop-elite-4",
    sellerName: "Le Gourmet",
    sellerType: "boutique",
    neighborhood: "Kodjoviakopé",
    rating: 4.8,
    reviewCount: 150,
    pickupAvailable: true,
    deliveryAvailable: true,
    isBoosted: false,
  },
  {
    id: "elite-6",
    name: "Sony WH-1000XM5 Wireless",
    description: "La meilleure réduction de bruit du marché. Autonomie 30h, qualité sonore hi-res. Un must-have pour les mélomanes.",
    price: 215000,
    images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop"],
    category: "electronique",
    condition: "neuf",
    stock: 15,
    sellerId: "shop-elite-1",
    sellerName: "Elite Digital",
    sellerType: "boutique",
    neighborhood: "Nyékonakpoè",
    rating: 4.7,
    reviewCount: 45,
    pickupAvailable: true,
    deliveryAvailable: true,
    isBoosted: false,
  },
  {
    id: "elite-7",
    name: "Appartement Meublé Design",
    description: "F2 entièrement équipé avec décoration scandinave. Idéal pour séjours d'affaires ou vacances. Fibre optique incluse.",
    price: 45000,
    images: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=800&auto=format&fit=crop"],
    category: "immobilier",
    condition: "neuf",
    stock: 1,
    sellerId: "shop-elite-3",
    sellerName: "Epure Immo",
    sellerType: "boutique",
    neighborhood: "Bè",
    rating: 4.6,
    reviewCount: 18,
    pickupAvailable: false,
    deliveryAvailable: false,
    isBoosted: false,
  },
  {
    id: "elite-8",
    name: "Burger Gourmet Truffe & Brie",
    description: "Le burger ultime avec steak wagyu, brie fondu et sauce à la truffe noire. Pain brioché artisanal.",
    price: 8500,
    images: ["https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=800&auto=format&fit=crop"],
    category: "restauration",
    condition: "neuf",
    stock: 50,
    sellerId: "shop-elite-4",
    sellerName: "Le Gourmet",
    sellerType: "boutique",
    neighborhood: "Kodjoviakopé",
    rating: 4.9,
    reviewCount: 89,
    pickupAvailable: true,
    deliveryAvailable: true,
    isBoosted: false,
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
    name: "Nature & Beauté",
    description: "Produits de beauté naturels et bio",
    image: "/placeholder.svg",
    neighborhood: "Hédzranawoé",
    whatsappNumber: "+22891234567",
    productCount: 32,
    rating: 4.9,
  },
  {
    id: "shop3",
    name: "ArtiBois",
    description: "Meubles et objets décoratifs en bois artisanal",
    image: "/placeholder.svg",
    neighborhood: "Adidogomé",
    whatsappNumber: "+22892345678",
    productCount: 18,
    rating: 4.5,
  },
  {
    id: "shop4",
    name: "Saveurs d'Excellence",
    description: "Boissons artisanales et produits du terroir",
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
