import React, { useState } from 'react';
import { X, Plus, Sparkles, Apple, Check } from 'lucide-react';
import { FoodItem, FoodCategory } from '../../types';
import { syncedStore } from '../../services/syncedStore';
import { hapticTap } from '../../utils/audioHaptics';

interface AddFoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFoodAdded?: (food: FoodItem) => void;
  sourceRole?: 'ADMIN' | 'TRAINER';
}

const CATEGORIES: FoodCategory[] = [
  'Fruits',
  'Vegetables & Greens',
  'Meats & Seafood',
  'Eggs & Dairy',
  'Grains & Millets',
  'Pulses & Legumes',
  'Nuts & Healthy Fats',
  'Beverages & Drinks',
  'Supplements',
  'High Protein',
  'South Indian Breakfast',
  'Snacks'
];

export const AddFoodModal: React.FC<AddFoodModalProps> = ({
  isOpen,
  onClose,
  onFoodAdded,
  sourceRole = 'ADMIN'
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FoodCategory>('High Protein');
  const [servingSize, setServingSize] = useState('1 serving (100g)');
  const [calories, setCalories] = useState<number | ''>('');
  const [protein, setProtein] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fat, setFat] = useState<number | ''>('');
  const [fiber, setFiber] = useState<number | ''>(0);
  const [isIndian, setIsIndian] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0b0f1a] border border-amber-500/40 rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto text-left animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Apple className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white font-display tracking-wide uppercase">
                Add New Food
              </h3>
              <p className="text-[11px] text-slate-400 font-tech">
                {sourceRole === 'ADMIN' ? 'Headquarters Menu Catalog' : 'Trainer Nutrition Prescription'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              hapticTap();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block text-[11px] font-tech font-bold uppercase text-slate-400 mb-1">
              Food Item Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Grilled Chicken Breast with Herbs"
              className="w-full bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3 py-2 text-white outline-none placeholder-slate-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-tech font-bold uppercase text-slate-400 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FoodCategory)}
                className="w-full bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3 py-2 text-white outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-tech font-bold uppercase text-slate-400 mb-1">
                Portion / Serving Size
              </label>
              <input
                type="text"
                value={servingSize}
                onChange={(e) => setServingSize(e.target.value)}
                placeholder="e.g. 1 bowl (150g)"
                className="w-full bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3 py-2 text-white outline-none placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-tech font-bold uppercase text-amber-400 mb-1">
                Calories (kcal) *
              </label>
              <input
                type="number"
                step="any"
                value={calories}
                onChange={(e) => setCalories(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 240"
                className="w-full bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-tech font-bold outline-none placeholder-slate-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-tech font-bold uppercase text-amber-400 mb-1">
                Protein (g)
              </label>
              <input
                type="number"
                step="any"
                value={protein}
                onChange={(e) => setProtein(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g. 28"
                className="w-full bg-slate-900 border border-white/10 focus:border-amber-500 rounded-xl px-3 py-2 text-white font-tech font-bold outline-none placeholder-slate-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[10px] font-tech font-bold uppercase text-cyan-400 mb-1">
                Carbs (g)
              </label>
              <input
                type="number"
                step="any"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-900 border border-white/10 focus:border-cyan-500 rounded-xl px-2.5 py-1.5 text-white font-tech font-bold outline-none placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-tech font-bold uppercase text-rose-400 mb-1">
                Fats (g)
              </label>
              <input
                type="number"
                step="any"
                value={fat}
                onChange={(e) => setFat(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-900 border border-white/10 focus:border-rose-500 rounded-xl px-2.5 py-1.5 text-white font-tech font-bold outline-none placeholder-slate-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-tech font-bold uppercase text-emerald-400 mb-1">
                Fiber (g)
              </label>
              <input
                type="number"
                step="any"
                value={fiber}
                onChange={(e) => setFiber(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="0"
                className="w-full bg-slate-900 border border-white/10 focus:border-emerald-500 rounded-xl px-2.5 py-1.5 text-white font-tech font-bold outline-none placeholder-slate-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center space-x-2">
            <input
              type="checkbox"
              id="isIndianCheck"
              checked={isIndian}
              onChange={(e) => setIsIndian(e.target.checked)}
              className="w-4 h-4 rounded bg-slate-900 border-white/20 text-amber-500 focus:ring-0 accent-amber-500"
            />
            <label htmlFor="isIndianCheck" className="text-slate-300 font-tech text-xs cursor-pointer">
              Indian Culinary Preparation
            </label>
          </div>

          <div className="pt-3 flex space-x-2">
            <button
              type="button"
              onClick={() => {
                hapticTap();
                onClose();
              }}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-tech font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black rounded-xl font-display font-black tracking-wide uppercase transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Save Food Item</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
