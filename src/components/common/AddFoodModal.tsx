import React, { useState, useEffect } from 'react';
import { X, Plus, Apple } from 'lucide-react';
import { FoodItem, FoodCategory } from '../../types';
import { syncedStore } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';
import { registerBackButtonHandler } from '../../services/nativePlatformService';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdded?: (food: FoodItem) => void;
  sourceRole?: 'ADMIN' | 'TRAINER';
}

const CATEGORIES: FoodCategory[] = [
  'Rice & grains',
  'Millets',
  'Pulses & dals',
  'Chicken & meat',
  'Fish & seafood',
  'Eggs',
  'Dairy',
  'Vegetables',
  'Fruits',
  'Nuts & seeds',
  'Indian & Tamil Nadu meals',
  'Snacks & restaurant foods',
  'Beverages',
  'Sweets & desserts',
  'Cooking ingredients & condiments'
];

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  onFoodAdded,
  sourceRole = 'ADMIN'
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('Rice & grains');
  const [servingSize, setServingSize] = useState('1 serving (100g)');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [fiber, setFiber] = useState<number | ''>(0);
  const [isIndian, setIsIndian] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        hapticTap();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const unregisterBack = registerBackButtonHandler(() => {
      hapticTap();
      onClose();
      return true;
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      unregisterBack();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Food item name is required.');
      return;
    }
    if (calories === '' || Number(calories) < 0) {
      setError('Please provide valid calories.');
      return;
    }

    hapticTap();

    const newFood = syncedStore.addCustomFood(
      {
        name: name.trim(),
        category,
        servingSize: servingSize.trim() || '1 serving',
        calories: Number(calories),
        protein: Number(protein) || 0,
        carbs: Number(carbs) || 0,
        fat: Number(fat) || 0,
        fiber: Number(fiber) || 0,
        isIndian,
        verified: true
      },
      sourceRole
    );

    if (onFoodAdded) {
      onFoodAdded(newFood);
    }

    // Reset & close
    setName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setFiber(0);
    setError(null);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-food-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 overscroll-contain animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          hapticTap();
          onClose();
        }
      }}
    >
      <div className="bg-white dark:bg-[#0b0f1a] border-t sm:border border-amber-500/40 rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl max-h-[92dvh] flex flex-col text-left animate-in slide-in-from-bottom duration-250">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-white/20 rounded-full mx-auto -mt-1 mb-3 sm:hidden flex-shrink-0" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-white/10 mb-3 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 flex-shrink-0">
              <Apple className="w-5 h-5" />
            </div>
            <div>
              <h3 id="add-food-title" className="text-base font-black text-slate-900 dark:text-white font-display tracking-wide uppercase">
                Add New Food
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-tech">
                {sourceRole === 'ADMIN' ? 'Headquarters Menu Catalog' : 'Trainer Nutrition Prescription'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticTap();
              onClose();
            }}
            aria-label="Close dialog"
            className="min-h-[48px] min-w-[48px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-600 dark:text-rose-300 text-xs font-bold flex-shrink-0">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="overflow-y-auto overscroll-contain flex-1 space-y-3.5 pr-1 text-xs">
          <div>
            <label className="block text-[11px] font-tech font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
              Food Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grilled Chicken Breast with Herbs"
              className="w-full min-h-[48px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-amber-500 rounded-xl px-3.5 text-base sm:text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-tech font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full min-h-[48px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-amber-500 rounded-xl px-3.5 text-base sm:text-sm text-slate-900 dark:text-white outline-none transition-colors"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-tech font-bold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
                Portion / Serving Size
              </label>
              <input
                type="text"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="e.g. 1 bowl (150g)"
                className="w-full min-h-[48px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-amber-500 rounded-xl px-3.5 text-base sm:text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-tech font-bold uppercase text-amber-600 dark:text-amber-400 mb-1.5">
                Calories (kcal) *
              </label>
              <input
                type="number"
                step="any"
                value={calories}
                onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 240"
                className="w-full min-h-[48px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-amber-500 rounded-xl px-3.5 text-base sm:text-sm text-slate-900 dark:text-white font-tech font-bold outline-none placeholder:text-slate-400 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-tech font-bold uppercase text-amber-600 dark:text-amber-400 mb-1.5">
                Protein (g)
              </label>
              <input
                type="number"
                step="any"
                value={protein}
                onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 28"
                className="w-full min-h-[48px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-amber-500 rounded-xl px-3.5 text-base sm:text-sm text-slate-900 dark:text-white font-tech font-bold outline-none placeholder:text-slate-400 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-tech font-bold uppercase text-cyan-600 dark:text-cyan-400 mb-1.5">
                Carbs (g)
              </label>
              <input
                type="number"
                step="any"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full min-h-[48px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-cyan-500 rounded-xl px-3 text-base sm:text-sm text-slate-900 dark:text-white font-tech font-bold outline-none placeholder:text-slate-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-tech font-bold uppercase text-rose-600 dark:text-rose-400 mb-1.5">
                Fats (g)
              </label>
              <input
                type="number"
                step="any"
                value={fat}
                onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full min-h-[48px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-rose-500 rounded-xl px-3 text-base sm:text-sm text-slate-900 dark:text-white font-tech font-bold outline-none placeholder:text-slate-400 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-tech font-bold uppercase text-emerald-600 dark:text-emerald-400 mb-1.5">
                Fiber (g)
              </label>
              <input
                type="number"
                step="any"
                value={fiber}
                onChange={(e) => setFiber(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full min-h-[48px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-white/10 focus:border-emerald-500 rounded-xl px-3 text-base sm:text-sm text-slate-900 dark:text-white font-tech font-bold outline-none placeholder:text-slate-400 transition-colors"
              />
            </div>
          </div>

          <label htmlFor="isIndianCheck" className="min-h-[48px] flex items-center space-x-3 cursor-pointer select-none">
            <input
              type="checkbox"
              id="isIndianCheck"
              checked={isIndian}
              onChange={(e) => setIsIndian(e.target.checked)}
              className="w-5 h-5 rounded bg-white dark:bg-slate-900 border-slate-300 dark:border-white/20 text-amber-600 dark:text-amber-500 focus:ring-0 accent-amber-500 cursor-pointer"
            />
            <span className="text-slate-700 dark:text-slate-300 font-tech text-xs sm:text-sm">
              Indian Culinary Preparation
            </span>
          </label>

          <div className="pt-2 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onClose();
              }}
              className="min-h-[48px] flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-tech font-bold transition-all cursor-pointer flex items-center justify-center text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="min-h-[48px] flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-xl font-display font-black tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer text-sm"
            >
              <Plus className="w-5 h-5" />
              <span>Save Food Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
