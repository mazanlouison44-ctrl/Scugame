import React, { useState } from 'react';
import {
  User,
  Award,
  Smartphone,
  Share,
  PlusSquare,
  Download,
  Upload,
  Sparkles,
  RotateCcw,
  Check,
  Flame,
  Zap,
  Trophy,
  Target,
  CalendarCheck,
  ShieldCheck,
} from 'lucide-react';
import { UserProfile, WeightUnit, WorkoutSession } from '../types';
import { BADGES } from '../data/exercises';
import { getLevelInfo } from '../utils/gamification';

interface ProfileViewProps {
  profile: UserProfile;
  sessions: WorkoutSession[];
  canInstallPWA: boolean;
  onTriggerInstallPWA: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
  onLoadDemo: () => void;
  onResetAll: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  profile,
  sessions,
  canInstallPWA,
  onTriggerInstallPWA,
  onUpdateProfile,
  onLoadDemo,
  onResetAll,
  onExportJSON,
  onImportJSON,
}) => {
  const [showInstallGuide, setShowInstallGuide] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  const levelInfo = getLevelInfo(profile.xp);

  const renderBadgeIcon = (iconName: string, unlocked: boolean) => {
    const cls = `w-5 h-5 ${unlocked ? 'text-emerald-400' : 'text-slate-600'}`;
    switch (iconName) {
      case 'Flame':
        return <Flame className={cls} />;
      case 'Zap':
        return <Zap className={cls} />;
      case 'Trophy':
        return <Trophy className={cls} />;
      case 'Target':
        return <Target className={cls} />;
      case 'CalendarCheck':
        return <CalendarCheck className={cls} />;
      case 'ShieldCheck':
        return <ShieldCheck className={cls} />;
      case 'Sparkles':
        return <Sparkles className={cls} />;
      default:
        return <Award className={cls} />;
    }
  };

  return (
    <div className="space-y-5 pb-28 animate-pop">
      {/* User Summary Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-slate-950 font-extrabold text-xl shrink-0">
          {profile.name.slice(0, 1).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              onUpdateProfile({ ...profile, name: e.target.value })
            }
            className="bg-transparent text-lg font-extrabold text-white focus:outline-none focus:border-b border-emerald-500 w-full truncate"
          />
          <div className="text-xs text-emerald-400 font-bold mt-0.5">
            Niveau {levelInfo.level} • {levelInfo.title} ({profile.xp} XP)
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {sessions.length} séance(s) enregistrée(s)
          </div>
        </div>
      </div>

      {/* PWA Mobile Installation Card (Section 9 of Brief) */}
      <div className="bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-white">
                Installer l’application sur ton téléphone
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Accès plein écran depuis l’écran d’accueil, même hors-ligne en salle.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canInstallPWA && (
            <button
              type="button"
              onClick={onTriggerInstallPWA}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Installer maintenant</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowInstallGuide((v) => !v)}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-950/90 hover:bg-slate-950 border border-slate-700 text-slate-200 font-bold text-xs transition"
          >
            {showInstallGuide
              ? 'Masquer les instructions'
              : 'Comment ajouter sur iPhone / Android'}
          </button>
        </div>

        {showInstallGuide && (
          <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-3 text-xs text-slate-300">
            <div>
              <div className="font-extrabold text-white mb-1 flex items-center gap-1.5">
                <span>Sur iPhone :</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>
                  Ouvrir le site dans <strong className="text-slate-200">Safari</strong>.
                </li>
                <li>
                  Toucher le bouton <strong className="text-slate-200">Partager</strong>{' '}
                  <Share className="w-3.5 h-3.5 inline text-emerald-400" />.
                </li>
                <li>
                  Choisir <strong className="text-slate-200">« Sur l’écran d’accueil »</strong>{' '}
                  <PlusSquare className="w-3.5 h-3.5 inline text-emerald-400" />.
                </li>
                <li>
                  Si l’option est cachée, toucher <strong className="text-slate-200">« Plus »</strong> ou faire défiler la liste.
                </li>
                <li>
                  Valider avec <strong className="text-slate-200">« Ajouter »</strong>.
                </li>
              </ol>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <div className="font-extrabold text-white mb-1">
                Sur Android (Chrome) :
              </div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>
                  Ouvre le menu <strong className="text-slate-200">⋮</strong> en haut à droite.
                </li>
                <li>
                  Appuie sur <strong className="text-slate-200">Installer l’application</strong> ou{' '}
                  <strong className="text-slate-200">Ajouter à l’écran d’accueil</strong>.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* Preferences: Units (kg / lbs), Weekly Goal, Rest Timer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-4">
        <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-400" />
          <span>Préférences & Objectifs</span>
        </h2>

        {/* Units toggle */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2">
            Unité de mesure des charges
          </label>
          <div className="grid grid-cols-2 gap-2">
            {(['kg', 'lbs'] as WeightUnit[]).map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => onUpdateProfile({ ...profile, unit: u })}
                className={`py-2.5 px-3 rounded-xl text-xs font-extrabold border transition flex items-center justify-center gap-1.5 ${
                  profile.unit === u
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {profile.unit === u && <Check className="w-3.5 h-3.5" />}
                {u === 'kg' ? 'Kilogrammes (kg)' : 'Livres (lbs)'}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly target */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2">
            Objectif de séances par semaine
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[2, 3, 4, 5].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() =>
                  onUpdateProfile({ ...profile, weeklyTarget: num })
                }
                className={`py-2.5 rounded-xl text-xs font-extrabold border transition ${
                  profile.weeklyTarget === num
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {num} / sem
              </button>
            ))}
          </div>
        </div>

        {/* Default Rest Timer */}
        <div>
          <label className="block text-xs font-bold text-slate-400 mb-2">
            Chronomètre de repos par défaut
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[60, 90, 120, 180].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() =>
                  onUpdateProfile({ ...profile, restTimerSeconds: sec })
                }
                className={`py-2.5 rounded-xl text-xs font-extrabold border transition ${
                  profile.restTimerSeconds === sec
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Badges Gallery */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Badges de progression</span>
          </h2>
          <span className="text-xs font-bold text-emerald-400">
            {profile.unlockedBadges.length} / {BADGES.length}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {BADGES.map((badge) => {
            const unlocked = profile.unlockedBadges.includes(badge.id);
            return (
              <div
                key={badge.id}
                className={`p-3 rounded-xl border transition ${
                  unlocked
                    ? 'bg-slate-950 border-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      unlocked ? 'bg-emerald-500/15' : 'bg-slate-900'
                    }`}
                  >
                    {renderBadgeIcon(badge.icon, unlocked)}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      unlocked
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    +{badge.xpBonus} XP
                  </span>
                </div>
                <div className="text-xs font-bold text-white">
                  {badge.title}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                  {badge.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Management & Demo Data */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Données locales & Sauvegarde
        </h2>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onExportJSON}
            className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exporter JSON</span>
          </button>

          <label className="py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition">
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Importer JSON</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImportJSON(file);
              }}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={onLoadDemo}
          className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Charger les séances d’exemple (Démo)</span>
        </button>

        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-rose-500/10 border border-slate-800 text-xs font-semibold text-rose-400 flex items-center justify-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réinitialiser toutes les données</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setConfirmReset(false);
                onResetAll();
              }}
              className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-xs font-extrabold"
            >
              Confirmer la suppression
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
            >
              Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
