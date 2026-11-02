import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  Target,
  CheckCircle2,
  ArrowRight,
  Clock,
  Dumbbell,
  Award,
  Plus,
  Minus,
} from 'lucide-react';
import {
  Exercise,
  ExerciseGoal,
  UserProfile,
  WorkoutSession,
} from '../types';
import { getLevelInfo } from '../utils/gamification';
import { BADGES } from '../data/exercises';
import {
  displayWeight,
  formatDuration,
  formatWeight,
  getStepIncrement,
  toInternalKg,
} from '../utils/units';

interface WorkoutSummaryViewProps {
  session: WorkoutSession;
  profile: UserProfile;
  leveledUp: boolean;
  newlyUnlockedBadges: string[];
  nextGoals: Record<string, ExerciseGoal>;
  exercises: Exercise[];
  onUpdateGoal: (exerciseId: string, updatedGoal: ExerciseGoal) => void;
  onDone: () => void;
}

export const WorkoutSummaryView: React.FC<WorkoutSummaryViewProps> = ({
  session,
  profile,
  leveledUp,
  newlyUnlockedBadges,
  nextGoals,
  exercises,
  onUpdateGoal,
  onDone,
}) => {
  const levelInfo = getLevelInfo(profile.xp);

  useEffect(() => {
    // Discreet, short celebration on workout completion, PR, or level up
    try {
      confetti({
        particleCount: leveledUp || session.prsAchieved.length > 0 ? 55 : 28,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#10b981', '#34d399', '#fbbf24'],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignore if canvas-confetti fails in headless environments
    }
  }, [leveledUp, session.prsAchieved.length]);

  const totalSets = session.exercises.reduce(
    (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
    0
  );

  const handleAdjustGoalReps = (exId: string, delta: number) => {
    const g = nextGoals[exId];
    const ex = exercises.find((e) => e.id === exId);
    if (!g || !ex) return;
    const nextReps = Math.max(1, g.targetReps + delta);
    const updated: ExerciseGoal = {
      ...g,
      targetReps: nextReps,
      title:
        g.targetWeight > 0
          ? `${g.targetSets} × ${nextReps} rép à ${formatWeight(
              g.targetWeight,
              profile.unit
            )}`
          : `${g.targetSets} × ${nextReps} rép`,
    };
    onUpdateGoal(exId, updated);
  };

  const handleAdjustGoalWeight = (exId: string, deltaDisplay: number) => {
    const g = nextGoals[exId];
    const ex = exercises.find((e) => e.id === exId);
    if (!g || !ex) return;
    const currDisp = displayWeight(g.targetWeight, profile.unit);
    const nextDisp = Math.max(0, currDisp + deltaDisplay);
    const nextKg = toInternalKg(nextDisp, profile.unit);
    const updated: ExerciseGoal = {
      ...g,
      targetWeight: nextKg,
      title: `${g.targetSets} × ${g.targetReps} rép à ${formatWeight(
        nextKg,
        profile.unit
      )}`,
    };
    onUpdateGoal(exId, updated);
  };

  return (
    <div className="space-y-5 pb-28 animate-pop">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-emerald-500/20 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 animate-pulse-glow">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            Séance enregistrée
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-0.5">
            Bravo, {profile.name} !
          </h1>
          <p className="text-xs text-slate-300 mt-1">{session.title}</p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> Durée
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {formatDuration(session.durationSeconds)}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
            <div className="text-[11px] text-slate-400 flex items-center justify-center gap-1">
              <Dumbbell className="w-3 h-3" /> Séries
            </div>
            <div className="text-sm font-extrabold text-white mt-0.5">
              {totalSets} validées
            </div>
          </div>

          <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-2.5">
            <div className="text-[11px] text-emerald-300 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Expérience
            </div>
            <div className="text-sm font-extrabold text-emerald-400 mt-0.5">
              +{session.xpEarned} XP
            </div>
          </div>
        </div>
      </div>

      {/* Level Up & XP Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 text-xs font-extrabold">
              Niveau {levelInfo.level}
            </span>
            <span className="text-sm font-bold text-white">
              {levelInfo.title}
            </span>
          </div>
          {leveledUp && (
            <span className="text-xs font-extrabold text-amber-400 animate-bounce">
              Niveau supérieur !
            </span>
          )}
        </div>
        <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-700"
            style={{ width: `${levelInfo.progressPercent}%` }}
          />
        </div>
        <div className="text-[11px] text-slate-400 flex justify-between">
          <span>Progression du niveau</span>
          <span>
            {levelInfo.currentLevelXp} / {levelInfo.nextLevelXp} XP
          </span>
        </div>
      </div>

      {/* Newly Unlocked Badges */}
      {newlyUnlockedBadges.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-300">
            <Award className="w-4 h-4" />
            <span>Nouveau(x) badge(s) débloqué(s) !</span>
          </div>
          <div className="space-y-2">
            {newlyUnlockedBadges.map((bId) => {
              const badge = BADGES.find((b) => b.id === bId);
              if (!badge) return null;
              return (
                <div
                  key={bId}
                  className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <div className="text-sm font-bold text-white">
                      {badge.title}
                    </div>
                    <div className="text-xs text-slate-300">
                      {badge.description}
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-amber-400 shrink-0 ml-2">
                    +{badge.xpBonus} XP
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personal Records Achieved */}
      {session.prsAchieved.length > 0 && (
        <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-amber-400">
            <Trophy className="w-4 h-4" />
            <span>
              {session.prsAchieved.length} Record(s) Personnel(s) Battu(s) !
            </span>
          </div>
          <div className="space-y-2">
            {session.prsAchieved.map((pr) => (
              <div
                key={pr.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white">
                    {pr.exerciseName}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Nouvelle référence enregistrée
                  </div>
                </div>
                <div className="text-sm font-extrabold text-emerald-400">
                  {pr.weight > 0
                    ? `${formatWeight(pr.weight, profile.unit)} × ${pr.reps}`
                    : `${pr.reps} rép`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Session Automatic Goals Prepared */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3.5">
        <div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-400">
            <Target className="w-4 h-4" />
            <span>Objectifs préparés pour ta prochaine séance</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Calculés automatiquement selon tes séries et ton ressenti. Tu peux les ajuster librement :
          </p>
        </div>

        <div className="space-y-3">
          {session.exercises.map((exLog) => {
            const ex = exercises.find((e) => e.id === exLog.exerciseId);
            const goal = nextGoals[exLog.exerciseId];
            if (!ex || !goal) return null;
            const stepW = getStepIncrement(ex.defaultIncrementKg, profile.unit);

            return (
              <div
                key={exLog.id}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-white">
                      {ex.name}
                    </div>
                    <div className="text-xs font-extrabold text-emerald-400 mt-0.5">
                      Prochain défi : {goal.title}
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">
                    {goal.badgeText}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-snug">
                  {goal.reason}
                </p>

                {/* Quick adjustment controls for next goal */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
                  <span className="text-[11px] text-slate-400">
                    Ajuster l’objectif :
                  </span>
                  <div className="flex items-center gap-2">
                    {ex.equipment !== 'Poids du corps' && (
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustGoalWeight(ex.id, -stepW)
                          }
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-slate-200 text-[11px]">
                          {formatWeight(goal.targetWeight, profile.unit)}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleAdjustGoalWeight(ex.id, stepW)
                          }
                          className="p-1 text-slate-400 hover:text-white"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-1.5 py-1">
                      <button
                        type="button"
                        onClick={() => handleAdjustGoalReps(ex.id, -1)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-slate-200 text-[11px]">
                        {goal.targetReps} rép
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAdjustGoalReps(ex.id, 1)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Return to Dashboard Button */}
      <button
        type="button"
        onClick={onDone}
        className="w-full py-4 px-5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
      >
        <span>Valider et retour à l’accueil</span>
        <ArrowRight className="w-5 h-5" />
      </button>
    </div>
  );
};
