import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export interface CartItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
  customizations?: string[];
}

interface CartState {
  cafeId: number | null;
  cafeName: string | null;
  items: CartItem[];
}

interface CartContextValue extends CartState {
  /**
   * Adds an item to the cart. A cart belongs to a single cafe: adding an
   * item from a different cafe replaces the current cart.
   */
  addItem: (cafeId: number, cafeName: string, item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (menuItemId: number) => void;
  setQuantity: (menuItemId: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CartState>({ cafeId: null, cafeName: null, items: [] });

  const addItem = useCallback<CartContextValue['addItem']>((cafeId, cafeName, item, quantity = 1) => {
    setState((prev) => {
      const sameCafe = prev.cafeId === cafeId;
      const baseItems = sameCafe ? prev.items : [];
      const existing = baseItems.find((i) => i.menuItemId === item.menuItemId);
      const items = existing
        ? baseItems.map((i) =>
            i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + quantity } : i
          )
        : [...baseItems, { ...item, quantity }];
      return { cafeId, cafeName, items };
    });
  }, []);

  const removeItem = useCallback((menuItemId: number) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.menuItemId !== menuItemId) }));
  }, []);

  const setQuantity = useCallback((menuItemId: number, quantity: number) => {
    setState((prev) => ({
      ...prev,
      items:
        quantity <= 0
          ? prev.items.filter((i) => i.menuItemId !== menuItemId)
          : prev.items.map((i) => (i.menuItemId === menuItemId ? { ...i, quantity } : i)),
    }));
  }, []);

  const clearCart = useCallback(() => {
    setState({ cafeId: null, cafeName: null, items: [] });
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);
    return { ...state, addItem, removeItem, setQuantity, clearCart, subtotal, itemCount };
  }, [state, addItem, removeItem, setQuantity, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
