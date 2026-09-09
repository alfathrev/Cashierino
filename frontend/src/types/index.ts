export type Role = 'Admin' | 'Kasir';

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: Role;
}

// Strictly locked enum according to PRD & User instructions: Makanan dan Minuman
export type Category = 'Makanan' | 'Minuman';

export interface Product {
  id: number;
  name: string;
  category: Category;
  subcategory?: string;
  price: number;
  image_url: string;
  is_new?: boolean;
  is_popular?: boolean;
  is_available?: boolean;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TransactionDetail {
  id?: number;
  transaction_id?: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface Transaction {
  id?: number;
  invoice_number: string;
  cashier_id?: number;
  cashier_name: string;
  customer_name: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  cash_paid: number;
  change_amount: number;
  payment_method: string;
  status: string;
  created_at?: string;
  items?: TransactionDetail[];
}

export type ThemeName = 'coral' | 'soft-blue' | 'soft-purple' | 'soft-green' | 'soft-orange' | 'soft-yellow';

export interface ThemeOption {
  id: ThemeName;
  name: string;
  colorCode: string;
  lightBg: string;
  description: string;
}
