import React, { useState } from 'react';
import { Sparkles, CheckCircle2, ArrowRight, UserCheck, Dumbbell, Target } from 'lucide-react';
import { hapticTap } from '../../utils/audioHaptics';

interface FirstLoginModalProps {
  clientName: string;
  initialHeightCm?: number;
  initialWeightKg?: number;
  initialGoal?: string;
  initialGoalWeightKg?: number;
  trainerName?: string;
  onComplete: (data: {
    heightCm: number;
    startingWeightKg: number;
    goal: string;
    goalWeightKg: number;
  }) => void;
}

export const FirstLoginModal: React.FC<FirstLoginModalProps> = ({
  clientName = 'Arun',
  initialHeightCm = 170,
  initialWeightKg = 108,
  initialGoal = 'Weight Loss',
  initialGoalWeightKg = 80,
  trainerName = 'Coach Ravi',
  onComplete
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [heightCm, setHeightCm] = useState(initialHeightCm);
  const [weightKg, setWeightKg] = useState(initialWeightKg);
  const [goal, setGoal] = useState(initialGoal);
  const [goalWeightKg, setGoalWeightKg] = useState(initialGoalWeightKg);

  const handleContinue = () => {
    hapticTap();
    setStep(2);
  };

  const handleFinish = () => {
    hapticTap();
    onComplete({
      heightCm,
      startingWeightKg: weightKg,
      goal,
      goalWeightKg
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fadeIn">
      <div className="relative w-full max-w-sm bg-[#0c101a] border border-amber-500/40 rounded-3xl p-6 text-left shadow-[0_20px_60px_rgba(245,158,11,0.25)] overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

        {step === 1 ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-tech font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-4 h-4" />
              <span>Member Onboarding</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-white font-display">
                Welcome {clientName} 👋
              </h2>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                Let's complete your official physique profile before training begins.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {/* Height */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3">
                <label className="text-[10px] font-tech uppercase text-slate-400 font-bold block mb-1">
                  Height
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="text-xl font-black text-white font-tech bg-transparent outline-none w-24"
                  />
                  <span className="text-xs font-bold text-slate-400">cm</span>
                </div>
              </div>

              {/* Starting Weight */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3">
                <label className="text-[10px] font-tech uppercase text-slate-400 font-bold block mb-1">
                  Starting Weight
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="text-xl font-black text-amber-400 font-tech bg-transparent outline-none w-24"
                  />
                  <span className="text-xs font-bold text-slate-400">kg</span>
                </div>
              </div>

              {/* Goal */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3">
                <label className="text-[10px] font-tech uppercase text-slate-400 font-bold block mb-1">
                  Primary Mission Goal
                </label>
                <select
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full bg-[#151a24] text-white text-xs font-bold rounded-xl p-2 border border-white/5 outline-none"
                >
                  <option value="Weight Loss">Weight Loss</option>
                  <option value="Muscle Hypertrophy">Muscle Hypertrophy</option>
                  <option value="Strength & Power">Strength & Power</option>
                  <option value="Athletic Conditioning">Athletic Conditioning</option>
                </select>
              </div>

              {/* Goal Weight */}
              <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3">
                <label className="text-[10px] font-tech uppercase text-slate-400 font-bold block mb-1">
                  Target Goal Weight
                </label>
                <div className="flex items-center justify-between">
                  <input
                    type="number"
                    value={goalWeightKg}
                    onChange={(e) => setGoalWeightKg(Number(e.target.value))}
                    className="text-xl font-black text-emerald-400 font-tech bg-transparent outline-none w-24"
                  />
                  <span className="text-xs font-bold text-slate-400">kg</span>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleContinue}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-black font-display font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5 text-center py-2">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 mx-auto flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <h3 className="text-2xl font-black text-white font-display">
                You're ready 🎉
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-xs mx-auto">
                Your profile has been saved. <span className="font-bold text-white">{trainerName}</span> will prepare your personalized workout and nutrition plan.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-white/10 rounded-2xl p-3 text-left space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Height:</span>
                <span className="font-bold text-white">{heightCm} cm</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Current Weight:</span>
                <span className="font-bold text-amber-400">{weightKg} kg</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Goal:</span>
                <span className="font-bold text-emerald-400">{goalWeightKg} kg ({goal})</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Assigned Coach:</span>
                <span className="font-bold text-slate-200">{trainerName}</span>
              </div>
            </div>

            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-black font-display font-black text-sm uppercase tracking-wider flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-95"
            >
              <span>GO TO HOME</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
