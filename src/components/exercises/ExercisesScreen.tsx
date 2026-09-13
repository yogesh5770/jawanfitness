import React, { useState, useMemo, useEffect } from 'react';
import { Exercise, MuscleGroup } from '../../types';
import { ExerciseService } from '../../services/exerciseService';
import { AnatomicalExerciseIllustration } from '../anatomy/AnatomicalExerciseIllustration';
import { ExerciseDetailModal } from './ExerciseDetailModal';
import { Search, Star, Filter, X, Sparkles, Dumbbell } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface ExercisesScreenProps {
  onStartExercise?: (exercise: Exercise) => void;
  onBack?: () => void;
}

export const ExercisesScreen: React.FC<ExercisesScreenProps> = ({ onStartExercise, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Chest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('All');
  const [activeDetailExercise, setActiveDetailExercise] = useState<Exercise | null>(null);

  // Persistent favorites state
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('jawan_favorite_exercises');
      return saved ? new Set(JSON.parse(saved)) : new Set(['0314', '0319', '0025']);
    } catch {
      return new Set();
    }
  });

  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('jawan_favorite_exercises', JSON.stringify(Array.from(favoriteIds)));
    } catch {
      // ignore
    }
  }, [favoriteIds]);

  const categories = [
    'All',
    'Chest',
    'Back',
    'Shoulders',
    'Biceps',
    'Triceps',
    'Legs',
    'Glutes',
    'Abs',
    'Cardio',
    'Full Body',
    'Mobility',
    'Stretching'
  ];

  const equipments = [
    'All',
    'Barbell',
    'Dumbbell',
    'Bodyweight',
    'Cable',
    'Machine'
  ];

  // Real-time query execution across 1,324 exercises
  const filteredExercises = useMemo(() => {
    let results: Exercise[] = [];

    if (showOnlyFavorites) {
      results = ExerciseService.getFavorites(Array.from(favoriteIds));
    } else {
      results = ExerciseService.search(
        searchQuery,
        selectedCategory as MuscleGroup | 'All',
        selectedEquipment === 'All' ? undefined : selectedEquipment
      );
    }

    if (showOnlyFavorites && searchQuery) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (ex) =>
          ex.name.toLowerCase().includes(q) ||
          ex.primaryMuscle.toLowerCase().includes(q) ||
          ex.equipment.toLowerCase().includes(q)
      );
    }

    return results;
  }, [searchQuery, selectedCategory, selectedEquipment, showOnlyFavorites, favoriteIds]);

  const toggleFavorite = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    hapticTap();
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="bg-black min-h-screen text-white text-left pb-28 -mx-4 -mt-4 px-4 pt-3">
      {/* 1. Header Bar matching Fitness Online */}
      <div className="flex items-center justify-between py-2 border-b border-white/5 mb-3">
        <div className="flex items-center space-x-2">
          {onBack && (
            <button
              onClick={onBack}
              className="text-slate-300 hover:text-white p-1 rounded-full active:scale-95"
            >
              ←
            </button>
          )}
          <h1 className="text-xl font-black text-white font-display tracking-wide">
            {showOnlyFavorites ? '★ Favorites' : selectedCategory === 'All' ? 'All Exercises' : `${selectedCategory} Exercises`}
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              hapticTap();
              setShowOnlyFavorites(!showOnlyFavorites);
            }}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all ${
              showOnlyFavorites
                ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)]'
                : 'bg-white/10 text-slate-300 hover:text-white'
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${showOnlyFavorites ? 'fill-black' : ''}`} />
            <span>{favoriteIds.size}</span>
          </button>
        </div>
      </div>

      {/* 2. Pill Search Bar */}
      <div className="relative mb-3">
        <div className="flex items-center bg-[#1c1c1e] rounded-full px-4 py-2 text-slate-400 focus-within:ring-2 focus-within:ring-amber-500/50 transition-all">
          <Search className="w-4 h-4 mr-2.5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 1,324 exercises (e.g. incline dumbbell)..."
            className="bg-transparent text-white text-sm w-full outline-none placeholder-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="p-1 hover:text-white text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Horizontal Scrollable Category Chips */}
      {!showOnlyFavorites && (
        <div className="overflow-x-auto scrollbar-none -mx-4 px-4 pb-2 mb-2 flex space-x-2">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  hapticTap();
                  setSelectedCategory(cat);
                }}
                className={`px-3.5 py-1.5 rounded-full text-xs font-tech font-bold whitespace-nowrap transition-all duration-150 ${
                  isSelected
                    ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-105'
                    : 'bg-[#151a24] text-slate-300 hover:bg-[#1f2636] hover:text-white border border-white/5'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Equipment Filter Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1">
        <span className="font-tech uppercase tracking-wider text-[11px]">
          {filteredExercises.length} {filteredExercises.length === 1 ? 'Exercise' : 'Exercises'} Found
        </span>

        <div className="flex items-center space-x-1">
          <Dumbbell className="w-3 h-3 text-slate-400" />
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="bg-[#151a24] text-slate-300 text-[11px] rounded-lg px-2 py-1 border border-white/10 outline-none"
          >
            {equipments.map((eq) => (
              <option key={eq} value={eq}>
                {eq}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Exercise List Card Stack */}
      <div className="divide-y divide-white/5">
        {filteredExercises.map((exercise) => {
          const isFav = favoriteIds.has(exercise.id);

          return (
            <div
              key={exercise.id}
              onClick={() => {
                hapticTap();
                setActiveDetailExercise(exercise);
              }}
              className="py-3 px-1 flex items-center space-x-3.5 cursor-pointer hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors group select-none rounded-xl"
            >
              {/* GymVisual 3D Anatomical Thumbnail with Neon Muscle Accent */}
              <div className="w-20 h-16 flex-shrink-0 flex items-center justify-center bg-[#07090e] border border-white/5 rounded-lg overflow-hidden relative">
                {exercise.thumbnailUrl ? (
                  <img
                    src={exercise.thumbnailUrl}
                    alt={exercise.name}
                    loading="lazy"
                    className="w-full h-full object-contain filter contrast-125"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                ) : null}
                <div style={{ display: exercise.thumbnailUrl ? 'none' : 'block' }} className="w-full h-full">
                  <AnatomicalExerciseIllustration
                    exerciseId={exercise.id}
                    category={exercise.category}
                    className="w-full h-full"
                  />
                </div>
              </div>

              {/* Exercise Title, Muscle & Equipment */}
              <div className="flex-1 min-w-0 pr-1">
                <h3 className="text-[14px] text-white font-medium leading-snug group-hover:text-amber-400 transition-colors truncate">
                  {exercise.name}
                </h3>
                <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-400">
                  <span className="text-amber-400/90 font-medium">{exercise.primaryMuscle}</span>
                  <span>•</span>
                  <span className="text-slate-400">{exercise.equipment}</span>
                </div>
              </div>

              {/* Independent Favorite Button */}
              <button
                type="button"
                onClick={(e) => toggleFavorite(e, exercise.id)}
                className="p-2 text-slate-500 hover:text-amber-400 transition-colors flex-shrink-0"
                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
              >
                <Star
                  className={`w-4 h-4 transition-all ${
                    isFav ? 'fill-amber-400 text-amber-400 scale-110' : 'text-slate-600'
                  }`}
                />
              </button>
            </div>
          );
        })}

        {filteredExercises.length === 0 && (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Sparkles className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No exercises found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              Try adjusting your search query or selecting a different muscle group.
            </p>
            {(searchQuery || selectedCategory !== 'All' || selectedEquipment !== 'All') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setSelectedEquipment('All');
                  setShowOnlyFavorites(false);
                }}
                className="mt-2 text-xs text-amber-400 underline font-bold"
              >
                Reset All Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* 6. Exercise Detail Page / Modal */}
      {activeDetailExercise && (
        <ExerciseDetailModal
          exercise={activeDetailExercise}
          onClose={() => setActiveDetailExercise(null)}
          onStartExercise={(ex) => {
            setActiveDetailExercise(null);
            if (onStartExercise) onStartExercise(ex);
          }}
        />
      )}
    </div>
  );
};
