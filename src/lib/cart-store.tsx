import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CartItem, Product } from "./types";

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, deliveryMethod: "pickup" | "delivery") => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getServiceFee: () => number;
  getGrandTotal: () => number;
}

const CartContext = createContext<CartStore | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = useCallback((product: Product, deliveryMethod: "pickup" | "delivery") => {
    setItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.product.id === product.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, quantity: 1, deliveryMethod }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(prev => prev.filter(i => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.product.id !== productId));
      return;
    }
    setItems(prev => prev.map(i =>
      i.product.id === productId ? { ...i, quantity } : i
    ));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getTotal = useCallback(() =>
    items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    [items]
  );

  const getServiceFee = useCallback(() => 0, []);

  const getGrandTotal = useCallback(() =>
    getTotal() + getServiceFee(),
    [getTotal, getServiceFee]
  );

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      getTotal, getServiceFee, getGrandTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
}
