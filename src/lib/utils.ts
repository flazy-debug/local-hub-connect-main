import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCFA(amount: number) {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' CFA';
}

export function generateWhatsAppLink(phone: string, order: { 
  id: string, 
  items: any[], 
  total: number, 
  deliveryMethod: string, 
  neighborhood: string,
  buyerName: string,
  buyerPhone: string 
}) {
  const cleanPhone = phone.replace("+", "");
  const itemsList = order.items.map(i => `- ${i.name} (x${i.quantity})`).join("\n");
  const text = `Bonjour ! Je souhaite commander sur Epuremarket :\n\nNuméro de commande : #${order.id}\n\nProduits :\n${itemsList}\n\nTotal : ${formatCFA(order.total)}\nMode : ${order.deliveryMethod === "delivery" ? "Livraison à " + order.neighborhood : "Retrait"}\n\nClient : ${order.buyerName}\nTéléphone : ${order.buyerPhone}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}
