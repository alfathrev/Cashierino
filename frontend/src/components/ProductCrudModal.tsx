import React, { useState, useRef } from 'react';
import { Product, Category } from '../types';
import { useTheme } from '../context/ThemeContext';
import {
  createProductApi,
  updateProductApi,
  deleteProductApi
} from '../services/api';
import {
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Utensils,
  CupSoda,
  UploadCloud,
  Save,
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

interface ProductCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onRefreshProducts: () => void;
}

export const ProductCrudModal: React.FC<ProductCrudModalProps> = ({
  isOpen,
  onClose,
  products,
  onRefreshProducts,
}) => {
  const { formatMoney, playSound } = useTheme();

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Makanan');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [isPopular, setIsPopular] = useState(true);

  // Edit state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // File input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setCategory('Makanan');
    setPrice('');
    setImageUrl('');
    setIsNew(false);
    setIsPopular(true);
    setEditingProduct(null);
  };

  // Handle local file upload (converts to base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isEdit = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File yang dipilih harus berupa gambar (JPG, PNG, WebP).' });
      return;
    }

    // Limit to 5MB
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran foto maksimal 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (isEdit && editingProduct) {
        setEditingProduct({ ...editingProduct, image_url: result });
      } else {
        setImageUrl(result);
      }
      playSound('click');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setMessage({ type: 'error', text: 'Nama dan harga produk wajib diisi.' });
      return;
    }

    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      setMessage({ type: 'error', text: 'Harga produk harus lebih dari Rp 0.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const defaultPlaceholder = category === 'Makanan'
      ? 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400'
      : 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400';

    try {
      const res = await createProductApi({
        name: name.trim(),
        category,
        price: priceNum,
        image_url: imageUrl.trim() || defaultPlaceholder,
        is_new: isNew,
        is_popular: isPopular,
      });

      if (res.success) {
        playSound('success');
        setMessage({ type: 'success', text: `Produk "${name}" berhasil ditambahkan ke ${category}!` });
        resetForm();
        onRefreshProducts();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: res.message || 'Gagal menambahkan produk.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan pada server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await updateProductApi(editingProduct.id, {
        name: editingProduct.name,
        category: editingProduct.category,
        price: Number(editingProduct.price),
        image_url: editingProduct.image_url,
        is_new: editingProduct.is_new,
        is_popular: editingProduct.is_popular,
      });

      if (res.success) {
        playSound('success');
        setMessage({ type: 'success', text: 'Perubahan produk berhasil disimpan!' });
        setEditingProduct(null);
        onRefreshProducts();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: res.message || 'Gagal memperbarui produk.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal update produk.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async (prod: Product) => {
    if (!window.confirm(`Yakin ingin menghapus menu "${prod.name}"?`)) return;

    try {
      const res = await deleteProductApi(prod.id);
      if (res.success) {
        playSound('delete');
        setMessage({ type: 'success', text: `Produk "${prod.name}" telah dihapus.` });
        onRefreshProducts();
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: res.message || 'Gagal menghapus produk.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus produk.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-float border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-modal">
        {/* Modal Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-theme-primary-light text-theme-primary flex items-center justify-center shadow-xs">
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight">
                Kelola & Tambah Produk
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                Kategori: <strong className="text-slate-700">Makanan</strong> & <strong className="text-slate-700">Minuman</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-6 pt-3 border-b border-slate-100 gap-4">
          <button
            onClick={() => { setActiveTab('create'); setEditingProduct(null); }}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'create' && !editingProduct
                ? 'text-theme-primary'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            + Tambah Menu Baru
            {activeTab === 'create' && !editingProduct && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-primary rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'list' || editingProduct
                ? 'text-theme-primary'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Daftar Produk ({products.length})
            {(activeTab === 'list' || editingProduct) && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-theme-primary rounded-full" />
            )}
          </button>
        </div>

        {/* Status Message Alert */}
        {message && (
          <div
            className={`mx-6 mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-slide-up ${
              message.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: FORM TAMBAH PRODUK BARU */}
          {activeTab === 'create' && !editingProduct ? (
            <form onSubmit={handleCreateProduct} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Produk */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Nama Menu Produk
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Nasi Goreng Spesial Telur"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-theme-ring focus:border-theme-border transition-all"
                  />
                </div>

                {/* Kategori: Makanan / Minuman */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Kategori Menu
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCategory('Makanan')}
                      className={`py-3 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                        category === 'Makanan'
                          ? 'bg-rose-50 border-theme-primary text-theme-primary ring-1 ring-theme-primary shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Utensils className="w-4 h-4" />
                      <span>Makanan</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCategory('Minuman')}
                      className={`py-3 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
                        category === 'Minuman'
                          ? 'bg-blue-50 border-blue-500 text-blue-600 ring-1 ring-blue-500 shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <CupSoda className="w-4 h-4" />
                      <span>Minuman</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Harga dalam Rupiah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Harga Satuan (Rupiah)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="25000"
                    step="500"
                    min="1000"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-theme-ring focus:border-theme-border transition-all"
                  />
                </div>
              </div>

              {/* UPLOAD FOTO GAMBAR (Bukan cuma link, preset dihapus) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Foto Menu (Upload Gambar Langsung atau URL)
                </label>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload(e, false)}
                  accept="image/*"
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="relative w-full h-40 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center group mb-2">
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-contain p-2" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md hover:bg-rose-600 transition-colors"
                      title="Hapus foto"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-2 right-2 px-3 py-1.5 rounded-xl bg-slate-900/80 text-white text-xs font-bold shadow-md hover:bg-slate-900 transition-colors"
                    >
                      Ganti Foto
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-36 rounded-2xl border-2 border-dashed border-slate-300 hover:border-theme-primary bg-slate-50 hover:bg-theme-primary-subtle flex flex-col items-center justify-center cursor-pointer transition-all mb-2 group"
                  >
                    <div className="w-11 h-11 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-slate-400 group-hover:text-theme-primary mb-2 transition-colors">
                      <UploadCloud className="w-6 h-6 stroke-[2]" />
                    </div>
                    <span className="text-xs font-extrabold text-slate-700 group-hover:text-theme-primary transition-colors">
                      Klik untuk Upload Foto dari Komputer
                    </span>
                    <span className="text-[11px] text-slate-400 mt-0.5">
                      Mendukung format PNG, JPG, WebP (Maks 5MB)
                    </span>
                  </div>
                )}

                {/* Input URL opsional */}
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                    URL:
                  </span>
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Atau masukkan tautan URL gambar online di sini"
                    className="w-full pl-12 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-theme-ring"
                  />
                </div>
              </div>

              {/* Tag Options */}
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="w-4 h-4 rounded text-theme-primary focus:ring-theme-ring"
                  />
                  <span>Tandai sebagai Menu Baru (Badge "New")</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPopular}
                    onChange={(e) => setIsPopular(e.target.checked)}
                    className="w-4 h-4 rounded text-theme-primary focus:ring-theme-ring"
                  />
                  <span>Tandai Menu Populer</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white font-black text-xs shadow-btn flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Menu ke Database'}</span>
              </button>
            </form>
          ) : null}

          {/* TAB 2: DAFTAR DAN EDIT PRODUK */}
          {activeTab === 'list' && !editingProduct ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2">
                <span>Klik ikon edit untuk mengubah menu atau hapus untuk menghapus dari POS.</span>
                <span className="font-bold">{products.length} menu tersedia</span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
                {products.map((p) => (
                  <div key={p.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-4 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <img src={p.image_url} alt={p.name} className="w-12 h-12 rounded-xl object-contain bg-slate-100 p-1 shrink-0" />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-800 truncate">{p.name}</h4>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            p.category === 'Makanan' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {p.category}
                          </span>
                          {p.is_new && (
                            <span className="text-[9px] font-black px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                              New
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-black text-slate-900 mt-0.5">
                          {formatMoney(p.price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setEditingProduct(p)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                        title="Edit produk"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p)}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-colors"
                        title="Hapus produk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* EDIT FORM VIEW */}
          {editingProduct ? (
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-800">
                  Edit Menu: {editingProduct.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Produk</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as Category })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800"
                  >
                    <option value="Makanan">Makanan</option>
                    <option value="Minuman">Minuman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    value={editingProduct.price}
                    onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Foto Menu</label>
                <input
                  type="file"
                  ref={editFileInputRef}
                  onChange={(e) => handleFileUpload(e, true)}
                  accept="image/*"
                  className="hidden"
                />

                <div className="flex items-center gap-3 mb-2">
                  {editingProduct.image_url ? (
                    <img src={editingProduct.image_url} alt="Preview" className="w-16 h-16 rounded-xl object-contain bg-slate-100 p-1 border" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                  >
                    Upload Gambar Baru
                  </button>
                </div>

                <input
                  type="url"
                  value={editingProduct.image_url}
                  onChange={(e) => setEditingProduct({ ...editingProduct, image_url: e.target.value })}
                  placeholder="Atau tautan URL gambar online"
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={!!editingProduct.is_new}
                    onChange={(e) => setEditingProduct({ ...editingProduct, is_new: e.target.checked })}
                  />
                  <span>Tag Baru (New)</span>
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-600"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-2/3 py-2.5 rounded-xl bg-theme-primary hover:bg-theme-primary-hover font-black text-xs text-white shadow-btn flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};
