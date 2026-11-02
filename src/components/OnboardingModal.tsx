import React, { useState } from 'react';
import { Dumbbell, Sparkles, Check, ArrowRight } from 'lucide-react';
import { WeightUnit } from '../types';

interface OnboardingModalProps {
  onCompleteFresh: (name: string, unit: WeightUnit, weeklyTarget: number) => void;
  onLoadDemo: (name: string, unit: WeightUnit, weeklyTarget: number) => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onCompleteFresh,
  onLoadDemo,
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState<WeightUnit>('kg');
  const [weeklyTarget, setWeeklyTarget] = useState<number>(3);

  const finalName = name.trim() || 'Athlète';

  return (
    <div className="fixed inset-0 z-50 bg-[#0b0f19] flex flex-col justify-between p-6 overflow-y-auto">
      <div className="max-w-md w-full mx-auto my-auto space-y-6 py-4 animate-pop">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <Dumbbell className="w-9 h-9 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white mt-3">
            Bienvenue sur ScuGame
          </h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Enregistre ta séance en quelques secondes, vois tes progrès et découvre ton prochain petit défi.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Ton prénom ou pseudo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Alex"
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-4 py-3 text-base text-white placeholder-slate-600 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Unité de poids
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['kg', 'lbs'] as WeightUnit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  onClick={() => setUnit(u)}
                  className={`py-3 px-4 rounded-xl font-bold text-sm border transition flex items-center justify-center gap-2 ${
                    unit === u
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {unit === u && <Check className="w-4 h-4" />}
                  {u === 'kg' ? 'Kilogrammes (kg)' : 'Livres (lbs)'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Rythme souhaité par semaine
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setWeeklyTarget(num)}
                  className={`py-3 rounded-xl font-bold text-sm border transition ${
                    weeklyTarget === num
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {num}× / sem
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Aucune pression : l’objectif s’adapte à ton rythme sans pénalité en cas de pause.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => onCompleteFresh(finalName, unit, weeklyTarget)}
            className="w-full py-4 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
          >
            <span>Commencer mon suivi</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={() => onLoadDemo(finalName, unit, weeklyTarget)}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Pré-remplir avec 5 séances de démo (recommandé pour tester)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
