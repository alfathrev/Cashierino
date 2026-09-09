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
  const [cart, setCart] = useState<CartItem[]>([
    {
      product: {
        id: 3,
        name: 'Classic Cheese Burger',
        category: 'Makanan',
        price: 28000,
        image_url: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&auto=format&fit=crop&q=80',
      },
      quantity: 2
    },
    {
      product: {
        id: 2,
        name: 'Double Cheese Burger',
        category: 'Makanan',
        price: 32000,
        image_url: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&auto=format&fit=crop&q=80',
      },
      quantity: 1
    },
    {
      product: {
        id: 11,
        name: 'Coffee Latte Creamy',
        category: 'Minuman',
        price: 22000,
        image_url: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&auto=format&fit=crop&q=80',
      },
      quantity: 2
    }
  ]);
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

  const taxRate = 5.0; // PB (5%)

  const subtotal = useMemo(() => {
    const raw = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    return Math.round(raw);
  }, [cart]);

  const taxAmount = useMemo(() => {
    return Math.round(subtotal * 0.05);
  }, [subtotal]);

  const totalAmount = useMemo(() => {
    return Math.round(subtotal + taxAmount);
  }, [subtotal, taxAmount]);

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
