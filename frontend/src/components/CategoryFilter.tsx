import React from 'react';
import { Utensils, CupSoda, Sparkles } from 'lucide-react';
import { Category } from '../types';

interface CategoryFilterProps {
  selectedCategory: Category | 'All';
  onSelectCategory: (category: Category | 'All') => void;
  makananCount?: number;
  minumanCount?: number;
  allCount?: number;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  makananCount = 0,
  minumanCount = 0,
  allCount = 0,
}) => {
  const categoryOptions = [
    {
      id: 'All' as const,
      label: 'Semua Menu',
      icon: <Sparkles className="w-5 h-5 stroke-[2.2]" />,
      count: allCount,
      color: 'amber',
    },
    {
      id: 'Makanan' as const,
      label: 'Makanan',
      icon: <Utensils className="w-5 h-5 stroke-[2.2]" />,
      count: makananCount,
      color: 'rose',
    },
    {
      id: 'Minuman' as const,
      label: 'Minuman',
      icon: <CupSoda className="w-5 h-5 stroke-[2.2]" />,
      count: minumanCount,
      color: 'blue',
    },
  ];

  return (
    <div className="flex items-center gap-4 pb-2 pt-1 select-none">
      {categoryOptions.map((cat) => {
        const isActive = selectedCategory === cat.id;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelectCategory(cat.id)}
            className={`group relative flex items-center gap-3.5 px-5 py-3.5 rounded-2xl transition-all duration-300 border ${
              isActive
                ? 'bg-white border-theme-primary shadow-float ring-2 ring-theme-ring'
                : 'bg-white/80 hover:bg-white border-slate-200/80 hover:border-slate-300 shadow-card hover:shadow-md'
            }`}
          >
            {/* Soft Icon Box */}
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 ${
                isActive
                  ? 'bg-theme-primary text-white shadow-btn'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-800'
              }`}
            >
              {cat.icon}
            </div>

            {/* Label & Counter */}
            <div className="text-left">
              <span className={`block text-sm font-extrabold tracking-tight ${isActive ? 'text-slate-900' : 'text-slate-700'}`}>
                {cat.label}
              </span>
              {cat.count !== undefined && cat.count > 0 && (
                <span className="text-[11px] font-semibold text-slate-400">
                  {cat.count} menu
                </span>
              )}
            </div>

            {/* Active indicator dot */}
            {isActive && (
              <span className="w-2 h-2 rounded-full bg-theme-primary absolute right-3 top-3 animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
};
