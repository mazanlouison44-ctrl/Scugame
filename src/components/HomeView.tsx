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
import { formatWeight } from '../utils/units';

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

  const recentPRs = sessions
    .flatMap((s) => s.prsAchieved || [])
    .slice(0, 4);

  return (
    <div className="w-full max-w-full space-y-4 pb-28 animate-pop">
      {/* Top Bar: Greeting + Level + Offline indicator */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Niv. {levelInfo.level}
              </span>
              <span className="text-xs font-medium text-slate-400 truncate">
                {levelInfo.title}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white mt-1 truncate">
              Salut, {profile.name}
            </h1>
          </div>

          <div className="text-right shrink-0">
            {!isOnline && (
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[11px] font-semibold mb-1">
                <WifiOff className="w-3 h-3" />
                <span>Hors-ligne</span>
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

      {/* Direct "Ajouter à l'écran d'accueil" button on Home screen */}
      {!isStandalone && (
        <button
          type="button"
          onClick={onAddToHomeScreen}
          className="w-full py-3.5 px-4 rounded-2xl bg-slate-900 active:bg-slate-800 border border-emerald-500/40 text-left transition flex items-center justify-between gap-3 shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-white truncate">
                Ajouter à l’écran d’accueil
              </div>
              <div className="text-xs text-slate-400 truncate">
                Installer l’application sur ton téléphone
              </div>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-emerald-400 shrink-0" />
        </button>
      )}

      {/* Resume Draft Banner if a workout is currently in progress */}
      {activeDraft && (
        <div className="bg-amber-500/15 border-2 border-amber-500/50 rounded-2xl p-3.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1">
              <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Séance en cours</span>
            </span>
            <p className="text-sm font-bold text-white mt-0.5 truncate">
              {activeDraft.title} ({activeDraft.exercises.length} ex.)
            </p>
          </div>
          <button
            type="button"
            onClick={onResumeDraft}
            className="px-4 py-2.5 rounded-xl bg-amber-400 active:bg-amber-300 text-slate-950 font-extrabold text-xs shrink-0 transition"
          >
            Reprendre
          </button>
        </div>
      )}

      {/* Primary CTA: Commencer une séance */}
      <button
        type="button"
        onClick={onStartEmptyWorkout}
        className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 active:scale-[0.99] text-slate-950 font-extrabold text-base sm:text-lg shadow-lg shadow-emerald-500/20 transition flex items-center justify-between gap-2"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-slate-950/15 flex items-center justify-center shrink-0">
            <Play className="w-6 h-6 fill-slate-950 text-slate-950 ml-0.5" />
          </div>
          <div className="text-left min-w-0">
            <div className="leading-tight truncate">Commencer une séance</div>
            <div className="text-xs font-semibold text-slate-900/80 truncate">
              100+ exercices classés ou séance libre
            </div>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-slate-950 shrink-0" />
      </button>

      {/* Weekly Regularity & Streak Card */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <Flame className="w-5 h-5 text-amber-400 fill-amber-400/20 shrink-0" />
            <h2 className="text-sm font-bold text-white truncate">
              Régularité de la semaine
            </h2>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 shrink-0">
            {weeklyStats.activeWeeksStreak > 0
              ? `${weeklyStats.activeWeeksStreak} sem. active${
                  weeklyStats.activeWeeksStreak > 1 ? 's' : ''
                }`
              : 'Nouvelle série'}
          </span>
        </div>

        {/* Dynamic Visual Weekly Slots matching profile.weeklyTarget */}
        <div
          className="grid gap-2 mb-2.5"
          style={{
            gridTemplateColumns: `repeat(${Math.max(
              1,
              profile.weeklyTarget
            )}, minmax(0, 1fr))`,
          }}
        >
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

        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-300 font-medium">
            {weeklyStats.encouragementMessage}
          </span>
          <span className="font-bold text-emerald-400 shrink-0">
            {weeklyStats.sessionsThisWeek} / {profile.weeklyTarget}
          </span>
        </div>
      </div>

      {/* Suggested Next Session + Automatic Goals Preview */}
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-4 space-y-3.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <Target className="w-4 h-4 shrink-0" />
              <span>Prochaine séance suggérée</span>
            </div>
            <h2 className="text-base font-extrabold text-white mt-0.5 break-words">
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
            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 active:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 font-bold text-xs shrink-0 transition flex items-center gap-1.5"
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
                className="bg-slate-950/80 active:bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-2 cursor-pointer transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-100 truncate">
                    {ex.name}
                  </div>
                  {goal ? (
                    <div className="text-xs text-emerald-400 font-medium truncate mt-0.5">
                      Défi : {goal.title}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 truncate mt-0.5">
                      Première fois — trouve ta charge
                    </div>
                  )}
                </div>
                {goal && (
                  <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shrink-0">
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
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <h2 className="text-sm font-bold text-white truncate">
              Missions de la semaine
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 shrink-0">
            {missions.filter((m) => m.completed).length}/{missions.length}
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
                  <span className="flex items-center gap-1.5 text-slate-100 min-w-0">
                    {mission.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Dumbbell className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <span className="truncate">{mission.title}</span>
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
                  <span className="text-[11px] font-semibold text-slate-400 shrink-0">
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
            <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
            <h2 className="text-sm font-bold text-white">
              Derniers records personnels
            </h2>
          </div>
        </div>

        {recentPRs.length === 0 ? (
          <p className="text-xs text-slate-400 py-1">
            Tes prochains records personnels s’afficheront ici dès ta deuxième séance sur un exercice.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {recentPRs.map((pr) => (
              <div
                key={pr.id}
                onClick={() => onOpenExerciseProgress(pr.exerciseId)}
                className="bg-slate-950/80 active:bg-slate-950 border border-slate-800 rounded-xl p-3 cursor-pointer transition min-w-0"
              >
                <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
                  <Trophy className="w-3 h-3 shrink-0" /> Record
                </div>
                <div className="text-xs font-bold text-white truncate mt-0.5">
                  {pr.exerciseName}
                </div>
                <div className="text-sm font-extrabold text-emerald-400 mt-1 truncate">
                  {pr.weight > 0
                    ? `${formatWeight(pr.weight, profile.unit)} × ${pr.reps}`
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
