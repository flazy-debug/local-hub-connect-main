export type DeliveryZone = "A" | "B" | "C";

export const NEIGHBORHOOD_ZONES: Record<string, DeliveryZone> = {
  // Zone A (500 CFA)
  "Grand Marché": "A",
  "Assigamé": "A",
  "Assivito": "A",
  "Nyékonakpoé": "A",
  "Kodjoviakopé": "A",
  "Hanoukopé": "A",
  "Quartier Administratif": "A",
  "Octaviano Neto": "A",
  "Amoutivé": "A",
  "Anagokopé": "A",
  "Lower-Bè": "A",
  "Ablogamé": "A",
  "Akodésséwa": "A",
  
  // Zone B (1 500 CFA)
  "Hédzranawoé": "B",
  "Tokoin Forever": "B",
  "Tokoin Ouest": "B",
  "Tokoin Est": "B",
  "Casablanca": "B",
  "Gbadago": "B",
  "Bè-Kpota": "B",
  "Aéroport": "B",
  "Gbonvié": "B",
  "Adewui": "B",
  "Lomé 2": "B",
  "Totsi": "B",
  "Agbalépédogan": "B",
  "Aflao-Gakli": "B",
  "Djidjolé": "B",
  "Klikamé": "B",
  "Adidogomé": "B",
  "Amandahomé": "B",
  "Léo 2000": "B",
  
  // Zone C (2 500 CFA)
  "Agoè-Nyivé": "C",
  "Assiyéyé": "C",
  "Minamadou": "C",
  "Dossolo-Gretah": "C",
  "Vakpossito": "C",
  "Baguida": "C",
  "Avepozo": "C",
  "Legbassito": "C",
  "Zanguéra": "C",
  "Noépé": "C",
  "Sanguéra": "C",
  "Togblékopé": "C",
  "Fidjrossè": "C",
  "Ségbé": "C",
  "Apédokoè": "C",
  "Davié": "C",
};

export const ZONE_PRICES: Record<DeliveryZone, number> = {
  "A": 500,
  "B": 1500,
  "C": 2500,
};

export const ZONE_TIMES: Record<DeliveryZone, string> = {
  "A": "20-35 min",
  "B": "40-55 min",
  "C": "55-75 min",
};

export function getDeliveryFee(neighborhood: string): number {
  const zone = NEIGHBORHOOD_ZONES[neighborhood];
  return zone ? ZONE_PRICES[zone] : 1500; // Default to mid-range
}

export function getEstimatedDeliveryTime(neighborhood: string): string {
  const zone = NEIGHBORHOOD_ZONES[neighborhood];
  return zone ? ZONE_TIMES[zone] : "30-50 min";
}

/**
 * Calculates a proximity weight for sorting.
 * 0: Same neighborhood (Highest priority)
 * 1: Same zone 
 * 2: Adjacent zones (A-B)
 * 3: Distant zones (B-C)
 * 4: Very distant (A-C)
 * 10: Unknown
 */
export function getProximityWeight(sellerNb: string, buyerNb: string): number {
  if (sellerNb === buyerNb) return 0;
  
  const sellerZone = NEIGHBORHOOD_ZONES[sellerNb];
  const buyerZone = NEIGHBORHOOD_ZONES[buyerNb];
  
  if (!sellerZone || !buyerZone) return 10;
  if (sellerZone === buyerZone) return 1;
  
  // Zone distance
  const distance = Math.abs(sellerZone.charCodeAt(0) - buyerZone.charCodeAt(0));
  return distance + 1; // 1 -> 2, 2 -> 3
}

export const ALL_NEIGHBORHOODS = Object.keys(NEIGHBORHOOD_ZONES).sort();

export const LISTING_CATEGORIES = ["immobilier", "location-voiture", "services", "emploi"];
export const isListingCategory = (category: string) => LISTING_CATEGORIES.includes(category);
export const isDirectCheckout = (category: string) => !isListingCategory(category);
