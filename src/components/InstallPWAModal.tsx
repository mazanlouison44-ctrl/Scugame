import React from 'react';
import { Smartphone, Share, PlusSquare, X, Check } from 'lucide-react';

interface InstallPWAModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPWAModal: React.FC<InstallPWAModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-[#0b0f19] border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90dvh] overflow-y-auto p-5 safe-bottom space-y-4 animate-pop">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-extrabold text-white">
                Ajouter à l’écran d’accueil
              </h3>
              <p className="text-xs text-slate-400">
                Ouvre ScuGame en plein écran comme une application
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white shrink-0"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* iPhone Instructions (Exact 5 steps from the brief) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            Sur iPhone (iOS)
          </div>

          <ol className="space-y-2.5 text-sm text-slate-200">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <span>
                Ouvrir le site dans <strong>Safari</strong>.
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <span className="flex items-center flex-wrap gap-1.5">
                <span>Toucher le bouton</span>
                <strong className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 text-xs">
                  <Share className="w-3.5 h-3.5" /> Partager
                </strong>
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <span className="flex items-center flex-wrap gap-1.5">
                <span>Choisir</span>
                <strong className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-emerald-300 text-xs">
                  <PlusSquare className="w-3.5 h-3.5" /> Sur l’écran d’accueil
                </strong>
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <span>
                Si l’option est cachée, toucher <strong>« Plus »</strong> ou faire défiler la liste.
              </span>
            </li>

            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">
                5
              </span>
              <span className="flex items-center flex-wrap gap-1.5">
                <span>Valider avec</span>
                <strong className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500 text-slate-950 text-xs font-extrabold">
                  <Check className="w-3.5 h-3.5" /> Ajouter
                </strong>
              </span>
            </li>
          </ol>
        </div>

        {/* Android Fallback Note */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3.5 text-xs text-slate-300 space-y-1">
          <div className="font-extrabold text-white">Sur Android (Chrome) :</div>
          <p className="text-slate-400">
            Touche le menu <strong className="text-slate-200">⋮</strong> en haut à droite du navigateur puis sélectionne{' '}
            <strong className="text-slate-200">« Installer l’application »</strong> ou{' '}
            <strong className="text-slate-200">« Ajouter à l’écran d’accueil »</strong>.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-3.5 rounded-2xl bg-emerald-500 active:bg-emerald-400 text-slate-950 font-extrabold text-sm transition"
        >
          J’ai compris
        </button>
      </div>
    </div>
  );
};
