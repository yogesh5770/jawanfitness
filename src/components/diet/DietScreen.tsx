import React, { useState, useEffect } from 'react';
import { FoodItem, LoggedMealItem, DailyNutritionGoals } from '../../types';
import { FoodService, CURATED_INDIAN_FOODS } from '../../data/foodDatabase';
import { Plus, Trash2, Droplets, Search, X, Check, Flame, Sparkles, Calendar, ChevronLeft, ChevronRight, RotateCcw, Clock } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';
import { syncedStore, getTodayDateKey } from '../../services/syncedStore';

interface DietScreenProps {
  trainerName?: string;
  loggedMeals: LoggedMealItem[];
  waterMl: number;
  goals: DailyNutritionGoals;
  assignedMealPlan?: any;
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
  const todayKey = getTodayDateKey();
  const [selectedDate, setSelectedDate] = useState<string>(todayKey);
  const [viewScope, setViewScope] = useState<'today' | 'yesterday' | 'all'>('today');
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const yesterdayDateObj = new Date();
  yesterdayDateObj.setDate(yesterdayDateObj.getDate() - 1);
  const yesterdayKey = getTodayDateKey(yesterdayDateObj);

  const formatDisplayDate = (key: string) => {
    try {
      const [y, m, d] = key.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return key;
    }
  };

  const isViewingToday = selectedDate === todayKey && viewScope !== 'all';
  const isViewingYesterday = selectedDate === yesterdayKey && viewScope !== 'all';

  const [activeMealCategory, setActiveMealCategory] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack' | null>(null);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [asyncResults, setAsyncResults] = useState<FoodItem[]>([]);
  const [isSearchingDb, setIsSearchingDb] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [servings, setServings] = useState(1);
  const [foodFilterCategory, setFoodFilterCategory] = useState<string>('All');

  // Assigned meal plan comes ONLY from props (resolved per-member by ClientApp).
  // Never fall back to the first key in the store — that leaks other members' plans.
  const effectivePlan = assignedMealPlan ?? null;

  // Search dynamically with debounce across 8000+ foods
  useEffect(() => {
    let cancel = false;
    if (!foodSearchQuery.trim()) {
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDb(true);
      const results = await FoodService.searchFullDatabase(foodSearchQuery, foodFilterCategory);
      if (!cancel) {
        setAsyncResults(results);
        setIsSearchingDb(false);
      }
    }, 250);

    return () => {
      cancel = true;
      clearTimeout(timer);
    };
  }, [foodSearchQuery, foodFilterCategory]);

  const searchResults = React.useMemo(() => {
    if (!foodSearchQuery.trim()) {
      return foodFilterCategory === 'All'
        ? CURATED_INDIAN_FOODS
        : CURATED_INDIAN_FOODS.filter((f) => f.category === foodFilterCategory);
    }
    return asyncResults;
  }, [foodSearchQuery, foodFilterCategory, asyncResults]);

  // Compute live intake totals strictly for the selected view scope
  const displayedMeals = loggedMeals.filter((m) => {
    if (viewScope === 'all') return true;
    const mealDate = m.date || todayKey;
    return mealDate === selectedDate;
  });

  const totalCalories = Math.round(displayedMeals.reduce((acc, m) => acc + m.calories, 0));
  const totalProtein = Math.round(displayedMeals.reduce((acc, m) => acc + m.protein, 0));
  const totalCarbs = Math.round(displayedMeals.reduce((acc, m) => acc + m.carbs, 0));
  const totalFat = Math.round(displayedMeals.reduce((acc, m) => acc + m.fat, 0));
  const totalFiber = Math.round(displayedMeals.reduce((acc, m) => acc + (m.fiber || 0), 0));

  const effectiveWater = isViewingToday
    ? waterMl
    : (syncedStore.getState().dailyWaterLog?.[selectedDate] ?? (selectedDate === todayKey ? waterMl : 0));

  // Percentages
  const caloriePercent = Math.min(100, Math.round((totalCalories / goals.calories) * 100));
  const proteinPercent = Math.min(100, Math.round((totalProtein / goals.protein) * 100));
  const carbsPercent = Math.min(100, Math.round((totalCarbs / goals.carbs) * 100));
  const fatPercent = Math.min(100, Math.round((totalFat / goals.fat) * 100));
  const waterPercent = Math.min(100, Math.round((effectiveWater / goals.waterMl) * 100));

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
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: isViewingToday ? todayKey : selectedDate
    };

    onAddMealItem(newLogItem);
    setSelectedFood(null);
    setServings(1);
    setActiveMealCategory(null);
    setFoodSearchQuery('');
  };

  return (
    <div className="space-y-4 pb-28 text-left">
      {/* 0. Daily Date Navigator & Cycle Refresh Controller */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                hapticTap();
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                const prevKey = getTodayDateKey(d);
                setSelectedDate(prevKey);
                setViewScope('custom' as any);
              }}
              title="Previous Day"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-500" />
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-display">
                {isViewingToday
                  ? `Today (${formatDisplayDate(todayKey)})`
                  : isViewingYesterday
                  ? `Yesterday (${formatDisplayDate(yesterdayKey)})`
                  : viewScope === 'all'
                  ? 'All History Records'
                  : formatDisplayDate(selectedDate)}
              </span>
              {isViewingToday && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>

            <button
              disabled={isViewingToday}
              onClick={() => {
                hapticTap();
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                const nextKey = getTodayDateKey(d);
                if (nextKey <= todayKey) {
                  setSelectedDate(nextKey);
                  setViewScope(nextKey === todayKey ? 'today' : ('custom' as any));
                }
              }}
              title="Next Day"
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              hapticTap();
              setIsResetConfirmOpen(true);
            }}
            title="Reset today's meal diary"
            className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-tech font-bold flex items-center space-x-1.5 transition-all active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Today</span>
          </button>
        </div>

        {/* Quick Scope Filter Tabs */}
        <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 dark:border-white/5">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                hapticTap();
                setSelectedDate(todayKey);
                setViewScope('today');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-tech font-bold transition-all ${
                viewScope === 'today' && selectedDate === todayKey
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                hapticTap();
                setSelectedDate(yesterdayKey);
                setViewScope('yesterday');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-tech font-bold transition-all ${
                viewScope === 'yesterday' || (selectedDate === yesterdayKey && viewScope !== 'all')
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => {
                hapticTap();
                setViewScope('all');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-tech font-bold transition-all ${
                viewScope === 'all'
                  ? 'bg-amber-500 text-black shadow-md'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All Logs
            </button>
          </div>

          <div className="flex items-center space-x-1 text-[10px] text-slate-500 dark:text-slate-400 font-tech">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Daily Rollover at 12:00 AM</span>
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-white dark:bg-[#0e131f] border border-amber-500/30 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-500">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-display">Refresh Today's Diary?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Clear today's meals and water</p>
              </div>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              This will clear meals logged for <strong>Today ({formatDisplayDate(todayKey)})</strong> and reset today's water to 0. All past days' records will remain preserved in your history.
            </p>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-tech"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  hapticTap();
                  syncedStore.refreshTodayDiet();
                  setIsResetConfirmOpen(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-black font-display uppercase tracking-wider shadow-lg"
              >
                Confirm Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Daily Calories & Macro Target Dashboard */}
      <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-[10px] font-tech uppercase tracking-widest text-amber-600 dark:text-amber-500 font-bold">
              {isViewingToday ? "TODAY'S INTAKE DIARY" : `NUTRITION • ${formatDisplayDate(selectedDate).toUpperCase()}`}
            </span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white font-display">
              {isViewingToday ? 'Daily Intake Tracker' : `Intake Log (${formatDisplayDate(selectedDate)})`}
            </h2>
          </div>
          <div className="flex items-center space-x-1 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full text-xs font-bold text-amber-600 dark:text-amber-400 font-tech">
            <Flame className="w-3.5 h-3.5 fill-amber-400" />
            <span>{goals.calories - totalCalories > 0 ? `${goals.calories - totalCalories} kcal left` : 'Goal Met!'}</span>
          </div>
        </div>

        {/* Central Calorie Dial Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-2xl font-black text-slate-900 dark:text-white font-display">
              {totalCalories}{' '}
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">/ {goals.calories} kcal</span>
            </span>
            <span className="text-xs font-tech font-bold text-amber-600 dark:text-amber-400">{caloriePercent}%</span>
          </div>
          <div className="w-full bg-white dark:bg-slate-900 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200/80 dark:border-white/5">
            <div
              className="bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${caloriePercent}%` }}
            />
          </div>
        </div>

        {/* 4 Macro Cards */}
        <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-200/80 dark:border-white/5">
          <div className="bg-slate-100/70 dark:bg-slate-900/60 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] sm:text-[10px] uppercase font-tech text-amber-600 dark:text-amber-400 font-bold block">Protein</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-display mt-0.5 block">
              {totalProtein}g
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-amber-400 h-full rounded-full" style={{ width: `${proteinPercent}%` }} />
            </div>
          </div>

          <div className="bg-slate-100/70 dark:bg-slate-900/60 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] sm:text-[10px] uppercase font-tech text-cyan-600 dark:text-cyan-400 font-bold block">Carbs</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-display mt-0.5 block">
              {totalCarbs}g
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-cyan-400 h-full rounded-full" style={{ width: `${carbsPercent}%` }} />
            </div>
          </div>

          <div className="bg-slate-100/70 dark:bg-slate-900/60 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] sm:text-[10px] uppercase font-tech text-rose-600 dark:text-rose-400 font-bold block">Fats</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-display mt-0.5 block">
              {totalFat}g
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-rose-400 h-full rounded-full" style={{ width: `${fatPercent}%` }} />
            </div>
          </div>

          <div className="bg-slate-100/70 dark:bg-slate-900/60 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-white/5">
            <span className="text-[9px] sm:text-[10px] uppercase font-tech text-emerald-600 dark:text-emerald-400 font-bold block">Fiber</span>
            <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-display mt-0.5 block">
              {totalFiber}g
            </span>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div className="bg-emerald-400 h-full rounded-full" style={{ width: `${Math.min(100, Math.round((totalFiber / (goals.fiber || 35)) * 100))}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 1.5. COACH PRESCRIBED DIET PLAN */}
      {effectivePlan ? (
        <div className="bg-gradient-to-br from-white dark:from-[#0e1628] to-white dark:to-[#0a101d] border-2 border-amber-500/40 rounded-3xl p-3.5 sm:p-5 shadow-xl relative overflow-hidden text-left space-y-3.5">
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 gap-2">
            <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold shadow-inner flex-shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-tech uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold block truncate">
                  Prescribed by Coach {effectivePlan.assignedBy || trainerName}
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-display truncate">
                  {effectivePlan.title}
                </h3>
              </div>
            </div>
            <span className="text-[10px] sm:text-xs font-tech font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full flex-shrink-0">
              Active Plan
            </span>
          </div>

          {/* Prescribed Macro Targets */}
          <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
            <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-white/5">
              <span className="text-[8px] sm:text-[9px] uppercase font-tech text-slate-500 dark:text-slate-400 block">Calories</span>
              <p className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-white font-display mt-0.5 truncate">{effectivePlan.dailyCalories} kcal</p>
            </div>
            <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-white/5">
              <span className="text-[8px] sm:text-[9px] uppercase font-tech text-amber-600 dark:text-amber-400 block">Protein</span>
              <p className="text-[11px] sm:text-sm font-black text-amber-600 dark:text-amber-400 font-display mt-0.5 truncate">{effectivePlan.dailyProtein}g</p>
            </div>
            <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-white/5">
              <span className="text-[8px] sm:text-[9px] uppercase font-tech text-cyan-600 dark:text-cyan-400 block">Carbs</span>
              <p className="text-[11px] sm:text-sm font-black text-cyan-600 dark:text-cyan-400 font-display mt-0.5 truncate">{effectivePlan.dailyCarbs}g</p>
            </div>
            <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 sm:p-2 rounded-xl border border-slate-200/80 dark:border-white/5">
              <span className="text-[8px] sm:text-[9px] uppercase font-tech text-rose-600 dark:text-rose-400 block">Fat</span>
              <p className="text-[11px] sm:text-sm font-black text-rose-600 dark:text-rose-400 font-display mt-0.5 truncate">{effectivePlan.dailyFat}g</p>
            </div>
          </div>

          {/* Prescribed Meals List */}
          <div className="space-y-2 pt-1">
            <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-tech uppercase tracking-wider flex items-center space-x-1.5">
              <span>Prescribed Daily Meals</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
              {effectivePlan.meals?.map((m: any, idx: number) => {
                const mealIcons: Record<string, string> = {
                  breakfast: '🌅',
                  lunch: '☀️',
                  snack: '⚡',
                  dinner: '🌙'
                };
                return (
                  <div key={idx} className="bg-slate-100/90 dark:bg-slate-900/90 rounded-2xl p-3 border border-slate-200 dark:border-white/10 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 min-w-0 flex-1">
                        <span className="text-base flex-shrink-0">{mealIcons[m.type] || '🍽️'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 dark:text-white capitalize truncate">{m.title || m.type}</p>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-tech block truncate">
                            {m.suggestedCalories} kcal • {m.suggestedProtein}g Protein
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          hapticTap();
                          onAddMealItem({
                            id: `meal-${Date.now()}-${idx}`,
                            foodId: `custom-prescribed-${idx}`,
                            name: `${m.title || m.type}: ${Array.isArray(m.items) ? m.items.join(', ') : m.items}`,
                            mealType: m.type,
                            servingQuantity: 1,
                            calories: m.suggestedCalories || 0,
                            protein: m.suggestedProtein || 0,
                            carbs: Math.round((m.suggestedCalories || 0) * 0.45 / 4),
                            fat: Math.round((m.suggestedCalories || 0) * 0.25 / 9),
                            fiber: 5,
                            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          });
                        }}
                        className="px-2 sm:px-2.5 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/30 transition-colors flex items-center space-x-1 flex-shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Log Meal</span>
                      </button>
                    </div>

                    {/* Food Items Pills */}
                    <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-1">
                      {(Array.isArray(m.items) ? m.items : [m.items]).map((item: string, iIdx: number) => (
                        <span
                          key={iIdx}
                          className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/5 font-medium break-words"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#0c101a] border border-slate-200 dark:border-white/10 rounded-2xl p-4 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-amber-600 dark:text-amber-500/40 mx-auto" />
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">General Nutrition Guidelines</h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Your coach {trainerName} has not prescribed a customized meal plan yet. You can track your daily calorie and macro intake below using the food search.
          </p>
        </div>
      )}

      {/* 2. Water Hydration Card */}
      <div className="bg-white dark:bg-[#0c101a] border border-cyan-500/30 rounded-3xl p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
            <Droplets className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-black text-slate-900 dark:text-white font-display">Water Hydration</span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-bold px-1.5 py-0.5 rounded font-tech">
                {waterPercent}%
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-tech">
              {(effectiveWater / 1000).toFixed(2)}L / {(goals.waterMl / 1000).toFixed(1)}L goal
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
            className="px-2.5 py-1.5 rounded-xl bg-cyan-950 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-900 text-xs font-bold active:scale-95 transition-all"
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

      {/* 3. DYNAMIC MEAL LOGS FOR SELECTED DATE */}
      <div className="space-y-3">
        {mealTypes.map((meal) => {
          const items = displayedMeals.filter((m) => m.mealType === meal.type);
          const mealCalories = items.reduce((acc, i) => acc + i.calories, 0);
          const mealProtein = items.reduce((acc, i) => acc + i.protein, 0);

          return (
            <div key={meal.type} className="rounded-2xl bg-white dark:bg-[#0c101a] border border-slate-200/80 dark:border-white/5 p-4 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-base">{meal.icon}</span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white font-display leading-none">
                      {meal.label}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-tech">
                      {mealCalories} kcal • {mealProtein}g P
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    hapticTap();
                    setActiveMealCategory(meal.type);
                  }}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-amber-600 dark:text-amber-400 hover:text-amber-300 text-xs font-bold border border-slate-200/80 dark:border-white/5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Food</span>
                </button>
              </div>

              {/* Logged Food Items */}
              {items.length > 0 && (
                <div className="divide-y divide-white/5 pt-1">
                  {items.map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-800 dark:text-slate-200 font-medium">{item.name}</span>
                        <span className="text-[10px] text-slate-500 font-tech block">
                          {item.protein}g P • {item.carbs}g C • {item.fat}g F • {item.time}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2.5">
                        <span className="font-tech font-bold text-amber-600 dark:text-amber-400">
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
              )}
            </div>
          );
        })}
      </div>

      {/* 6. Food Search & Logger Modal */}
      {activeMealCategory && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-white dark:bg-[#0d121c] border border-slate-200 dark:border-white/10 rounded-t-3xl sm:rounded-3xl h-[88dvh] max-h-[88dvh] sm:h-auto sm:max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-tech uppercase tracking-wider text-amber-600 dark:text-amber-400 font-bold">
                  Log into {activeMealCategory}
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white font-display">
                  Food & Nutrition Catalog
                </h3>
              </div>
              <button
                onClick={() => {
                  setActiveMealCategory(null);
                  setSelectedFood(null);
                }}
                className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-3 border-b border-slate-200/80 dark:border-white/5 bg-white dark:bg-[#090d15]">
              <div className="flex items-center bg-white dark:bg-[#151a24] rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400 focus-within:ring-2 focus-within:ring-amber-500">
                <Search className="w-4 h-4 mr-2 text-slate-500 dark:text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={foodSearchQuery}
                  onChange={(e) => setFoodSearchQuery(e.target.value)}
                  placeholder="Search idli, dosa, biryani, chicken, paneer, dal..."
                  className="bg-transparent text-slate-900 dark:text-white text-xs w-full outline-none placeholder:text-slate-500 dark:placeholder:text-slate-400"
                  autoFocus
                />
                {isSearchingDb && (
                  <span className="text-[10px] font-tech text-amber-600 dark:text-amber-400 animate-pulse">Searching...</span>
                )}
              </div>

              {/* Verified Food Categories Pill Bar */}
              <div className="flex space-x-1.5 overflow-x-auto scrollbar-none pt-2 text-[10px] font-tech font-bold">
                {[
                  { id: 'All', label: 'All Items' },
                  { id: 'Rice & grains', label: '🌾 Rice & Grains' },
                  { id: 'Millets', label: '🌾 Millets' },
                  { id: 'Pulses & dals', label: '🌱 Pulses & Dals' },
                  { id: 'Chicken & meat', label: '🍗 Chicken & Meat' },
                  { id: 'Fish & seafood', label: '🐟 Fish & Seafood' },
                  { id: 'Eggs', label: '🥚 Eggs' },
                  { id: 'Dairy', label: '🥛 Dairy' },
                  { id: 'Vegetables', label: '🥦 Vegetables & Greens' },
                  { id: 'Fruits', label: '🍎 Fruits' },
                  { id: 'Nuts & seeds', label: '🥜 Nuts & Seeds' },
                  { id: 'Indian & Tamil Nadu meals', label: '🍛 Meals & Tiffin' },
                  { id: 'Snacks & restaurant foods', label: '🥪 Snacks & Quick Bites' },
                  { id: 'Beverages', label: '🥤 Beverages & Drinks' },
                  { id: 'Sweets & desserts', label: '🍨 Sweets & Desserts' },
                  { id: 'Cooking ingredients & condiments', label: '🧂 Spices & Condiments' }
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
                        : 'bg-slate-100/80 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-white/5'
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
                      isSelected ? 'bg-amber-500/20 border border-amber-500/40' : 'hover:bg-slate-100 dark:hover:bg-white/[0.03]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{food.name}</span>
                        {food.verified && (
                          <span className="text-[9px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.2 rounded font-tech">
                            Verified
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-tech block mt-0.5">
                        {food.servingSize} • {food.protein}g P • {food.carbs}g C • {food.fat}g F
                      </span>
                    </div>
                    <span className="text-xs font-tech font-bold text-amber-600 dark:text-amber-400">
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
              <div className="p-4 bg-slate-50 dark:bg-[#07090e] border-t border-slate-200 dark:border-white/10 flex items-center justify-between space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-500 dark:text-slate-400">Servings:</span>
                  <button
                    onClick={() => setServings(Math.max(1, servings - 1))}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold flex items-center justify-center"
                  >
                    -
                  </button>
                  <span className="font-tech font-bold text-amber-600 dark:text-amber-400 px-1 text-sm">{servings}</span>
                  <button
                    onClick={() => setServings(servings + 1)}
                    className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold flex items-center justify-center"
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
