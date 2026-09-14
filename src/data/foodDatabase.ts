import { FoodItem, FoodCategory } from '../types';
import masterFoodList from './jawanMasterFoods.json';
import { syncedStore } from '../services/syncedStore';

// =======================================================================
// MASTER JAWAN VERIFIED FOOD DATABASE (1,005 Verified Items)
// Loaded from user-provided authoritative verified nutrition dataset
// =======================================================================
export const BASE_FOOD_ITEMS: FoodItem[] = masterFoodList as FoodItem[];
export const MASTER_FOOD_DATABASE: FoodItem[] = masterFoodList as FoodItem[];
export const CURATED_INDIAN_FOODS: FoodItem[] = MASTER_FOOD_DATABASE;

export const FOOD_CATEGORIES = [
  'All',
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

export const FoodService = {
  getAll(): FoodItem[] {
    const custom = syncedStore.getCustomFoods();
    return [...custom, ...MASTER_FOOD_DATABASE];
  },

  getCount(): number {
    return MASTER_FOOD_DATABASE.length + (syncedStore.getCustomFoods()?.length || 0);
  },

  getById(id: string): FoodItem | undefined {
    const custom = syncedStore.getCustomFoods().find((f) => f.id === id);
    if (custom) return custom;
    return MASTER_FOOD_DATABASE.find((f) => f.id === id) || MASTER_FOOD_DATABASE[0];
  },

  searchCurated(query: string, category: string = 'All'): FoodItem[] {
    const q = query.trim().toLowerCase();
    const customFoods = syncedStore.getCustomFoods();
    const combined = [...customFoods, ...MASTER_FOOD_DATABASE];

    return combined.filter((food) => {
      if (category !== 'All') {
        const catMatch =
          food.category.toLowerCase().includes(category.toLowerCase()) ||
          category.toLowerCase().includes(food.category.toLowerCase());
        if (!catMatch) return false;
      }
      if (!q) return true;
      return (
        food.name.toLowerCase().includes(q) ||
        food.category.toLowerCase().includes(q) ||
        food.servingSize.toLowerCase().includes(q)
      );
    }).slice(0, 100);
  },

  search(query: string, category?: string): FoodItem[] {
    return this.searchCurated(query, category || 'All');
  },

  async searchFullDatabase(query: string, category?: string): Promise<FoodItem[]> {
    return this.search(query, category);
  }
};

export default FoodService;
