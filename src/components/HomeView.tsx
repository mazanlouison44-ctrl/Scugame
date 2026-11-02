import React from 'react';
import {
  Play,
  Flame,
  Trophy,
  Target,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  Dumbbell,
  RotateCcw,
  WifiOff,
  Smartphone,
} from 'lucide-react';
import {
  ActiveWorkoutDraft,
  Exercise,
  ExerciseGoal,
  UserProfile,
  WorkoutSession,
} from '../types';
import {
  getActiveMissions,
  getLevelInfo,
  getWeeklyStats,
} from '../utils/gamification';
import { SUGGESTED_TEMPLATES } from '../data/exercises';

interface HomeViewProps {
  profile: UserProfile;
  sessions: WorkoutSession[];
  exercises: Exercise[];
  goals: Record<string, ExerciseGoal>;
  activeDraft: ActiveWorkoutDraft | null;
  isOnline: boolean;
  isStandalone: boolean;
  onAddToHomeScreen: () => void;
  onStartEmptyWorkout: () => void;
  onStartSuggestedWorkout: (title: string, exerciseIds: string[]) => void;
  onResumeDraft: () => void;
  onOpenExerciseProgress: (exerciseId: string) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  sessions,
  exercises,
  goals,
  activeDraft,
  isOnline,
  isStandalone,
  onAddToHomeScreen,
  onStartEmptyWorkout,
  onStartSuggestedWorkout,
  onResumeDraft,
  onOpenExerciseProgress,
}) => {
  const levelInfo = getLevelInfo(profile.xp);
  const weeklyStats = getWeeklyStats(sessions, profile.weeklyTarget);
  const missions = getActiveMissions(sessions, profile);

  // Determine suggested next workout based on rotation or last session
  const lastSession = sessions[0];
  let suggestedTemplate = SUGGESTED_TEMPLATES[0];
  if (lastSession) {
    const lastIdx = SUGGESTED_TEMPLATES.findIndex(
      (t) => t.title === lastSession.title
    );
    if (lastIdx !== -1) {
      suggestedTemplate =
        SUGGESTED_TEMPLATES[(lastIdx + 1) % SUGGESTED_TEMPLATES.length];
    } else {
      suggestedTemplate = SUGGESTED_TEMPLATES[1];
    }
  }

  // Gather latest Personal Records across all sessions
  const recentPRs = sessions
    .flatMap((s) => s.prsAchieved || [])
    .slice(0, 4);

  return (
    <div className="space-y-4 pb-28 animate-pop">
      {/* Top Bar: Greeting + Level + Offline indicator */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Niv. {levelInfo.level}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {levelInfo.title}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-white mt-1">
              Salut, {profile.name}
            </h1>
          </div>

          <div className="text-right">
            {!isOnline && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-semibold mb-1">
                <WifiOff className="w-3 h-3" />
                <span>Hors-ligne actif</span>
              </div>
            )}
            <div className="text-xs font-bold text-emerald-400">
              {profile.xp} XP total
            </div>
            <div className="text-[11px] text-slate-400">
              {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mt-3 w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>
      </div>

      {/* Direct "Ajouter à l'écran d'accueil" button on Home screen (hidden if already installed in standalone mode) */}
      {!isStandalone && (
        <button
          type="button"
          onClick={onAddToHomeScreen}
          className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800/90 active:scale-[0.99] border border-emerald-500/40 text-left transition flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-extrabold text-white">
                Ajouter à l’écran d’accueil
              </div>
              <div className="text-xs text-slate-400">
                Installer l’application en plein écran (iPhone & Android)
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" />
        </button>
      )}

      {/* Resume Draft Banner if a workout is currently in progress */}
      {activeDraft && (
        <div className="bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-4 flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> Séance sauvegardée en cours
            </span>
            <p className="text-base font-bold text-white mt-0.5">
              {activeDraft.title} ({activeDraft.exercises.length} ex.)
            </p>
          </div>
          <button
            type="button"
            onClick={onResumeDraft}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm shrink-0 transition"
          >
            Reprendre
          </button>
        </div>
      )}

      {/* Primary CTA: Commencer une séance */}
      <button
        type="button"
        onClick={onStartEmptyWorkout}
        className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 active:scale-[0.99] text-slate-950 font-extrabold text-lg shadow-lg shadow-emerald-500/20 transition flex items-center justify-between group"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-slate-950/15 flex items-center justify-center">
            <Play className="w-6 h-6 fill-slate-950 text-slate-950 ml-0.5" />
          </div>
          <div className="text-left">
            <div className="leading-tight">Commencer une séance</div>
            <div className="text-xs font-semibold text-slate-900/80">
              100+ exercices classés ou séance libre
            </div>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-slate-950 group-hover:translate-x-0.5 transition" />
      </button>

      {/* Weekly Regularity & Streak Card */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20" />
            <h2 className="text-sm font-bold text-white">
              Régularité de la semaine
            </h2>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
            {weeklyStats.activeWeeksStreak > 0
              ? `${weeklyStats.activeWeeksStreak} sem. régulière${
                  weeklyStats.activeWeeksStreak > 1 ? 's' : ''
                }`
              : 'Nouvelle série'}
          </span>
        </div>

        {/* Visual Weekly Slots */}
        <div className="grid grid-cols-5 gap-2 mb-2.5">
          {Array.from({ length: profile.weeklyTarget }).map((_, idx) => {
            const done = idx < weeklyStats.sessionsThisWeek;
            return (
              <div
                key={idx}
                className={`h-3 rounded-full transition-all ${
                  done
                    ? 'bg-emerald-400 shadow-sm shadow-emerald-500/40'
                    : 'bg-slate-800'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">
            {weeklyStats.encouragementMessage}
          </span>
          <span className="font-bold text-emerald-400 shrink-0 ml-2">
            {weeklyStats.sessionsThisWeek} / {profile.weeklyTarget}
          </span>
        </div>
      </div>

      {/* Suggested Next Session + Automatic Goals Preview */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Target className="w-4 h-4" />
              <span>Prochaine séance suggérée</span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-0.5">
              {suggestedTemplate.title}
            </h2>
            <p className="text-xs text-slate-400">
              {suggestedTemplate.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              onStartSuggestedWorkout(
                suggestedTemplate.title,
                suggestedTemplate.exerciseIds
              )
            }
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs shrink-0 transition flex items-center gap-1.5"
          >
            <Play className="w-3.5 h-3.5 fill-emerald-300" />
            <span>Lancer</span>
          </button>
        </div>

        {/* Exercise list with their next automatic goal */}
        <div className="space-y-2">
          {suggestedTemplate.exerciseIds.map((exId) => {
            const ex = exercises.find((e) => e.id === exId);
            if (!ex) return null;
            const goal = goals[exId];
            return (
              <div
                key={exId}
                onClick={() => onOpenExerciseProgress(exId)}
                className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2 cursor-pointer transition"
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-slate-100 truncate">
                    {ex.name}
                  </div>
                  {goal ? (
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 mt-0.5">
                      <span>Défi : {goal.title}</span>
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 mt-0.5">
                      Première fois — trouve ta charge confortable
                    </div>
                  )}
                </div>
                {goal && (
                  <span className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
                    {goal.badgeText}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Petites Missions de la semaine */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">
              Petites missions de la semaine
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">
            {missions.filter((m) => m.completed).length}/{missions.length} complétées
          </span>
        </div>

        <div className="space-y-2.5">
          {missions.map((mission) => {
            const pct = Math.min(
              100,
              Math.round((mission.current / mission.target) * 100)
            );
            return (
              <div
                key={mission.id}
                className={`p-3 rounded-xl border ${
                  mission.completed
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-950/70 border-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between gap-2 text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-100">
                    {mission.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Dumbbell className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    {mission.title}
                  </span>
                  <span className="text-emerald-400 shrink-0">
                    +{mission.xpReward} XP
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {mission.current}/{mission.target}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Derniers Records Personnels (PRs) */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">
              Derniers records personnels
            </h2>
          </div>
        </div>

        {recentPRs.length === 0 ? (
          <p className="text-xs text-slate-400 py-2">
            Tes prochains records personnels s’afficheront ici dès ta deuxième séance sur un exercice.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {recentPRs.map((pr) => (
              <div
                key={pr.id}
                onClick={() => onOpenExerciseProgress(pr.exerciseId)}
                className="bg-slate-950/80 hover:bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer transition"
              >
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  <Trophy className="w-3 h-3" /> Record
                </div>
                <div className="text-xs font-bold text-white truncate mt-0.5">
                  {pr.exerciseName}
                </div>
                <div className="text-sm font-extrabold text-emerald-400 mt-1">
                  {pr.weight > 0
                    ? `${pr.weight} ${profile.unit} × ${pr.reps}`
                    : `${pr.reps} rép`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
