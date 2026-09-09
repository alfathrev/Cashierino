import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';
import { useTheme } from './context/ThemeContext';
import { LoginForm } from './components/LoginForm';
import { Sidebar, NavView } from './components/Sidebar';
import { HeaderSearch } from './components/HeaderSearch';
import { CategoryFilter } from './components/CategoryFilter';
import { ProductGrid } from './components/ProductGrid';
import { OrderCart } from './components/OrderCart';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { BillsView } from './components/BillsView';
import { SettingsModal } from './components/SettingsModal';
import { ProductCrudModal } from './components/ProductCrudModal';
import { fetchProductsApi } from './services/api';
import { Product, Transaction, Category } from './types';
import { ShoppingBag, ArrowRight } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { cart, itemCount, totalAmount } = useCart();
  const { formatMoney } = useTheme();

  // Navigation state: 'home' | 'products' | 'transactions' | 'settings'
  const [currentView, setCurrentView] = useState<NavView>('home');

  // Products & Filter state
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [sortBy, setSortBy] = useState<string>('popular');

  // Modals state
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isProductCrudOpen, setIsProductCrudOpen] = useState<boolean>(false);
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);

  // Responsive Tablet/Mobile Cart Drawer State
  const [isCartOpenMobile, setIsCartOpenMobile] = useState<boolean>(false);

  // Load products from backend REST API
  const loadProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const res = await fetchProductsApi({
        category: selectedCategory,
        search,
        sort: sortBy,
      });
      if (res.success && Array.isArray(res.products)) {
        setProducts(res.products);
      }
    } catch (e) {
      console.error('Failed to load products from API:', e);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProducts();
    }
  }, [isAuthenticated, selectedCategory, search, sortBy]);

  // Count items for category pills
  const { allCount, makananCount, minumanCount } = useMemo(() => {
    const makanan = products.filter((p) => p.category === 'Makanan').length;
    const minuman = products.filter((p) => p.category === 'Minuman').length;
    return {
      allCount: products.length,
      makananCount: makanan,
      minumanCount: minuman,
    };
  }, [products]);

  // Handle Sidebar view clicks
  const handleSelectView = (view: NavView) => {
    if (view === 'settings') {
      setIsSettingsOpen(true);
    } else if (view === 'products') {
      setIsProductCrudOpen(true);
    } else {
      setCurrentView(view);
    }
  };

  // If not authenticated, render Login Form
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8F9FB] select-none text-slate-800">
      {/* 1. Left Sidebar - responsive */}
      <Sidebar currentView={currentView} onSelectView={handleSelectView} />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {currentView === 'home' ? (
          <>
            {/* Center Area: Catalog & Grid - Takes Full Width on Tablet/Mobile */}
            <main className="flex-1 flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto no-scrollbar min-w-0 pb-24 xl:pb-8">
              {/* Header with Search Bar & Mobile Cart Toggle */}
              <HeaderSearch
                search={search}
                onSearchChange={setSearch}
                onOpenCartMobile={() => setIsCartOpenMobile(true)}
                cartItemCount={itemCount}
              />

              {/* Strict Category Filter */}
              <CategoryFilter
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                allCount={allCount}
                makananCount={makananCount}
                minumanCount={minumanCount}
              />

              {/* Product Cards Grid */}
              <div className="mt-5 flex-1 flex flex-col">
                <ProductGrid
                  products={products}
                  isLoading={isLoadingProducts}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  onOpenAddProduct={() => setIsProductCrudOpen(true)}
                />
              </div>
            </main>

            {/* Desktop Persistent Order Menu Cart (Only visible on >= xl screens) */}
            <div className="hidden xl:flex h-full shrink-0">
              <OrderCart onOpenPayment={() => setIsPaymentOpen(true)} />
            </div>

            {/* Tablet & Mobile Slide-Over Cart Drawer (Visible when isCartOpenMobile is true on < xl) */}
            {isCartOpenMobile && (
              <div className="xl:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
                <div
                  className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-slide-in-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <OrderCart
                    onOpenPayment={() => {
                      setIsCartOpenMobile(false);
                      setIsPaymentOpen(true);
                    }}
                    onCloseMobile={() => setIsCartOpenMobile(false)}
                  />
                </div>
              </div>
            )}

            {/* Floating Sticky Bottom Bar for Tablet & Mobile when Cart has items */}
            {cart.length > 0 && !isCartOpenMobile && (
              <div className="xl:hidden fixed bottom-4 inset-x-4 sm:left-24 sm:right-6 z-30 animate-slide-up">
                <div
                  onClick={() => setIsCartOpenMobile(true)}
                  className="bg-slate-900/95 backdrop-blur-md text-white px-5 py-3.5 rounded-2xl shadow-float flex items-center justify-between cursor-pointer hover:bg-slate-900 transition-all border border-white/10 active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-theme-primary text-white flex items-center justify-center font-black shadow-btn">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-slate-300">
                        {itemCount} Menu di Keranjang
                      </span>
                      <span className="block text-base font-black text-emerald-400">
                        {formatMoney(totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-theme-primary text-white font-black text-xs shadow-btn hover:bg-theme-primary-hover transition-colors">
                    <span>Lihat & Bayar</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            )}
          </>
        ) : currentView === 'transactions' ? (
          <BillsView onViewReceipt={(trans) => setActiveReceipt(trans)} />
        ) : null}
      </div>

      {/* 3. Pop-up Smart Payment with Universal Numpad (Rupiah) */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSuccessTransaction={(trans) => {
          setActiveReceipt(trans);
        }}
      />

      {/* 4. Pop-up Thermal Receipt Modal */}
      <ReceiptModal
        transaction={activeReceipt}
        onClose={() => setActiveReceipt(null)}
      />

      {/* 5. Pop-up Settings & Theme Customization */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* 6. Pop-up CRUD Tambah & Kelola Produk (Makanan / Minuman) */}
      <ProductCrudModal
        isOpen={isProductCrudOpen}
        onClose={() => setIsProductCrudOpen(false)}
        products={products}
        onRefreshProducts={loadProducts}
      />
    </div>
  );
};

export default App;
