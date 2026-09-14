import React, { useState, useEffect } from 'react';
import { FoodItem, LoggedMealItem, DailyNutritionGoals, AssignedMealPlan } from '../../types';
import { FoodService, CURATED_INDIAN_FOODS } from '../../data/foodDatabase';
import {
  Plus,
  Trash2,
  Droplets,
  Search,
  X,
  Check,
  Flame,
  Award,
  CalendarCheck,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface DietScreenProps {
  trainerName?: string;
  loggedMeals: LoggedMealItem[];
  waterMl: number;
  goals: DailyNutritionGoals;
  assignedMealPlan?: AssignedMealPlan | null;
  onAddMealItem: (item: LoggedMealItem) => void;
  onRemoveMealItem: (id: string) => void;
  onUpdateWater: (deltaMl: number) => void;
}

export const DietScreen: React.FC<DietScreenProps> = ({
  trainerName = 'Head Coach',
  loggedMeals,
  waterMl,
  goals,
  assignedMealPlan,
  onAddMealItem,
  onRemoveMealItem,
  onUpdateWater
}) => {
  const [activeTab, setActiveTab] = useState<'log' | 'assigned'>('log');
  const [activeMealCategory, setActiveMealCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>(CURATED_INDIAN_FOODS);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);
  const [foodFilterCategory, setFoodFilterCategory] = useState<string>('All');

  // Search dynamically with debounce across 8000+ foods
  useEffect(() => {
    let cancel = false;
    if (!foodSearchQuery.trim()) {
      setSearchResults(
        foodFilterCategory === 'All'
          ? CURATED_INDIAN_FOODS
          : CURATED_INDIAN_FOODS.filter((f) => f.category === foodFilterCategory)
      );
      return;
    }

    setIsSearchingDb(true);
    const timer = setTimeout(async () => {
      const results = await FoodService.searchFullDatabase(foodSearchQuery, foodFilterCategory);
      if (!cancel) {
        setSearchResults(results);
        setIsSearchingDb(false);
      }
    }, 250);

    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [foodSearchQuery, foodFilterCategory]);

  // Compute live intake totals
  const totalCalories = Math.round(loggedMeals.reduce((acc, m) => acc + m.calories, 0));
  const totalProtein = Math.round(loggedMeals.reduce((acc, m) => acc + m.protein, 0));
  const totalCarbs = Math.round(loggedMeals.reduce((acc, m) => acc + m.carbs, 0));
  const totalFat = Math.round(loggedMeals.reduce((acc, m) => acc + m.fat, 0));
  const totalFiber = Math.round(loggedMeals.reduce((acc, m) => acc + (m.fiber || 0), 0));

  // Percentages
  const caloriePercent = Math.min(100, Math.round((totalCalories / goals.calories) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / goals.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / goals.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / goals.fat) * 100));
  const waterPercent = Math.min(100, Math.round((waterMl / goals.waterMl) * 100));

  const mealTypes: { type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; label: string; icon: string }[] = [
    { type: 'breakfast', label: 'Breakfast', icon: '🌅' },
    { type: 'lunch', label: 'Lunch', icon: '☀️' },
    { type: 'dinner', label: 'Dinner', icon: '🌙' },
    { type: 'snack', label: 'Snacks & Supplements', icon: '⚡' }
  ];

  const handleConfirmLogFood = () => {
    if (!selectedFood || !activeMealCategory) return;
    hapticTap();

    const newLogItem: LoggedMealItem = {
      id: `meal-${Date.now()}`,
      foodId: selectedFood.id,
      name: `${selectedFood.name} (${servings}x)`,
      mealType: activeMealCategory,
      servingQuantity: servings,
      calories: Math.round(selectedFood.calories * servings),
      protein: Math.round(selectedFood.protein * servings),
      carbs: Math.round(selectedFood.carbs * servings),
      fat: Math.round(selectedFood.fat * servings),
      fiber: Math.round((selectedFood.fiber || 0) * servings),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onAddMealItem(newLogItem);
    setSelectedFood(null);
    setServings(1);
    setActiveMealCategory(null);
    setFoodSearchQuery('');
  };

  // Default fallback assigned plan if none set by trainer
  const currentPlan: AssignedMealPlan = assignedMealPlan || {
    id: 'default-plan',
    title: 'High Protein Indian Lean Bulk / Fat Loss Plan',
    dailyCalories: goals.calories,
    dailyProtein: goals.protein,
    dailyCarbs: goals.carbs,
    dailyFat: goals.fat,
    assignedBy: trainerName ? `Coach ${trainerName}` : 'Head Coach',
    meals: [
      {
        type: 'breakfast',
        title: 'High Protein South Indian Breakfast',
        items: ['3 Steamed Idlis', '4 Boiled Egg Whites', '1 bowl Vegetable Sambar'],
        suggestedCalories: 380,
        suggestedProtein: 28
      },
      {
        type: 'lunch',
        title: 'Clean Indian Power Lunch',
        items: ['150g Cooked Ponni Rice', '150g Grilled / Country Chicken Breast', '1 cup Fresh Curd', 'Green salad'],
        suggestedCalories: 580,
        suggestedProtein: 52
      },
      {
        type: 'snack',
        title: 'Pre/Post Workout Boost',
        items: ['1 Scoop Whey Protein Isolate (water)', '1 Fresh Tender Coconut Water (Elaneer)'],
        suggestedCalories: 170,
        suggestedProtein: 26
      },
      {
        type: 'dinner',
        title: 'Slow Digestion Night Fuel',
        items: ['2 Whole Wheat Phulkas / Rotis', '1 bowl Moong Dal Tadka', '100g Fresh Raw/Grilled Paneer'],
        suggestedCalories: 580,
        suggestedProtein: 33
      }
    ]
  };

  return (
    <div className="space-y-4 pb-28 text-left">
      {/* 1. Sub-tab Navigation: Actual Food Log vs Assigned Plan */}
      <div className="flex bg-[#0e1422] p-1 rounded-2xl border border-white/10">
        <button
          onClick={() => {
            hapticTap();
            setActiveTab('log');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'log'
              ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Today's Food Log</span>
        </button>

        <button
          onClick={() => {
            hapticTap();
            setActiveTab('assigned');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
            activeTab === 'assigned'
              ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CalendarCheck className="w-3.5 h-3.5" />
          <span>Assigned Meal Plan</span>
        </button>
      </div>

      {/* 2. Daily Calories & Macro Target Dashboard */}
      <div className="bg-[#0c101a] border border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-tech uppercase tracking-widest text-amber-500 font-bold">
              NUTRITION & MEAL DIARY
            </span>
            <h2 className="text-xl font-black text-white font-display">Daily Intake Tracker</h2>
          </div>
          <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-bold text-amber-400 font-tech">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{goals.calories - totalCalories > 0 ? `${goals.calories - totalCalories} kcal left` : 'Goal Met!'}</span>
          </div>
        </div>

        {/* Central Calorie Dial Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-2xl font-black text-white font-display">
              {totalCalories}{' '}
              <span className="text-xs text-slate-400 font-normal">/ {goals.calories} kcal</span>
            </span>
            <span className="text-xs font-tech font-bold text-amber-400">{caloriePercent}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-white/5">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
        </div>

        {/* 3 Macro Cards */}
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
          <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
            <span className="text-[10px] uppercase font-tech text-amber-400 font-bold block">Protein</span>
            <span className="text-sm font-black text-white font-display mt-0.5 block">
              {totalProtein}g <span className="text-[10px] text-slate-500 font-normal">/ {goals.protein}g</span>
            </span>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${proteinPercent}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
            <span className="text-[10px] uppercase font-tech text-cyan-400 font-bold block">Carbs</span>
            <span className="text-sm font-black text-white font-display mt-0.5 block">
              {totalCarbs}g <span className="text-[10px] text-slate-500 font-normal">/ {goals.carbs}g</span>
            </span>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${carbsPercent}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/5">
            <span className="text-[10px] uppercase font-tech text-rose-400 font-bold block">Fats</span>
            <span className="text-sm font-black text-white font-display mt-0.5 block">
              {totalFat}g <span className="text-[10px] text-slate-500 font-normal">/ {goals.fat}g</span>
            </span>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-rose-400 h-full rounded-full" style={{ width: `${fatPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 3. Water Hydration Card */}
      <div className="bg-[#0c101a] border border-cyan-500/30 rounded-3xl p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-black text-white font-display">Water Hydration</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-bold px-1.5 py-0.5 rounded font-tech">
                {waterPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-400 font-tech">
              {(waterMl / 1000).toFixed(2)}L / {(goals.waterMl / 1000).toFixed(1)}L goal
            </p>
          </div>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => {
              hapticTap();
              onUpdateWater(250);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-900 text-xs font-bold active:scale-95 transition-all"
          >
            +250ml
          </button>
          <button
            onClick={() => {
              hapticTap();
              onUpdateWater(500);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-cyan-500 text-black font-black text-xs hover:bg-cyan-400 active:scale-95 transition-all shadow"
          >
            +500ml
          </button>
        </div>
      </div>

      {/* 4. Tab Content A: TODAY'S ACTUAL FOOD LOG */}
      {activeTab === 'log' && (
        <div className="space-y-3">
          {mealTypes.map((meal) => {
            const items = loggedMeals.filter((m) => m.mealType === meal.type);
            const mealCalories = items.reduce((acc, i) => acc + i.calories, 0);
            const mealProtein = items.reduce((acc, i) => acc + i.protein, 0);

            return (
              <div key={meal.type} className="rounded-2xl bg-[#0c101a] border border-white/5 p-4 shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-base">{meal.icon}</span>
                    <div>
                      <h4 className="text-sm font-black text-white font-display leading-none">
                        {meal.label}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-tech">
                        {mealCalories} kcal • {mealProtein}g protein
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      hapticTap();
                      setActiveMealCategory(meal.type);
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 text-xs font-bold border border-white/5 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Food</span>
                  </button>
                </div>

                {/* Logged Food Items */}
                {items.length > 0 ? (
                  <div className="divide-y divide-white/5 pt-1">
                    {items.map((item) => (
                      <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-slate-200 font-medium">{item.name}</span>
                          <span className="text-[10px] text-slate-500 font-tech block">
                            {item.protein}g P • {item.carbs}g C • {item.fat}g F • {item.time}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2.5">
                          <span className="font-tech font-bold text-amber-400">
                            {item.calories} kcal
                          </span>
                          <button
                            onClick={() => {
                              hapticTap();
                              onRemoveMealItem(item.id);
                            }}
                            className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic pt-1">No items logged yet.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. Tab Content B: ASSIGNED MEAL PLAN (From Coach Vignesh) */}
      {activeTab === 'assigned' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5">
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-xs font-bold text-amber-400 font-display">
                {currentPlan.title}
              </h4>
              <span className="text-[10px] font-tech text-amber-400/80">
                Prescribed by {currentPlan.assignedBy}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Target: {currentPlan.dailyCalories} kcal • {currentPlan.dailyProtein}g protein • {currentPlan.dailyCarbs}g carbs • {currentPlan.dailyFat}g fats.
            </p>
          </div>

          {currentPlan.meals.map((m, idx) => (
            <div key={idx} className="rounded-2xl bg-[#0c101a] border border-white/5 p-4 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-[10px] font-tech uppercase text-amber-400 font-bold tracking-wider">
                    {m.type}
                  </span>
                  <h4 className="text-sm font-bold text-white font-display">{m.title}</h4>
                </div>
                <span className="text-xs text-slate-400 font-tech font-bold">
                  {m.suggestedCalories} kcal • {m.suggestedProtein}g P
                </span>
              </div>

              <ul className="space-y-1 my-2">
                {m.items.map((item, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* 6. Food Search & Logger Modal */}
      {activeMealCategory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-[#0d121c] border border-white/10 rounded-t-3xl sm:rounded-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-tech uppercase tracking-wider text-amber-400 font-bold">
                  Log into {activeMealCategory}
                </span>
                <h3 className="text-base font-black text-white font-display">
                  Food & Nutrition Catalog
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveMealCategory(null);
                  setSelectedFood(null);
                }}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-white/5 bg-[#090d15]">
              <div className="flex items-center bg-[#151a24] rounded-xl px-3 py-2 text-slate-400 focus-within:ring-2 focus-within:ring-amber-500">
                <Search className="w-4 h-4 mr-2 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  placeholder="Search idli, dosa, biryani, chicken, paneer, dal..."
                  className="bg-transparent text-white text-xs w-full outline-none placeholder-slate-500"
                  autoFocus
                />
                {isSearchingDb && (
                  <span className="text-[10px] font-tech text-amber-400 animate-pulse">Searching...</span>
                )}
              </div>

              {/* Tamil Nadu Gym Food Categories Pill Bar */}
              <div className="flex space-x-1.5 overflow-x-auto scrollbar-none pt-2 text-[10px] font-tech font-bold">
                {[
                  { id: 'All', label: 'All Items' },
                  { id: 'Fruits', label: '🍎 Fruits' },
                  { id: 'Vegetables & Greens', label: '🥦 Veggies & Greens' },
                  { id: 'Meats & Seafood', label: '🍗 Chicken, Meat & Fish' },
                  { id: 'Eggs & Dairy', label: '🥚 Eggs & Dairy' },
                  { id: 'Grains & Millets', label: '🌾 Rice, Oats & Millets' },
                  { id: 'Pulses & Legumes', label: '🌱 Dal, Chana & Soya' },
                  { id: 'Nuts & Healthy Fats', label: '🥜 Nuts & Seeds' },
                  { id: 'Beverages & Drinks', label: '🥥 Hydration & Drinks' },
                  { id: 'Supplements', label: '⚡ Supplements' },
                  { id: 'South Indian Breakfast', label: '🥞 Idli & Dosa' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      hapticTap();
                      setFoodFilterCategory(cat.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg flex-shrink-0 transition-all ${
                      foodFilterCategory === cat.id
                        ? 'bg-amber-500 text-black font-extrabold shadow'
                        : 'bg-slate-900/80 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-3 divide-y divide-white/5">
              {searchResults.slice(0, 40).map((food) => {
                const isSelected = selectedFood?.id === food.id;
                return (
                  <div
                    key={food.id}
                    onClick={() => {
                      hapticTap();
                      setSelectedFood(food);
                    }}
                    className={`py-2.5 px-3 rounded-xl flex items-center justify-between cursor-pointer transition-all ${
                      isSelected ? 'bg-amber-500/20 border border-amber-500/40' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-white">{food.name}</span>
                        {food.verified && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-tech">
                            Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-tech block mt-0.5">
                        {food.servingSize} • {food.protein}g P • {food.carbs}g C • {food.fat}g F
                      </span>
                    </div>
                    <span className="text-xs font-tech font-bold text-amber-400">
                      {food.calories} kcal
                    </span>
                  </div>
                );
              })}

              {searchResults.length === 0 && (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No foods matching "{foodSearchQuery}". Try a different name or regional dish.
                </div>
              )}
            </div>

            {/* Confirm Log Action Footer */}
            {selectedFood && (
              <div className="p-4 bg-[#07090e] border-t border-white/10 flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400">Servings:</span>
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-tech font-bold text-amber-400 px-1 text-sm">{servings}</span>
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-800 text-white font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleConfirmLogFood}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-display font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-1 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Add ({Math.round(selectedFood.calories * servings)} kcal)
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
