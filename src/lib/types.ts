export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promo_price?: number;
  supplierPrice?: number;
  images: string[];
  videoUrl?: string;
  category: string;
  condition: "neuf" | "occasion";
  stock: number;
  sellerId: string;
  sellerName: string;
  sellerType: "boutique" | "particulier";
  neighborhood: string;
  rating: number;
  reviewCount: number;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  pickupAddress?: string;
  sellerVerification?: "none" | "verified" | "pro";
  sellerSubscription?: "STANDARD" | "BOOSTED" | "PRO" | "PARTNER";
  isBoosted?: boolean;
  isApproved?: boolean;
  boostExpiry?: string;
  options?: {
    variants?: { name: string; required: boolean; values: string[] }[];
    extras?: { name: string; price: number }[];
  };
}

export interface Shop {
  id: string;
  name: string;
  description: string;
  image: string;
  neighborhood: string;
  whatsappNumber: string;
  productCount: number;
  rating: number;
  followerCount?: number;
  verificationStatus?: "none" | "verified" | "pro";
  facebookUrl?: string;
  instagramUrl?: string;
  tiktokUrl?: string;
  partnerMarkup?: number;
  subscriptionType?: "STANDARD" | "BOOSTED" | "PRO" | "PARTNER";
}

export interface CartItem {
  product: Product;
  quantity: number;
  deliveryMethod: "pickup" | "delivery";
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  commission: number;
  sellerPayout: number;
  status: "pending" | "paid" | "preparing" | "shipped" | "delivered" | "completed";
  buyerName: string;
  buyerPhone: string;
  buyerNeighborhood: string;
  order_number?: string;
  deliveryZone?: string;
  deliveryFee?: number;
  gatewayFee?: number;
  platformCommission?: number;
  createdAt: string;
}

export interface Review {
  id: string;
  productId: string;
  buyerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  sellerId: string;
  amountTotal: number;
  commissionFee: number;
  gatewayFee?: number;
  platformCommission?: number;
  sellerPayout: number;
  status: "escrow" | "completed" | "refunded";
  createdAt: string;
}

export interface Profile {
  user_id: string;
  display_name?: string;
  whatsapp_number?: string;
  subscription_type?: "STANDARD" | "BOOSTED" | "PRO" | "PARTNER";
  partner_markup_percent?: number;
  shop_slug?: string;
  facebook_url?: string;
  instagram_url?: string;
  tiktok_url?: string;
  referral_code?: string;
  whatsapp_number_verified?: boolean;
}

export type Category = {
  id: string;
  name: string;
  icon: string;
};
