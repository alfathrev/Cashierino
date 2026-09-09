import React, { useState, useEffect, useRef } from 'react';
import { Product, Category } from '../types';
import { useTheme } from '../context/ThemeContext';
import { createProductApi, updateProductApi } from '../services/api';
import { Plus, Save, X, Utensils, CupSoda, UploadCloud, Check, AlertCircle } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSuccess: () => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
  onSuccess,
}) => {
  const { playSound } = useTheme();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Makanan');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isNew, setIsNew] = useState(false);
  const [isPopular, setIsPopular] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditMode = !!productToEdit;

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setName(productToEdit.name);
        setCategory(productToEdit.category);
        setPrice(String(productToEdit.price));
        setImageUrl(productToEdit.image_url || '');
        setIsNew(!!productToEdit.is_new);
        setIsPopular(productToEdit.is_popular ?? true);
      } else {
        setName('');
        setCategory('Makanan');
        setPrice('');
        setImageUrl('');
        setIsNew(false);
        setIsPopular(true);
      }
      setMessage(null);
    }
  }, [isOpen, productToEdit]);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'File yang dipilih harus berupa gambar (JPG, PNG, WebP).' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Ukuran foto maksimal 5MB.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImageUrl(result);
      playSound('click');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      if (isEditMode && productToEdit) {
        const res = await updateProductApi(productToEdit.id, {
          name: name.trim(),
          category,
          price: priceNum,
          image_url: imageUrl.trim() || defaultPlaceholder,
          is_new: isNew,
          is_popular: isPopular,
        });

        if (res.success) {
          playSound('success');
          onSuccess();
          onClose();
        } else {
          setMessage({ type: 'error', text: res.message || 'Gagal mengubah produk.' });
        }
      } else {
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
          onSuccess();
          onClose();
        } else {
          setMessage({ type: 'error', text: res.message || 'Gagal menambahkan produk.' });
        }
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan pada server.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-float border border-slate-100 overflow-hidden flex flex-col max-h-[94vh] animate-modal my-auto">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-theme-primary-light text-theme-primary flex items-center justify-center shadow-xs">
              {isEditMode ? <Save className="w-5 h-5 stroke-[2.5]" /> : <Plus className="w-6 h-6 stroke-[2.5]" />}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                {isEditMode ? `Edit Menu: ${productToEdit?.name}` : 'Tambah Menu Baru'}
              </h2>
              <p className="text-xs font-semibold text-slate-400 mt-0.5">
                {isEditMode ? 'Perbarui informasi dan harga menu' : 'Tambahkan menu baru ke dalam POS kasir'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Message Alert */}
        {message && (
          <div
            className={`mx-5 sm:mx-6 mt-4 p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-slide-up ${
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

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nama Produk */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Nama Menu Produk *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Nasi Goreng Spesial"
                required
                className="w-full px-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-theme-ring focus:border-theme-border transition-all"
              />
            </div>

            {/* Kategori: Makanan / Minuman */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Kategori Menu *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCategory('Makanan')}
                  className={`py-2.5 sm:py-3 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
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
                  className={`py-2.5 sm:py-3 px-3 rounded-2xl border text-xs font-black flex items-center justify-center gap-2 transition-all ${
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
              Harga Satuan (Rupiah) *
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
                min="500"
                required
                className="w-full pl-12 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-theme-ring focus:border-theme-border transition-all"
              />
            </div>
          </div>

          {/* UPLOAD FOTO GAMBAR */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Foto Menu
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {imageUrl ? (
              <div className="relative w-full h-36 sm:h-40 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 flex items-center justify-center group mb-2">
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
                className="w-full h-32 sm:h-36 rounded-2xl border-2 border-dashed border-slate-300 hover:border-theme-primary bg-slate-50 hover:bg-theme-primary-subtle flex flex-col items-center justify-center cursor-pointer transition-all mb-2 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs flex items-center justify-center text-slate-400 group-hover:text-theme-primary mb-2 transition-colors">
                  <UploadCloud className="w-5 h-5 stroke-[2]" />
                </div>
                <span className="text-xs font-extrabold text-slate-700 group-hover:text-theme-primary transition-colors">
                  Klik untuk Upload Foto dari Perangkat
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  PNG, JPG, WebP (Maks 5MB)
                </span>
              </div>
            )}

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">
                URL:
              </span>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Atau tempel tautan URL gambar online di sini"
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
              <span>Menu Populer</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-100 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-600 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-2/3 py-3 rounded-2xl bg-theme-primary hover:bg-theme-primary-hover text-white font-black text-xs shadow-btn flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isEditMode ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4 stroke-[3]" />}
              <span>
                {isSubmitting
                  ? 'Menyimpan...'
                  : isEditMode
                  ? 'Simpan Perubahan'
                  : 'Simpan Menu Baru'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
