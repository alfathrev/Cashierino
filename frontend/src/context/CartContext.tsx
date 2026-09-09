import React, { createContext, useContext, useState, useMemo } from 'react';
import { Product, CartItem } from '../types';
import { useTheme } from './ThemeContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  itemCount: number;
  customerName: string;
  setCustomerName: (name: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState<string>('Pelanggan Walk-in');
  const { playSound } = useTheme();

  const addToCart = (product: Product) => {
    playSound('beep');
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => {
    playSound('delete');
    setCart((prevCart) => prevCart.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    playSound('click');
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const taxRate = 0; // Pajak dinonaktifkan (0%)

  const subtotal = useMemo(() => {
    const raw = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    return Math.round(raw);
  }, [cart]);

  const taxAmount = 0;

  const totalAmount = useMemo(() => {
    return subtotal;
  }, [subtotal]);

  const itemCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        taxRate,
        taxAmount,
        totalAmount,
        itemCount,
        customerName,
        setCustomerName
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
